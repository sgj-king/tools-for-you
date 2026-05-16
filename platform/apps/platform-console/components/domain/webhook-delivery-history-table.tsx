import Link from "next/link";
import type { WebhookDeliveryRecord } from "@/types/domain";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WebhookDeliveryHistoryTable({ rows, onSelect }: { rows: WebhookDeliveryRecord[]; onSelect?: (row: WebhookDeliveryRecord) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook 历史投递</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">Webhook</th>
              <th className="pb-3">事件</th>
              <th className="pb-3">状态</th>
              <th className="pb-3">耗时</th>
              <th className="pb-3">尝试次数</th>
              <th className="pb-3">响应码</th>
              <th className="pb-3">时间</th>
              <th className="pb-3">trace_id</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.deliveryId} className="cursor-pointer border-t border-border/70 hover:bg-muted/40" onClick={() => onSelect?.(row)}>
                <td className="py-4">
                  <div className="font-medium">{row.webhookName}</div>
                  <div className="text-xs text-muted-foreground">{row.webhookId}</div>
                </td>
                <td className="py-4">{row.event}</td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4">{row.latencyMs} ms</td>
                <td className="py-4">{row.attempts}</td>
                <td className="py-4">{row.responseCode}</td>
                <td className="py-4 text-muted-foreground">{row.deliveredAt}</td>
                <td className="py-4">
                  {row.traceId ? (
                    <Link href={`/console/request-logs?trace_id=${row.traceId}`} className="text-accent underline-offset-4 hover:underline">
                      {row.traceId}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
