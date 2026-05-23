import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, fail, parseJsonBody, rateLimitRequest, withNoStore } from "@/lib/server/platform-api";
import { credentialCorsHeadersForRequest, isTrustedRequestOrigin } from "@/lib/server/platform-origin";
import { encodeSession, getSessionUserFromRequest, sessionCookieName, sessionCookieOptions, updateSessionUserProfile } from "@/lib/server/session-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  const headers = credentialCorsHeadersForRequest(request, "GET, PUT, POST, OPTIONS");
  return new NextResponse(null, {
    status: isTrustedRequestOrigin(request) ? 204 : 403,
    headers
  });
}

export async function GET(request: NextRequest) {
  const corsHeaders = credentialCorsHeadersForRequest(request, "GET, PUT, POST, OPTIONS");
  if (!isTrustedRequestOrigin(request)) {
    return attachHeaders(fail(403, "origin_not_allowed", "请求来源不被允许。"), corsHeaders);
  }

  const sessionUser = await getSessionUserFromRequest(request);
  const response = NextResponse.json({
    data: {
      authenticated: Boolean(sessionUser),
      sessionUser
    }
  });
  return attachHeaders(withNoStore(response), corsHeaders);
}

export async function PUT(request: NextRequest) {
  const corsHeaders = credentialCorsHeadersForRequest(request, "GET, PUT, POST, OPTIONS");
  if (!isTrustedRequestOrigin(request)) {
    return attachHeaders(fail(403, "origin_not_allowed", "请求来源不被允许。"), corsHeaders);
  }

  const rateLimited = rateLimitRequest(request, "auth:digital-life-profile", { limit: 30, windowMs: 60_000 });
  if (rateLimited) return attachHeaders(rateLimited, corsHeaders);

  let payload: { displayName?: string; avatarUrl?: string | null };
  try {
    payload = await parseJsonBody<{ displayName?: string; avatarUrl?: string | null }>(request, 768 * 1024);
  } catch (error) {
    return attachHeaders(apiErrorResponse(error, "invalid_profile_payload", "请求体不是有效的 JSON。"), corsHeaders);
  }

  if (payload.displayName !== undefined) {
    const displayName = payload.displayName.trim();
    if (displayName.length < 2 || displayName.length > 64) {
      return attachHeaders(fail(400, "invalid_display_name", "显示姓名需为 2 到 64 个字符。"), corsHeaders);
    }
  }

  if (payload.avatarUrl !== undefined && payload.avatarUrl !== null) {
    if (!/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/]+=*$/i.test(payload.avatarUrl) && !/^https:\/\/[^\s]+$/i.test(payload.avatarUrl)) {
      return attachHeaders(fail(400, "invalid_avatar_url", "头像必须是 PNG/JPEG/WebP/GIF data URL 或 HTTPS 图片地址。"), corsHeaders);
    }
    if (payload.avatarUrl.length > 700_000) {
      return attachHeaders(fail(413, "avatar_too_large", "头像数据过大，请上传更小的图片。"), corsHeaders);
    }
  }

  const sessionUser = await updateSessionUserProfile(request, payload);
  if (!sessionUser) {
    return attachHeaders(fail(401, "session_not_found", "当前未登录或会话已失效。"), corsHeaders);
  }

  const response = NextResponse.json({
    data: {
      authenticated: true,
      sessionUser
    }
  });
  response.cookies.set(sessionCookieName(), encodeSession(sessionUser), sessionCookieOptions());
  return attachHeaders(withNoStore(response), corsHeaders);
}

export async function POST(request: NextRequest) {
  const corsHeaders = credentialCorsHeadersForRequest(request, "GET, PUT, POST, OPTIONS");
  if (!isTrustedRequestOrigin(request)) {
    return attachHeaders(fail(403, "origin_not_allowed", "请求来源不被允许。"), corsHeaders);
  }

  const action = request.nextUrl.searchParams.get("action");
  if (action !== "logout") {
    return attachHeaders(fail(400, "unsupported_action", "不支持的会话操作。"), corsHeaders);
  }

  const response = NextResponse.json({
    data: {
      authenticated: false,
      redirectTo: "/login",
      message: "已安全退出登录。"
    }
  });
  response.cookies.set(sessionCookieName(), "", sessionCookieOptions(0));
  return attachHeaders(withNoStore(response), corsHeaders);
}

function attachHeaders(response: NextResponse, headers: Headers) {
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}
