import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, fail, parseJsonBody, rateLimitRequest, requireSameOrigin, withNoStore } from "@/lib/server/platform-api";
import { resolveTrustedReturnTo } from "@/lib/server/platform-origin";
import { authenticateUser, encodeSession, sessionCookieName, sessionCookieOptions } from "@/lib/server/session-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimited = rateLimitRequest(request, "auth:login", { limit: 10, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  let payload: { email?: string; password?: string; returnTo?: string };
  try {
    payload = await parseJsonBody<{ email?: string; password?: string; returnTo?: string }>(request, 16 * 1024);
  } catch (error) {
    return apiErrorResponse(error, "invalid_login_payload", "登录请求格式不正确。");
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  const returnTo = resolveTrustedReturnTo(payload.returnTo);

  if (!email || !password) {
    return fail(400, "validation_failed", "邮箱和密码不能为空。");
  }

  const sessionUser = await authenticateUser(email, password);
  if (!sessionUser) {
    const message = process.env.APP_ENV === "production" ? "邮箱或密码不正确。" : "邮箱或密码不正确。开发环境默认账号 owner@example.com / dev-password。";
    return fail(401, "invalid_credentials", message);
  }

  const response = NextResponse.json({
    data: {
      sessionUser,
      redirectTo: returnTo ?? (sessionUser.role === "platform_super_admin" || sessionUser.role === "ops_admin" ? "/admin" : "/console"),
      returnTo: returnTo ?? undefined,
      message: "登录成功，正在进入控制台。"
    }
  });
  response.cookies.set(sessionCookieName(), encodeSession(sessionUser), sessionCookieOptions());
  return withNoStore(response);
}
