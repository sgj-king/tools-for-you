"use client";

import type { ReactNode } from "react";
import { DrawerContent, Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useBillDetailQuery } from "@/hooks/use-console-data";
import { formatUsd } from "@/lib/utils";

export function BillDetailDrawer({
  billId,
  open,
  onOpenChange
}: {
  billId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useBillDetailQuery(billId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {!detail.data ? (
          <div className="rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">正在加载账单详情…</div>
        ) : (
          <div className="space-y-5">
            <div>
              <DialogTitle className="text-xl font-semibold">账单详情</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                {detail.data.billNumber} · {detail.data.periodStart} - {detail.data.periodEnd}
              </DialogDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Metric label="总金额" value={formatUsd(detail.data.amountUsd)} />
              <Metric label="币种" value={detail.data.currency} />
              <Metric label="状态" value={detail.data.status} />
              <Metric label="到期日" value={detail.data.dueDate} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
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
            </div>
            {detail.data.notes ? <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">{detail.data.notes}</div> : null}
          </div>
        )}
      </DrawerContent>
    </Dialog>
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
