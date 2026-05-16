import { NextRequest } from "next/server";
import { proxyToPlatformOps } from "@/lib/server/platform-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxyToPlatformOps(request, "/v1/filter-presets/import");
}
