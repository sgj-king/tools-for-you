import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { prompt?: string; model?: string };
  const prompt = body.prompt?.trim() || "请给出一个可执行建议。";
  const model = body.model?.trim() || "chat-pro";

  const encoder = new TextEncoder();
  const chunks = [
    `你当前选择的是 ${model}。`,
    " 这条响应通过 mock SSE route 流式返回，",
    "用于前端独立开发与 staging 前的真实交互联调。",
    ` 你的问题摘要是：${prompt.slice(0, 60)}。`,
    " 下一步可以继续接到正式后端的 /v1/playground/chat/stream。"
  ];

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ model })}\n\n`));
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ content: chunk })}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 280));
      }
      controller.enqueue(
        encoder.encode(
          `event: done\ndata: ${JSON.stringify({
            usage: { inputTokens: 482, outputTokens: 219, estimatedCostUsd: 0.0128, latencyMs: 1860 }
          })}\n\n`
        )
      );
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
