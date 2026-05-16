"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/domain/status-badge";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { usePricingRulesQuery } from "@/hooks/use-console-data";
import { formatUsd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PricingView() {
  const pricing = usePricingRulesQuery();
  const [keyword, setKeyword] = useState("");

  const rows = useMemo(
    () =>
      (pricing.data ?? []).filter(
        (row) =>
          !keyword ||
          row.publicModel.toLowerCase().includes(keyword.toLowerCase()) ||
          row.providerCode.toLowerCase().includes(keyword.toLowerCase()) ||
          row.upstreamModel.toLowerCase().includes(keyword.toLowerCase())
      ),
    [keyword, pricing.data]
  );

  if (!pricing.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载定价规则…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>定价规则</CardTitle>
            <p className="text-sm text-muted-foreground">
              运营视角关注成本价、售价、毛利率与草稿状态。Tablet 建议默认展示卡片列表，保留模型与供应商关键信息。
            </p>
          </div>
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索公开模型 / 上游模型 / 供应商" className="lg:max-w-sm" />
        </CardHeader>
      </Card>

      {rows.length === 0 ? (
        <EmptyStateBlock title="没有匹配的定价规则" description="可以检查筛选条件，或新增一个 draft 规则后再发布。" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3">公开模型</th>
                  <th className="pb-3">上游模型</th>
                  <th className="pb-3">供应商</th>
                  <th className="pb-3">售价 / 1K</th>
                  <th className="pb-3">成本 / 1K</th>
                  <th className="pb-3">毛利率</th>
                  <th className="pb-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="py-4 font-medium">{row.publicModel}</td>
                    <td className="py-4">{row.upstreamModel}</td>
                    <td className="py-4">{row.providerCode}</td>
                    <td className="py-4">{formatUsd(row.sellPricePer1kUsd)}</td>
                    <td className="py-4">{formatUsd(row.costPricePer1kUsd)}</td>
                    <td className="py-4">{row.grossMarginPercent.toFixed(2)}%</td>
                    <td className="py-4">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
