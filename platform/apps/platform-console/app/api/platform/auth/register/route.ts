import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, fail, parseJsonBody, rateLimitRequest, requireSameOrigin, withNoStore } from "@/lib/server/platform-api";
import { registerUser } from "@/lib/server/session-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimited = rateLimitRequest(request, "auth:register", { limit: 5, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  let payload: {
    adminName?: string;
    email?: string;
    organizationName?: string;
    password?: string;
  };
  try {
    payload = await parseJsonBody(request, 32 * 1024);
  } catch (error) {
    return apiErrorResponse(error, "invalid_register_payload", "注册请求格式不正确。");
  }

  const adminName = payload.adminName?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const organizationName = payload.organizationName?.trim() ?? "";
  const password = payload.password?.trim() ?? "";

  const fieldErrors: Record<string, string> = {};
  if (adminName.length < 2) fieldErrors.adminName = "管理员姓名至少 2 个字符";
  if (!email.includes("@")) fieldErrors.email = "邮箱格式不正确";
  if (organizationName.length < 2) fieldErrors.organizationName = "组织名称至少 2 个字符";
  if (password.length < 8) fieldErrors.password = "密码至少 8 位";
  if (password.length >= 8 && !isStrongPassword(password)) {
    fieldErrors.password = "密码需同时包含大小写字母和数字";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail(400, "validation_failed", "注册信息校验失败。", { fieldErrors });
  }

  try {
    const result = await registerUser({ adminName, email, organizationName, password });
    return withNoStore(NextResponse.json({
      data: {
        organizationId: result.organizationId,
        organizationName: result.organizationName,
        redirectTo: "/login",
        message: "组织已创建，请使用刚注册的账号登录。"
      }
    }));
  } catch (error) {
    if (error instanceof Error && error.message === "email_already_exists") {
      return fail(409, "email_already_exists", "该邮箱已存在。", {
        fieldErrors: {
          email: "该邮箱已存在"
        }
      });
    }
    return fail(500, "register_failed", "注册失败。", {
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

function isStrongPassword(password: string) {
  return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}
