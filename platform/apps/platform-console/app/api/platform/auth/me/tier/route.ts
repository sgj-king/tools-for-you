import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { dbExecute, dbQuery } from "@/lib/server/db";
import { apiErrorResponse, fail, parseJsonBody, rateLimitRequest, requireSameOrigin, withNoStore } from "@/lib/server/platform-api";
import { encodeSession, getSessionUserFromRequest, sessionCookieName, sessionCookieOptions } from "@/lib/server/session-auth";
import type { PlanTier } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TIERS: ReadonlySet<PlanTier> = new Set<PlanTier>(["free", "pro"]);
const ALLOWED_ROLES = new Set(["org_admin", "platform_super_admin", "ops_admin"]);

type UserOrgRow = RowDataPacket & { organization_id: number | null };

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimited = rateLimitRequest(request, "auth:update-tier", { limit: 20, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return fail(401, "session_not_found", "当前未登录或会话已失效。");
  }

  if (!ALLOWED_ROLES.has(sessionUser.role)) {
    return fail(403, "tier_change_forbidden", "仅组织管理员可以调整订阅等级。");
  }

  let payload: { tier?: string };
  try {
    payload = await parseJsonBody<{ tier?: string }>(request, 4 * 1024);
  } catch (error) {
    return apiErrorResponse(error, "invalid_tier_payload", "请求体不是有效的 JSON。");
  }

  const tier = (payload.tier ?? "").trim().toLowerCase() as PlanTier;
  if (!ALLOWED_TIERS.has(tier)) {
    return fail(400, "invalid_tier", "tier 必须是 free 或 pro。");
  }

  const rows = await dbQuery<UserOrgRow[]>(
    "SELECT organization_id FROM users WHERE id = ? LIMIT 1",
    [Number(sessionUser.id)]
  );
  const organizationId = rows[0]?.organization_id;
  if (!organizationId) {
    return fail(409, "organization_missing", "当前账号未关联组织，无法变更订阅。");
  }

  try {
    await dbExecute("UPDATE organizations SET plan_tier = ? WHERE id = ?", [tier, Number(organizationId)]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(500, "tier_update_failed", "更新订阅等级失败，请稍后重试。", { cause: message });
  }

  const refreshed = await getSessionUserFromRequest(request);
  const nextUser = refreshed ? { ...refreshed, tier } : { ...sessionUser, tier };

  const response = NextResponse.json({ data: nextUser });
  response.cookies.set(sessionCookieName(), encodeSession(nextUser), sessionCookieOptions());
  return withNoStore(response);
}
