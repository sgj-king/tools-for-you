import Link from "next/link";
import type { SupportTicketRecord } from "@/types/domain";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupportTicketTable({ rows, onSelect }: { rows: SupportTicketRecord[]; onSelect?: (row: SupportTicketRecord) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>支持工单</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">工单号</th>
              <th className="pb-3">主题</th>
              <th className="pb-3">分类</th>
              <th className="pb-3">优先级</th>
              <th className="pb-3">状态</th>
              <th className="pb-3">提交人</th>
              <th className="pb-3">创建时间</th>
              <th className="pb-3">更新时间</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="cursor-pointer border-t border-border/70 hover:bg-muted/40" onClick={() => onSelect?.(row)}>
                <td className="py-4 font-medium">{row.ticketNumber}</td>
                <td className="py-4">{row.subject}</td>
                <td className="py-4">{row.category}</td>
                <td className="py-4">
                  <StatusBadge status={row.priority} />
                </td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4">{row.requesterName}</td>
                <td className="py-4 text-muted-foreground">{row.createdAt}</td>
                <td className="py-4 text-muted-foreground">
                  <div>{row.updatedAt}</div>
                  <Link
                    href={`/console/support/${row.id}`}
                    className="mt-1 inline-block text-xs text-accent underline-offset-4 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    打开详情页
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
