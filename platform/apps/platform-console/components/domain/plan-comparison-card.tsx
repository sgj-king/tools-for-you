import type { PlanCard } from "@/types/domain";
import { formatUsd } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PlanComparisonCard({ plan }: { plan: PlanCard }) {
  return (
    <Card className={plan.recommended ? "ring-2 ring-primary/30" : ""}>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">{plan.name}</div>
            <div className="font-display text-3xl">{formatUsd(plan.priceUsdMonthly)}</div>
          </div>
          {plan.recommended ? <Badge tone="info">推荐</Badge> : null}
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {plan.highlights.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <Button variant={plan.recommended ? "default" : "secondary"} className="w-full">
          查看套餐
        </Button>
      </CardContent>
    </Card>
  );
}
