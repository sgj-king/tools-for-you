"use client";

import { PlanComparisonCard } from "@/components/domain/plan-comparison-card";
import { SubscriptionOverviewCard } from "@/components/domain/subscription-overview-card";
import { usePlansQuery, useSubscriptionOverviewQuery } from "@/hooks/use-console-data";

export function SubscriptionsView() {
  const overview = useSubscriptionOverviewQuery();
  const plans = usePlansQuery();

  if (!overview.data || !plans.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载订阅与套餐页…</div>;
  }

  return (
    <div className="section-shell">
      <SubscriptionOverviewCard overview={overview.data} />
      <section className="grid gap-4 lg:grid-cols-3">
        {plans.data.map((plan) => (
          <PlanComparisonCard key={plan.id} plan={plan} />
        ))}
      </section>
    </div>
  );
}
