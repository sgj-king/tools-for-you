import type { BillingSummary } from "@/types/domain";
import { formatUsd } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BillingSummaryCard({ summary }: { summary: BillingSummary }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>账务总览</CardTitle>
          <CardDescription>余额、冻结金额、今日预估与当前计划</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="text-sm text-muted-foreground">当前余额</div>
          <div className="mt-2 font-display text-3xl">{formatUsd(summary.balanceUsd)}</div>
        </div>
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="text-sm text-muted-foreground">冻结金额</div>
          <div className="mt-2 font-display text-3xl">{formatUsd(summary.frozenAmountUsd)}</div>
        </div>
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="text-sm text-muted-foreground">今日预估消费</div>
          <div className="mt-2 font-display text-3xl">{formatUsd(summary.estimatedTodayCostUsd)}</div>
        </div>
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="text-sm text-muted-foreground">当前套餐</div>
          <div className="mt-2 text-lg font-semibold">{summary.currentPlanName}</div>
          <div className="mt-1 text-xs text-muted-foreground">{summary.includedQuotaText}</div>
        </div>
      </CardContent>
    </Card>
  );
}
