"use client";

import { useSearchParams } from "next/navigation";
import { CodeSnippetTabs } from "@/components/domain/code-snippet-tabs";
import { ParameterConfigPanel } from "@/components/domain/parameter-config-panel";
import { PlaygroundChatPanel } from "@/components/domain/playground-chat-panel";
import { Badge } from "@/components/ui/badge";
import { readPlaygroundPreset } from "@/lib/playground-links";

export function PlaygroundView() {
  const searchParams = useSearchParams();
  const preset = readPlaygroundPreset(searchParams);
  const isMappedPreset = preset ? preset.requestedModelId !== preset.model : false;

  return (
    <div className="section-shell">
      {preset ? (
        <section className="rounded-3xl border border-border/70 bg-card/70 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold">
                正在验证：{preset.sourceName}
                <span className="ml-2 text-xs font-normal text-muted-foreground">来自{preset.source === "detail" ? "模型详情" : "模型目录"}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {isMappedPreset
                  ? `该卡片是供应商/渠道模型展示卡，在线验证会通过公开逻辑模型 ${preset.model} 发起请求，再由后端路由到对应上游。`
                  : `该卡片会直接使用 ${preset.model} 发起在线验证。`}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="muted">目标卡片: {preset.requestedModelName}</Badge>
              <Badge tone="info">实际调用: {preset.model}</Badge>
              {isMappedPreset ? <Badge tone="warning">内部渠道不直接暴露</Badge> : null}
            </div>
          </div>
        </section>
      ) : null}
      <section className="grid gap-6 xl:grid-cols-[1.6fr,0.9fr]">
        <PlaygroundChatPanel preset={preset} />
        <ParameterConfigPanel preset={preset} />
      </section>
      <section className="rounded-3xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">开发接入示例</h3>
        <p className="mt-2 text-sm text-muted-foreground">Playground 页面需支持流式输出、成本反馈、错误提示与 trace_id 跳转。这里预留生产后端对接位。</p>
        <div className="mt-4">
          <CodeSnippetTabs />
        </div>
      </section>
    </div>
  );
}
