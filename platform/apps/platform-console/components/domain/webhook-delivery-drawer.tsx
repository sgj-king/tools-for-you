"use client";

import type { ReactNode } from "react";
import { JsonViewer } from "@/components/domain/json-viewer";
import { StatusBadge } from "@/components/domain/status-badge";
import { DrawerContent, Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useWebhookRecentDeliveryDetailQuery } from "@/hooks/use-console-data";

export function WebhookDeliveryDrawer({
  webhookId,
  open,
  onOpenChange
}: {
  webhookId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useWebhookRecentDeliveryDetailQuery(webhookId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {!detail.data ? (
          <div className="rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">正在加载最近一次投递详情…</div>
        ) : (
          <div className="space-y-5">
            <div>
              <DialogTitle className="text-xl font-semibold">最近一次投递详情</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                delivery_id: <span className="font-mono">{detail.data.deliveryId}</span>
              </DialogDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Metric label="事件" value={detail.data.event} />
              <Metric label="状态" value={<StatusBadge status={detail.data.status} />} />
              <Metric label="响应码" value={detail.data.responseCode} />
              <Metric label="耗时" value={`${detail.data.latencyMs}ms`} />
              <Metric label="投递时间" value={detail.data.deliveredAt} />
              <Metric label="尝试次数" value={detail.data.attempts} />
            </div>
            <section className="space-y-3">
              <h3 className="font-medium">请求头</h3>
              <JsonViewer value={detail.data.requestHeaders} />
            </section>
            <section className="space-y-3">
              <h3 className="font-medium">请求体</h3>
              <JsonViewer value={detail.data.requestBody} />
            </section>
            <section className="space-y-3">
              <h3 className="font-medium">响应体</h3>
              <JsonViewer value={detail.data.responseBody} />
            </section>
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
