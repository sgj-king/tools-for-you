import { NextRequest } from "next/server";
import { proxyToPlatformOps } from "@/lib/server/platform-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  return proxyToPlatformOps(request, `/v1/billing/invoices/${encodeURIComponent(invoiceId)}`);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  return proxyToPlatformOps(request, `/v1/billing/invoices/${encodeURIComponent(invoiceId)}`);
}
