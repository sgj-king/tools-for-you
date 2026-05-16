"use client";

import Link from "next/link";
import { JsonViewer } from "@/components/domain/json-viewer";
import { DrawerContent, Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useWebhookDeliveryDetailQuery } from "@/hooks/use-console-data";

export function WebhookDeliveryDetailDrawer({
  deliveryId,
  open,
  onOpenChange
}: {
  deliveryId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useWebhookDeliveryDetailQuery(deliveryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {!detail.data ? (
          <div className="rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">正在加载投递详情…</div>
        ) : (
          <div className="space-y-5">
            <div>
              <DialogTitle className="text-xl font-semibold">Webhook 投递详情</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                delivery_id: {detail.data.deliveryId} · webhook_id: {detail.data.webhookId}
              </DialogDescription>
              <div className="mt-3">
                <Link
                  href={`/console/request-logs?trace_id=${encodeURIComponent(String(detail.data.requestBody.trace_id ?? ""))}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  跳转到关联 trace 日志
                </Link>
              </div>
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
