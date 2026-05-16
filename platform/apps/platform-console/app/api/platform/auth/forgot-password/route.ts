import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, fail, parseJsonBody, rateLimitRequest, requireSameOrigin, withNoStore } from "@/lib/server/platform-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimited = rateLimitRequest(request, "auth:forgot-password", { limit: 5, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  let payload: { email?: string };
  try {
    payload = await parseJsonBody<{ email?: string }>(request, 8 * 1024);
  } catch (error) {
    return apiErrorResponse(error, "invalid_forgot_password_payload", "找回密码请求格式不正确。");
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@")) {
    return fail(400, "validation_failed", "邮箱格式不正确。");
  }
  return withNoStore(NextResponse.json({
    data: {
      email,
      deliveryChannel: "email",
      expiresInMinutes: 30,
      message: "开发环境已模拟发送重置链接。"
    }
  }));
}
