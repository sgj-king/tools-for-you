import { NextRequest } from "next/server";
import { proxyToPlatformOps } from "@/lib/server/platform-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ modelId: string }> }) {
  const { modelId: rawModelId } = await params;
  const modelId = encodeURIComponent(rawModelId);
  return proxyToPlatformOps(request, `/v1/models/${modelId}`);
}
