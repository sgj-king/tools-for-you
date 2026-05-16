"use client";

import { useEffect, useRef } from "react";
import { usePlaygroundStore } from "@/features/playground/playground-store";
import { useModelsQuery } from "@/hooks/use-console-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PlaygroundLaunchPreset } from "@/lib/playground-links";

const fallbackModels = [
  { id: "chat-pro", publicName: "chat-pro", available: true },
  { id: "reasoning-pro", publicName: "reasoning-pro", available: true },
  { id: "vision-pro", publicName: "vision-pro", available: true },
  { id: "embedding-large", publicName: "embedding-large", available: false }
];

export function ParameterConfigPanel({ preset }: { preset?: PlaygroundLaunchPreset | null }) {
  const models = useModelsQuery();
  const appliedPresetKeyRef = useRef("");
  const model = usePlaygroundStore((state) => state.model);
  const apiKey = usePlaygroundStore((state) => state.apiKey);
  const imageUrl = usePlaygroundStore((state) => state.imageUrl);
  const temperature = usePlaygroundStore((state) => state.temperature);
  const maxTokens = usePlaygroundStore((state) => state.maxTokens);
  const systemPrompt = usePlaygroundStore((state) => state.systemPrompt);
  const setModel = usePlaygroundStore((state) => state.setModel);
  const setApiKey = usePlaygroundStore((state) => state.setApiKey);
  const setImageUrl = usePlaygroundStore((state) => state.setImageUrl);
  const setTemperature = usePlaygroundStore((state) => state.setTemperature);
  const setMaxTokens = usePlaygroundStore((state) => state.setMaxTokens);
  const setSystemPrompt = usePlaygroundStore((state) => state.setSystemPrompt);
  const backendMode = process.env.NEXT_PUBLIC_PLAYGROUND_MODE ?? "mock";
  const rawModelOptions = models.data?.length ? models.data : fallbackModels;
  const logicalModelOptions = rawModelOptions.filter((item) => !item.id.startsWith("provider__"));
  const modelOptions = logicalModelOptions.length ? logicalModelOptions : fallbackModels;
  const selectedOption = modelOptions.find((item) => item.id === model);
  const isMappedPreset = Boolean(preset && preset.requestedModelId !== preset.model);

  useEffect(() => {
    const presetKey = preset ? `${preset.source}|${preset.sourceModelId}|${preset.model}` : "";
    if (preset?.model && appliedPresetKeyRef.current !== presetKey) {
      setModel(preset.model);
      appliedPresetKeyRef.current = presetKey;
    }
  }, [preset, setModel]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>参数配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {preset ? (
          <div className="rounded-2xl border border-info/25 bg-info/10 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-info">验证目标模型</div>
            <div className="mt-2 text-sm font-semibold">{preset.sourceName}</div>
            {preset.sourceSummary ? <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{preset.sourceSummary}</div> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="info">目标卡片：{preset.requestedModelName}</Badge>
              <Badge tone={isMappedPreset ? "warning" : "success"}>
                {isMappedPreset ? `实际调用：${preset.model}` : `直接调用：${preset.model}`}
              </Badge>
            </div>
            {isMappedPreset ? (
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                当前卡片是供应商/渠道模型展示卡，不能直接暴露内部 provider/channel 标识给客户请求；在线验证会通过公开逻辑模型发起，
                再由后端路由到对应上游。
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-2">
          <label className="text-sm font-medium">{preset ? "实际调用模型 / 路由模型" : "模型"}</label>
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            {modelOptions.map((option) => (
              <option key={option.id} value={option.id} disabled={option.available === false}>
                {option.publicName}
                {option.available === false ? "（当前未启用）" : ""}
              </option>
            ))}
          </select>
          {preset ? (
            <p className="text-xs text-muted-foreground">
              当前页面正在验证“{preset.sourceName}”。
              {isMappedPreset
                ? `这里显示的是真实请求要发送给 gateway 的公开逻辑模型 ${preset.model}。`
                : "当前会直接使用该逻辑模型进行联调。"}
            </p>
          ) : selectedOption ? (
            <p className="text-xs text-muted-foreground">当前选择：{selectedOption.publicName}</p>
          ) : null}
        </div>
        {model === "vision-pro" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">图片 URL / data URL</label>
            <Input
              placeholder="vision-pro 需要传入可访问图片 URL，或 data:image/...;base64,..."
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">建议优先使用 data URL 或你自己可稳定访问的图片地址，避免第三方站点 403。</p>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">temperature</label>
            <Input type="number" step="0.1" min="0" max="2" value={temperature} onChange={(event) => setTemperature(Number(event.target.value || 0.4))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">max_tokens</label>
            <Input type="number" min="1" value={maxTokens} onChange={(event) => setMaxTokens(Number(event.target.value || 2048))} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">开发 API Key</label>
          <Input
            placeholder="未填写时使用服务端开发默认 key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">当前 Playground 模式：{backendMode === "real" ? "真实 gateway/relay" : "mock SSE"}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">system prompt</label>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
          />
        </div>
        <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
          可视化维度：模型 / 参数 / 预估成本 / trace_id / 上下文长度 / 流式状态 / 错误反馈
        </div>
        <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm">
          <div className="font-medium">联调说明</div>
          <div className="text-muted-foreground">1. 真实模式通过 `platform-console` 服务端路由代理到 `gateway`，不会直连 `new-api`。</div>
          <div className="text-muted-foreground">2. 当前开发环境已接通 chat-pro / reasoning-pro / vision-pro 的真实上游；供应商独立卡片也可从模型目录跳转到这里验证。</div>
          <div className="text-muted-foreground">3. vision-pro 需要图片 URL 或 data URL；成功或失败都可通过 trace_id 跳转到 Usage 日志继续排查。</div>
        </div>
      </CardContent>
    </Card>
  );
}
