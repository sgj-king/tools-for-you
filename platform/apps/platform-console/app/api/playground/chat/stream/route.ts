import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/server/session-auth";

export const dynamic = "force-dynamic";

const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.PLATFORM_CONSOLE_APP_ENV === "production";
const PLAYGROUND_DISABLED = process.env.PLATFORM_CONSOLE_PLAYGROUND_MODE === "disabled";

export async function POST(request: NextRequest) {
  if (PLAYGROUND_DISABLED) {
    return NextResponse.json(
      { error: { code: "playground_disabled", message: "Playground is disabled in this environment." } },
      { status: 404 }
    );
  }

  const session = await getSessionUserFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Login required to use Playground." } },
      { status: 401 }
    );
  }

  const payload = (await request.json()) as {
    apiKey?: string;
    model: string;
    imageUrl?: string;
    messages: Array<{
      role: string;
      content:
        | string
        | Array<
            | { type: "text"; text: string }
            | {
                type: "image_url";
                image_url: { url: string };
              }
          >;
    }>;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };

  const gatewayBaseUrl = process.env.PLAYGROUND_GATEWAY_BASE_URL ?? "http://gateway:8080";
  const defaultApiKey = IS_PRODUCTION ? "" : (process.env.PLAYGROUND_DEV_API_KEY ?? "");
  const authorizationKey = payload.apiKey?.trim() || defaultApiKey;

  if (!authorizationKey) {
    return NextResponse.json(
      {
        error: {
          code: "missing_playground_api_key",
          message: "Playground 需要在参数面板填写有效的 API Key。"
        }
      },
      { status: 400 }
    );
  }

  const messages = [...payload.messages.filter((message) => message.role !== "system")];
  if (payload.systemPrompt?.trim()) {
    messages.unshift({ role: "system", content: payload.systemPrompt.trim() });
  }

  const upstreamResponse = await fetch(`${gatewayBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authorizationKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Request-Id": `req_console_${Date.now()}`,
      "X-Trace-Id": `trace_console_${Date.now()}`
    },
    body: JSON.stringify({
      model: payload.model,
      messages,
      temperature: payload.temperature ?? 0.4,
      max_tokens: payload.maxTokens ?? 2048,
      stream: true
    }),
    cache: "no-store"
  });

  const headers = new Headers();
  headers.set("Cache-Control", "no-cache");
  headers.set("Connection", "keep-alive");
  headers.set("X-Accel-Buffering", "no");

  const requestId = upstreamResponse.headers.get("x-request-id");
  const traceId = upstreamResponse.headers.get("x-trace-id");
  if (requestId) headers.set("X-Request-Id", requestId);
  if (traceId) headers.set("X-Trace-Id", traceId);

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  if (!upstreamResponse.ok || !contentType.includes("text/event-stream")) {
    const text = await upstreamResponse.text();
    headers.set("Content-Type", contentType || "application/json");
    return new NextResponse(text, { status: upstreamResponse.status, headers });
  }

  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers
  });
}
