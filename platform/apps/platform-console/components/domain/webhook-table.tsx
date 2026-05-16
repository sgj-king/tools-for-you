import { Button } from "@/components/ui/button";
import type { WebhookRecord } from "@/types/domain";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WebhookTable({
  rows,
  onSelect,
  onEdit,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: {
  rows: WebhookRecord[];
  onSelect?: (row: WebhookRecord) => void;
  onEdit?: (row: WebhookRecord) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
}) {
  const selectedSet = new Set(selectedIds ?? []);
  const allSelected = rows.length > 0 && rows.every((row) => selectedSet.has(row.id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook 配置</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">
                <input type="checkbox" checked={allSelected} onChange={(event) => onToggleSelectAll?.(event.target.checked)} />
              </th>
              <th className="pb-3">名称</th>
              <th className="pb-3">Endpoint</th>
              <th className="pb-3">事件</th>
              <th className="pb-3">状态</th>
              <th className="pb-3">重试策略</th>
              <th className="pb-3">最后投递</th>
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
                <td className="py-4 font-medium">{row.name}</td>
                <td className="py-4 font-mono text-xs">{row.endpoint}</td>
                <td className="py-4">{row.events.join(", ")}</td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4 text-muted-foreground">{row.retryPolicy}</td>
                <td className="py-4 text-muted-foreground">{row.lastDeliveryAt}</td>
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
