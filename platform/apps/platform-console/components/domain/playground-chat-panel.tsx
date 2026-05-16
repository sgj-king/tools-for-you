"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePlaygroundStore } from "@/features/playground/playground-store";
import type { PlaygroundLaunchPreset } from "@/lib/playground-links";
import { defaultPromptForModel } from "@/lib/playground-links";

type ChatRow = {
  role: "system" | "user" | "assistant";
  content: string;
};

type PlaygroundUsage = {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
};

export function PlaygroundChatPanel({ preset }: { preset?: PlaygroundLaunchPreset | null }) {
  const [messages, setMessages] = useState<ChatRow[]>([
    { role: "system", content: "你是平台内的模型联调助手。" },
    { role: "assistant", content: "当前 Playground 已支持真实 gateway/relay 链路，也可回退到 mock SSE。" }
  ]);
  const [input, setInput] = useState("请给我一个 Billing 看板的布局建议。");
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [usage, setUsage] = useState<PlaygroundUsage | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const appliedPresetKeyRef = useRef<string>("");

  const model = usePlaygroundStore((state) => state.model);
  const apiKey = usePlaygroundStore((state) => state.apiKey);
  const imageUrl = usePlaygroundStore((state) => state.imageUrl);
  const temperature = usePlaygroundStore((state) => state.temperature);
  const maxTokens = usePlaygroundStore((state) => state.maxTokens);
  const systemPrompt = usePlaygroundStore((state) => state.systemPrompt);
  const backendMode = process.env.NEXT_PUBLIC_PLAYGROUND_MODE ?? "mock";

  const endpoint = useMemo(() => {
    if (backendMode === "real") {
      return "/api/playground/chat/stream";
    }
    return "/api/mock/playground/stream";
  }, [backendMode]);
  const isMappedPreset = Boolean(preset && preset.requestedModelId !== preset.model);

  useEffect(() => {
    const presetKey = preset ? `${preset.source}|${preset.sourceModelId}|${preset.model}|${preset.prompt}` : "";
    if (preset && appliedPresetKeyRef.current !== presetKey) {
      setInput(preset.prompt || defaultPromptForModel(preset.model, preset.sourceName));
      setStreamError(null);
      setUsage(null);
      setTraceId(null);
      setRequestId(null);
      appliedPresetKeyRef.current = presetKey;
      return;
    }
    if (preset) {
      return;
    }

    if (model === "vision-pro") {
      setInput("请确认你收到了图片输入，并用一句中文短句描述图片内容。");
      return;
    }
    if (input.trim() === "" || input.includes("图片输入")) {
      setInput(model === "reasoning-pro" ? "请给我一个账单排障流程，并按优先级排序。" : "请给我一个 Billing 看板的布局建议。");
    }
  }, [imageUrl, input, model, preset]);

  async function handleSend() {
    if (!input.trim() || streaming) return;
    if (model === "embedding-large") {
      setStreamError("当前开发环境尚未启用 embedding-large 的真实上游，请先使用 chat-pro / reasoning-pro / vision-pro。");
      return;
    }
    if (model === "vision-pro" && !imageUrl.trim()) {
      setStreamError("vision-pro 需要传入图片 URL 或 data URL。");
      return;
    }

    const userPrompt = input.trim();
    const assistantIndex = messages.length + 1;
    const nextMessages: ChatRow[] = [...messages, { role: "user", content: userPrompt }, { role: "assistant", content: "" }];
    const requestMessages = nextMessages
      .filter((message, index) => !(message.role === "assistant" && index === assistantIndex))
      .map((message, index, list) => {
        if (model === "vision-pro" && message.role === "user" && index === list.length - 1) {
          return {
            role: message.role,
            content: [
              { type: "text", text: message.content },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl.trim()
                }
              }
            ]
          };
        }
        return message;
      });

    setMessages(nextMessages);
    setStreaming(true);
    setStreamError(null);
    setUsage(null);
    setTraceId(null);
    setRequestId(null);
    setInput("");
    const startedAt = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiKey,
          model,
          imageUrl,
          temperature,
          maxTokens,
          systemPrompt,
          messages: requestMessages
        })
      });

      setTraceId(response.headers.get("x-trace-id"));
      setRequestId(response.headers.get("x-request-id"));

      if (!response.ok) {
        const errorText = await readErrorPayload(response);
        setStreamError(errorText);
        setMessages((current) => current.slice(0, -1));
        setStreaming(false);
        return;
      }

      if (!response.body) {
        throw new Error("流式连接未返回响应体");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let sawDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const eventBlock = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          const event = parseStreamBlock(eventBlock);

          if (event.type === "done") {
            sawDone = true;
          }
          if (event.type === "error" && event.message) {
            setStreamError(event.message);
          }
          if (event.delta) {
            assistantText += event.delta;
            setMessages((current) => {
              const copy = [...current];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: assistantText };
              }
              return copy;
            });
          }
          if (event.usage) {
            setUsage({
              ...event.usage,
              latencyMs: Date.now() - startedAt,
              estimatedCostUsd: estimatePlaygroundCost(model, event.usage.inputTokens, event.usage.outputTokens)
            });
          }
          boundaryIndex = buffer.indexOf("\n\n");
        }
      }

      if (!sawDone && !assistantText) {
        setStreamError("流式连接已结束，但未收到可用输出。请检查上游模型、渠道映射或后端日志。");
      }
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : "流式请求失败");
    }

    setStreaming(false);
  }

  return (
    <Card className="flex min-h-[620px] flex-col">
      <CardHeader>
        <CardTitle>{preset ? `模型在线验证：${preset.sourceName}` : "Playground 会话"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-xs text-muted-foreground">
          <div>
            当前模式：{backendMode === "real" ? "真实 gateway/relay 流式链路" : "mock SSE"}
            {preset ? ` · 验证目标：${preset.sourceName}` : ""}
            {isMappedPreset && preset ? ` · 实际调用：${preset.model}` : ""}
          </div>
          <div>{requestId ? `request_id: ${requestId}` : "发送后会返回 request_id / trace_id"}</div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-muted/40 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={message.role === "assistant" ? "ml-6 rounded-2xl bg-card p-4" : "mr-6 rounded-2xl border border-border/70 bg-card/70 p-4"}
            >
              <div className="mb-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">{message.role}</div>
              <div className="text-sm leading-7 whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/80 p-4">
          <Input placeholder="输入消息，支持多轮上下文与工具调用测试" value={input} onChange={(event) => setInput(event.target.value)} />
          {streamError ? <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">流式错误：{streamError}</div> : null}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>
                {usage
                  ? `实际：${usage.inputTokens + usage.outputTokens} tokens • $${usage.estimatedCostUsd.toFixed(4)} • ${usage.latencyMs}ms`
                  : backendMode === "real"
                    ? model === "vision-pro"
                      ? "当前使用真实 gateway/relay/Groq 多模态链路；建议传入 data URL 或稳定可访问的图片 URL。"
                      : "当前使用真实 gateway/relay 链路；如无 provider 配置，将返回真实后端错误。"
                    : "当前使用 mock SSE，便于前端独立开发。"}
              </div>
              {traceId ? (
                <div>
                  trace_id：
                  <Link href={{ pathname: "/console/usage", query: { trace_id: traceId } }} className="font-mono text-accent hover:underline">
                    {traceId}
                  </Link>
                </div>
              ) : null}
            </div>
            <Button onClick={handleSend} disabled={streaming}>
              {streaming ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              {streaming ? "生成中…" : "发送"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function estimatePlaygroundCost(model: string, inputTokens: number, outputTokens: number) {
  const pricing: Record<string, { input: number; output: number }> = {
    "chat-pro": { input: 0.00015, output: 0.0006 },
    "reasoning-pro": { input: 0.00015, output: 0.0006 },
    "vision-pro": { input: 0.00011, output: 0.00034 },
    "embedding-large": { input: 0.0006, output: 0 }
  };

  const current = pricing[model] ?? pricing["chat-pro"];
  return (inputTokens / 1000) * current.input + (outputTokens / 1000) * current.output;
}

async function readErrorPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };
    return payload.error?.message ?? payload.message ?? `请求失败（HTTP ${response.status}）`;
  }
  const raw = await response.text();
  return raw || `请求失败（HTTP ${response.status}）`;
}

function parseStreamBlock(block: string): {
  type: "chunk" | "done" | "error";
  delta?: string;
  message?: string;
  usage?: PlaygroundUsage;
} {
  const normalized = block.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const dataLines = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace("data:", "").trim());

  if (dataLines.length === 0) {
    return { type: "chunk" };
  }

  const data = dataLines.join("\n");
  if (data === "[DONE]") {
    return { type: "done" };
  }

  try {
    const payload = JSON.parse(data) as {
      error?: { message?: string };
      choices?: Array<{ delta?: { content?: string; reasoning_content?: string; reasoning?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    if (payload.error?.message) {
      return { type: "error", message: payload.error.message };
    }

    const delta =
      payload.choices?.[0]?.delta?.content ??
      payload.choices?.[0]?.delta?.reasoning_content ??
      payload.choices?.[0]?.delta?.reasoning;

    if (payload.usage) {
      return {
        type: "chunk",
        delta,
        usage: {
          inputTokens: payload.usage.prompt_tokens ?? 0,
          outputTokens: payload.usage.completion_tokens ?? 0,
          estimatedCostUsd: 0,
          latencyMs: 0
        }
      };
    }

    return { type: "chunk", delta };
  } catch {
    return { type: "chunk" };
  }
}
