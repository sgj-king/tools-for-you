import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, withNoStore } from "@/lib/server/platform-api";
import { sessionCookieName, sessionCookieOptions } from "@/lib/server/session-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const response = NextResponse.json({
    data: {
      redirectTo: "/login",
      message: "已安全退出登录。"
    }
  });
  response.cookies.set(sessionCookieName(), "", sessionCookieOptions(0));
  return withNoStore(response);
}
