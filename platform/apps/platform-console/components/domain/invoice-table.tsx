import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { InvoiceRecord } from "@/types/domain";
import { formatUsd } from "@/lib/utils";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InvoiceTable({
  rows,
  onEdit,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: {
  rows: InvoiceRecord[];
  onEdit?: (row: InvoiceRecord) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
}) {
  const selectedSet = new Set(selectedIds ?? []);
  const allSelected = rows.length > 0 && rows.every((row) => selectedSet.has(row.id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>发票列表</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">
                <input type="checkbox" checked={allSelected} onChange={(event) => onToggleSelectAll?.(event.target.checked)} />
              </th>
              <th className="pb-3">发票号</th>
              <th className="pb-3">账期</th>
              <th className="pb-3">金额</th>
              <th className="pb-3">状态</th>
              <th className="pb-3">开具日期</th>
              <th className="pb-3">到期日</th>
              <th className="pb-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/70">
                <td className="py-4">
                  <input type="checkbox" checked={selectedSet.has(row.id)} onChange={(event) => onToggleSelect?.(row.id, event.target.checked)} />
                </td>
                <td className="py-4 font-medium">{row.invoiceNumber}</td>
                <td className="py-4 text-muted-foreground">
                  {row.periodStart} - {row.periodEnd}
                </td>
                <td className="py-4">{formatUsd(row.amountUsd)}</td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4">{row.issuedAt}</td>
                <td className="py-4">{row.dueDate}</td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/console/invoices/${row.id}`} className="text-xs text-accent underline-offset-4 hover:underline">
                      查看明细
                    </Link>
                    <Button variant="secondary" onClick={() => onEdit?.(row)}>
                      编辑
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
