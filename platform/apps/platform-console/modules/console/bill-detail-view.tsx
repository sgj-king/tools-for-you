"use client";

import { useBillDetailQuery } from "@/hooks/use-console-data";
import { formatUsd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BillDetailView({ billId }: { billId: string }) {
  const detail = useBillDetailQuery(billId);

  if (!detail.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载账单详情页…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>{detail.data.billNumber}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {detail.data.periodStart} - {detail.data.periodEnd}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="总金额" value={formatUsd(detail.data.amountUsd)} />
          <Metric label="状态" value={detail.data.status} />
          <Metric label="到期日" value={detail.data.dueDate} />
          <Metric label="币种" value={detail.data.currency} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>账单明细</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-3">项目</th>
                <th className="pb-3">分类</th>
                <th className="pb-3">金额</th>
              </tr>
            </thead>
            <tbody>
              {detail.data.lineItems.map((item) => (
                <tr key={`${item.label}-${item.category}`} className="border-t border-border/70">
                  <td className="py-4">{item.label}</td>
                  <td className="py-4 text-muted-foreground">{item.category}</td>
                  <td className="py-4">{formatUsd(item.amountUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {detail.data.notes ? <div className="mt-4 rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">{detail.data.notes}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}
