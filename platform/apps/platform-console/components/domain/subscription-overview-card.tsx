import type { SubscriptionOverview } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SubscriptionOverviewCard({ overview }: { overview: SubscriptionOverview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>当前订阅</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-3xl">{overview.currentPlanName}</div>
            <div className="mt-1 text-sm text-muted-foreground">续费日期：{overview.renewalDate}</div>
          </div>
          <Badge tone="info">{overview.contractType}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <InfoBlock label="超额策略" value={overview.overagePolicy} />
          <InfoBlock label="席位策略" value={overview.seatPolicy} />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">套餐权益</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {overview.entitlementSummary.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm">{value}</div>
    </div>
  );
}
