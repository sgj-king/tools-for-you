"use client";

import Link from "next/link";
import { BillingSummaryCard } from "@/components/domain/billing-summary-card";
import { PlanComparisonCard } from "@/components/domain/plan-comparison-card";
import { UsageTrendChart } from "@/components/charts/usage-trend-chart";
import { Button } from "@/components/ui/button";
import { useBillingSummaryQuery, usePlansQuery, useTrendQuery } from "@/hooks/use-console-data";

export function BillingView() {
  const summary = useBillingSummaryQuery();
  const plans = usePlansQuery();
  const trends = useTrendQuery();

  if (!summary.data || !plans.data || !trends.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载 Billing 数据…</div>;
  }

  return (
    <div className="section-shell">
      <BillingSummaryCard summary={summary.data} />
      <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <UsageTrendChart data={trends.data} />
        <div className="rounded-3xl border border-border bg-card p-5">
          <h3 className="text-lg font-semibold">账务提醒</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>• 当前余额低于未来 14 天预测阈值时触发预警。</li>
            <li>• 套餐超额时转为按用量计费。</li>
            <li>• 发票与账单状态支持 webhook 通知。</li>
          </ul>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Button asChild variant="secondary">
              <Link href="/console/top-up">去充值</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/console/invoices">查看发票</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/console/subscriptions">套餐与订阅</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/console/request-logs">独立请求日志</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {plans.data.map((plan) => (
          <PlanComparisonCard key={plan.id} plan={plan} />
        ))}
      </section>
    </div>
  );
}
