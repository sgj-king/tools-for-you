import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BillRecord } from "@/types/domain";
import { formatUsd } from "@/lib/utils";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BillTable({
  rows,
  onSelect,
  onEdit,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: {
  rows: BillRecord[];
  onSelect?: (row: BillRecord) => void;
  onEdit?: (row: BillRecord) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
}) {
  const selectedSet = new Set(selectedIds ?? []);
  const allSelected = rows.length > 0 && rows.every((row) => selectedSet.has(row.id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>账单列表</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">
                <input type="checkbox" checked={allSelected} onChange={(event) => onToggleSelectAll?.(event.target.checked)} />
              </th>
              <th className="pb-3">账单号</th>
              <th className="pb-3">账期</th>
              <th className="pb-3">总额</th>
              <th className="pb-3">用量</th>
              <th className="pb-3">套餐</th>
              <th className="pb-3">调整</th>
              <th className="pb-3">状态</th>
              <th className="pb-3">到期日</th>
              <th className="pb-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="cursor-pointer border-t border-border/70 hover:bg-muted/40" onClick={() => onSelect?.(row)}>
                <td className="py-4">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(row.id)}
                    onChange={(event) => onToggleSelect?.(row.id, event.target.checked)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </td>
                <td className="py-4 font-medium">{row.billNumber}</td>
                <td className="py-4 text-muted-foreground">
                  {row.periodStart} - {row.periodEnd}
                </td>
                <td className="py-4">{formatUsd(row.amountUsd)}</td>
                <td className="py-4">{formatUsd(row.usageAmountUsd)}</td>
                <td className="py-4">{formatUsd(row.subscriptionAmountUsd)}</td>
                <td className="py-4">{formatUsd(row.adjustmentAmountUsd)}</td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4">
                  <div>{row.dueDate}</div>
                  <Link
                    href={`/console/bills/${row.id}`}
                    className="mt-1 inline-block text-xs text-accent underline-offset-4 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    打开详情页
                  </Link>
                </td>
                <td className="py-4 text-right">
                  <Button
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit?.(row);
                    }}
                  >
                    编辑
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
