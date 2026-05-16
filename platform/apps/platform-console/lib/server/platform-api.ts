import { NextRequest, NextResponse } from "next/server";

const JSON_BODY_LIMIT_BYTES = 1024 * 1024;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json(
    {
      data,
      meta: init?.meta
    },
    { status: init?.status ?? 200 }
  );
}

export function fail(status: number, code: string, message: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

export function apiErrorResponse(error: unknown, fallbackCode = "request_failed", fallbackMessage = "请求处理失败。") {
  if (error instanceof ApiRequestError) {
    return fail(error.status, error.code, error.message, error.details);
  }
  const message = error instanceof Error ? error.message : fallbackMessage;
  return fail(500, fallbackCode, fallbackMessage, { cause: message });
}

export async function parseJsonBody<T>(request: NextRequest, maxBytes = JSON_BODY_LIMIT_BYTES): Promise<T> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > maxBytes) {
    throw new ApiRequestError(413, "request_body_too_large", "请求体过大。");
  }

  let text = "";
  try {
    text = await request.text();
  } catch {
    throw new ApiRequestError(400, "invalid_request_body", "无法读取请求体。");
  }

  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new ApiRequestError(413, "request_body_too_large", "请求体过大。");
  }

  try {
    return JSON.parse(text || "{}") as T;
  } catch {
    throw new ApiRequestError(400, "invalid_json_payload", "请求体不是有效的 JSON。");
  }
}

export function requireSameOrigin(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    return null;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return fail(403, "origin_check_failed", "无法校验请求来源。");
  }

  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "") ?? "http";
  const expected = `${proto}://${host}`;
  const allowedOrigins = new Set([expected]);
  for (const item of (process.env.PLATFORM_CONSOLE_ALLOWED_ORIGINS ?? "").split(",")) {
    const value = item.trim();
    if (value) allowedOrigins.add(value);
  }

  if (!allowedOrigins.has(origin)) {
    return fail(403, "origin_not_allowed", "请求来源不被允许。", { origin });
  }

  return null;
}

export function rateLimitRequest(
  request: NextRequest,
  scope: string,
  options: { limit: number; windowMs: number }
) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${scope}:${ip}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= options.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const response = fail(429, "rate_limited", "请求过于频繁，请稍后再试。", {
    retryAfterSeconds
  });
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

export function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
