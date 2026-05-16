import type { ProviderHealth } from "@/types/domain";
import { StatusBadge } from "@/components/domain/status-badge";
import { formatPercent, formatUsd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProviderHealthWidget({ providers }: { providers: ProviderHealth[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>渠道健康状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {providers.map((provider) => (
          <div key={provider.providerCode} className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{provider.providerCode}</div>
              <StatusBadge status={provider.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-muted-foreground">
              <div>
                <div>成功率</div>
                <div className="font-medium text-foreground">{formatPercent(provider.successRate)}</div>
              </div>
              <div>
                <div>P95 延迟</div>
                <div className="font-medium text-foreground">{provider.p95LatencyMs}ms</div>
              </div>
              <div>
                <div>单位成本</div>
                <div className="font-medium text-foreground">{formatUsd(provider.avgCostUsdPer1k)}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
