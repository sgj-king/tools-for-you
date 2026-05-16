"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useModelDetailQuery } from "@/hooks/use-console-data";
import { buildPlaygroundHref } from "@/lib/playground-links";

export function ModelDetailView({ modelId }: { modelId: string }) {
  const detail = useModelDetailQuery(modelId);

  if (!detail.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载模型详情…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>{detail.data.publicName}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">{detail.data.summary}</p>
            </div>
            <Button asChild>
              <Link href={buildPlaygroundHref(detail.data, "detail")}>在线验证这个模型</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="上下文窗口" value={detail.data.contextWindow} />
          <Metric label="最大输出" value={`${detail.data.maxOutputTokens}`} />
          <Metric label="延迟档位" value={detail.data.latencyTier} />
          <Metric label="默认温度" value={`${detail.data.defaultTemperature}`} />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>能力与限制</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <ListBlock title="适用场景" items={detail.data.bestFor} />
            <ListBlock title="限制说明" items={detail.data.limitations} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>路由与供应商</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TagSection title="Route Profiles" items={detail.data.routeProfiles} />
            <TagSection title="Backing Providers" items={detail.data.backingProviders} />
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
              定价：{detail.data.pricingText}
              <br />
              流式输出：{detail.data.streamingSupported ? "支持" : "不支持"}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-sm font-medium">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function TagSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} tone="muted">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
