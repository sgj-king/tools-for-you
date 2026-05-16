import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest, sessionHeadersFromUser } from "@/lib/server/session-auth";
import { fail, rateLimitRequest, requireSameOrigin } from "@/lib/server/platform-api";
import type { SessionUser } from "@/types/domain";

function getPlatformOpsBaseUrl() {
  return process.env.PLATFORM_OPS_BASE_URL ?? "http://ops:8080";
}

const MAX_PROXY_BODY_BYTES = 1024 * 1024;
const ADMIN_ROLES = new Set(["platform_super_admin", "ops_admin", "org_admin"]);
const FINANCE_ROLES = new Set(["platform_super_admin", "ops_admin", "org_admin", "finance"]);

export async function proxyToPlatformOps(request: NextRequest, upstreamPath: string) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimited = rateLimitRequest(request, `platform:${request.method}:${upstreamPath.split("?")[0]}`, {
    limit: ["GET", "HEAD"].includes(request.method.toUpperCase()) ? 600 : 120,
    windowMs: 60_000
  });
  if (rateLimited) return rateLimited;

  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return fail(401, "session_not_found", "当前未登录或会话已失效。");
  }

  if (!isAuthorizedForOps(request, upstreamPath, sessionUser)) {
    return fail(403, "insufficient_permissions", "当前账号无权执行该操作。", {
      role: sessionUser.role
    });
  }

  const upstreamUrl = new URL(upstreamPath, getPlatformOpsBaseUrl());
  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  const forwardedHeaders = new Headers();
  const requestContentType = request.headers.get("content-type");
  if (requestContentType) {
    forwardedHeaders.set("Content-Type", requestContentType);
  }
  Object.entries(sessionHeadersFromUser(sessionUser)).forEach(([key, value]) => {
    forwardedHeaders.set(key, value);
  });
  const opsToken = process.env.PLATFORM_OPS_SHARED_TOKEN?.trim();
  if (opsToken) {
    forwardedHeaders.set("x-platform-ops-token", opsToken);
  }

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_PROXY_BODY_BYTES) {
      return fail(413, "request_body_too_large", "请求体过大。");
    }
    body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_PROXY_BODY_BYTES) {
      return fail(413, "request_body_too_large", "请求体过大。");
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: forwardedHeaders,
      body,
      cache: "no-store"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: {
          code: "platform_ops_unavailable",
          message: "平台运维服务暂不可用，请确认 Ops BFF 已启动。",
          details: { upstream: upstreamUrl.toString(), cause: message }
        }
      },
      { status: 502 }
    );
  }

  const headers = new Headers();
  const responseContentType = upstream.headers.get("content-type");
  if (responseContentType) headers.set("Content-Type", responseContentType);
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("Content-Disposition", disposition);

  if (!upstream.ok && !responseContentType?.toLowerCase().includes("json")) {
    const text = await upstream.text();
    return NextResponse.json(
      {
        error: {
          code: "platform_ops_error",
          message: text || `平台运维服务请求失败，状态码 ${upstream.status}。`,
          details: { upstream: upstreamUrl.toString(), status: upstream.status }
        }
      },
      { status: upstream.status }
    );
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers
  });
}

function isAuthorizedForOps(request: NextRequest, upstreamPath: string, sessionUser: SessionUser) {
  const method = request.method.toUpperCase();
  const path = upstreamPath.split("?")[0] ?? upstreamPath;
  const role = sessionUser.role;

  if (ADMIN_ROLES.has(role)) {
    return true;
  }

  if (path.startsWith("/v1/billing/")) {
    return FINANCE_ROLES.has(role);
  }

  if (method === "GET") {
    return !isAdminOnlyReadPath(path);
  }

  if (path.startsWith("/v1/filter-presets") || path.startsWith("/v1/support/tickets")) {
    return true;
  }

  return false;
}

function isAdminOnlyReadPath(path: string) {
  return (
    path.startsWith("/v1/team/") ||
    path.startsWith("/v1/security/") ||
    path.startsWith("/v1/projects/") ||
    path.startsWith("/v1/webhooks")
  );
}
