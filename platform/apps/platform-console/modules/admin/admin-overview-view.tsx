"use client";

import { KpiStatCard } from "@/components/domain/kpi-stat-card";
import { ProviderHealthWidget } from "@/components/domain/provider-health-widget";
import { RiskEventTimeline } from "@/components/domain/risk-event-timeline";
import { useOverviewQuery, useProvidersQuery, useRiskEventsQuery } from "@/hooks/use-console-data";
import { formatPercent, formatUsd } from "@/lib/utils";

export function AdminOverviewView() {
  const overview = useOverviewQuery();
  const providers = useProvidersQuery();
  const events = useRiskEventsQuery();

  if (!overview.data || !providers.data || !events.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载管理后台概览…</div>;
  }

  return (
    <div className="section-shell">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard label="平台收入" value={formatUsd(overview.data.monthlyRevenueUsd)} hint="本月累计收入" />
        <KpiStatCard label="平台成本" value={formatUsd(overview.data.monthlyCostUsd)} hint="供应商成本与缓存成本" />
        <KpiStatCard label="全局成功率" value={formatPercent(overview.data.successRate)} hint="含路由自动重试" />
        <KpiStatCard label="缓存命中率" value={formatPercent(overview.data.cacheHitRate)} hint="支撑成本优化策略" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <ProviderHealthWidget providers={providers.data} />
        <RiskEventTimeline events={events.data} />
      </section>
    </div>
  );
}
