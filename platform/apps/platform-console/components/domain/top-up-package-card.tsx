import type { TopUpPackage } from "@/types/domain";
import { formatUsd } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TopUpPackageCard({ pack }: { pack: TopUpPackage }) {
  return (
    <Card className={pack.recommended ? "ring-2 ring-primary/30" : ""}>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{pack.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{pack.description}</div>
          </div>
          {pack.recommended ? <Badge tone="info">推荐</Badge> : null}
        </div>
        <div className="font-display text-4xl">{formatUsd(pack.amountUsd)}</div>
        <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          赠送余额：{formatUsd(pack.bonusUsd)}
        </div>
        <Button className="w-full">{pack.recommended ? "立即充值" : "选择该方案"}</Button>
      </CardContent>
    </Card>
  );
}
