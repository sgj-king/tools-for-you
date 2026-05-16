import { NextRequest } from "next/server";
import { proxyToPlatformOps } from "@/lib/server/platform-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ traceId: string }> }) {
  const { traceId } = await params;
  return proxyToPlatformOps(request, `/v1/request-logs/${encodeURIComponent(traceId)}`);
}
