import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, fail, parseJsonBody, rateLimitRequest, requireSameOrigin, withNoStore } from "@/lib/server/platform-api";
import { encodeSession, getSessionUserFromRequest, sessionCookieName, sessionCookieOptions, updateSessionUserProfile } from "@/lib/server/session-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AVATAR_URL_LENGTH = 700_000;
const DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/]+=*$/i;

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return fail(401, "session_not_found", "当前未登录或会话已失效。");
  }
  return withNoStore(NextResponse.json({ data: sessionUser }));
}

export async function PUT(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimited = rateLimitRequest(request, "auth:update-profile", { limit: 30, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  let payload: { displayName?: string; avatarUrl?: string | null };
  try {
    payload = await parseJsonBody<{ displayName?: string; avatarUrl?: string | null }>(request, 768 * 1024);
  } catch (error) {
    return apiErrorResponse(error, "invalid_profile_payload", "请求体不是有效的 JSON。");
  }

  if (payload.displayName !== undefined) {
    const displayName = payload.displayName.trim();
    if (displayName.length < 2 || displayName.length > 64) {
      return fail(400, "invalid_display_name", "显示姓名需为 2 到 64 个字符。");
    }
  }

  if (payload.avatarUrl !== undefined && payload.avatarUrl !== null) {
    if (!DATA_IMAGE_PATTERN.test(payload.avatarUrl) && !/^https:\/\/[^\s]+$/i.test(payload.avatarUrl)) {
      return fail(400, "invalid_avatar_url", "头像必须是 PNG/JPEG/WebP/GIF data URL 或 HTTPS 图片地址。");
    }
    if (payload.avatarUrl.length > MAX_AVATAR_URL_LENGTH) {
      return fail(413, "avatar_too_large", "头像数据过大，请上传更小的图片。");
    }
  }

  let sessionUser;
  try {
    sessionUser = await updateSessionUserProfile(request, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(500, "profile_update_failed", "更新资料失败，请稍后重试。", { cause: message });
  }
  if (!sessionUser) {
    return fail(401, "session_not_found", "当前未登录或会话已失效。");
  }

  const response = NextResponse.json({ data: sessionUser });
  response.cookies.set(sessionCookieName(), encodeSession(sessionUser), sessionCookieOptions());
  return withNoStore(response);
}
