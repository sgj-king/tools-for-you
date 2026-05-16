"use client";

import { useState } from "react";
import { WebhookDeliveryDetailDrawer } from "@/components/domain/webhook-delivery-detail-drawer";
import { WebhookDeliveryHistoryTable } from "@/components/domain/webhook-delivery-history-table";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useWebhookDeliveriesQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WebhookDeliveriesView() {
  const deliveries = useWebhookDeliveriesQuery();
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!deliveries.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载 Webhook 历史投递…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>Webhook 历史投递</CardTitle>
          <p className="text-sm text-muted-foreground">筛选维度建议包含事件类型、状态、Webhook、响应码、trace_id、时间范围与重试次数。</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <select className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>全部状态</option>
            <option>delivered</option>
            <option>retrying</option>
            <option>failed</option>
          </select>
          <input className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="搜索 Webhook / 事件 / trace_id" />
          <input className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="响应码" />
          <input className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="时间范围（预留）" />
        </CardContent>
      </Card>
      {deliveries.data.length === 0 ? (
        <EmptyStateBlock title="没有历史投递" description="当前还没有可展示的 Webhook 投递记录。" />
      ) : (
        <WebhookDeliveryHistoryTable
          rows={deliveries.data}
          onSelect={(row) => {
            setSelectedDeliveryId(row.deliveryId);
            setDrawerOpen(true);
          }}
        />
      )}
      <WebhookDeliveryDetailDrawer deliveryId={selectedDeliveryId} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
