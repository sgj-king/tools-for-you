import { NextResponse } from "next/server";
import { mockOverview } from "@/services/mock/data";

export async function GET() {
  return NextResponse.json({
    data: mockOverview,
    meta: {
      requestId: "mock_req_overview"
    }
  });
}
