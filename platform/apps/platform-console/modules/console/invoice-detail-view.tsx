"use client";

import type { ReactNode } from "react";
import { useInvoiceDetailQuery } from "@/hooks/use-console-data";
import { formatUsd } from "@/lib/utils";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InvoiceDetailView({ invoiceId }: { invoiceId: string }) {
  const invoice = useInvoiceDetailQuery(invoiceId);

  if (!invoice.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载发票详情…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>发票详情</CardTitle>
          <p className="text-sm text-muted-foreground">发票号：{invoice.data.invoiceNumber}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="状态" value={<StatusBadge status={invoice.data.status} />} />
          <Metric label="金额" value={formatUsd(invoice.data.amountUsd)} />
          <Metric label="开票主体" value={invoice.data.billingEntityName} />
          <Metric label="到期日" value={invoice.data.dueDate} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>明细项</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-3">项目</th>
                <th className="pb-3">数量</th>
                <th className="pb-3">单价</th>
                <th className="pb-3">金额</th>
              </tr>
            </thead>
            <tbody>
              {invoice.data.lineItems.map((item) => (
                <tr key={item.label} className="border-t border-border/70">
                  <td className="py-4">{item.label}</td>
                  <td className="py-4">{item.quantity}</td>
                  <td className="py-4">{formatUsd(item.unitPriceUsd)}</td>
                  <td className="py-4">{formatUsd(item.amountUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoice.data.notes ? <div className="mt-4 rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">{invoice.data.notes}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}
