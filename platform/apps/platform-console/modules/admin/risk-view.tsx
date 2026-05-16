"use client";

import { useState } from "react";
import { RiskEventTimeline } from "@/components/domain/risk-event-timeline";
import { useRiskEventsQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RiskView() {
  const risk = useRiskEventsQuery();
  const [status, setStatus] = useState("all");

  const rows = (risk.data ?? []).filter((item) => status === "all" || item.status === status);

  if (!risk.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载风控事件…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>风控事件中心</CardTitle>
            <p className="text-sm text-muted-foreground">实时风控页应支持按状态、严重级别、组织、Key、地区与时间范围筛选。本页先提供核心事件流视图。</p>
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">全部状态</option>
            <option value="open">open</option>
            <option value="investigating">investigating</option>
            <option value="resolved">resolved</option>
          </select>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Info title="Desktop 主方案" value="左侧筛选与统计卡，右侧时间线 + 明细面板。" />
          <Info title="Tablet 兼容" value="把明细折叠为底部抽屉，时间线保留单列模式。" />
          <Info title="接口" value="adminRiskApi.listEvents / adminRiskApi.resolveEvent / adminRiskApi.blockKey" />
        </CardContent>
      </Card>
      <RiskEventTimeline events={rows} />
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="mt-2 text-sm">{value}</div>
    </div>
  );
}
