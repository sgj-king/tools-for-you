"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { JsonViewer } from "@/components/domain/json-viewer";
import { StatusBadge } from "@/components/domain/status-badge";
import { DrawerContent, Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useRequestLogDetailQuery } from "@/hooks/use-console-data";
import { formatNumber, formatUsd } from "@/lib/utils";

export function RequestDetailDrawer({
  traceId,
  open,
  onOpenChange,
  traceHrefBase = "/console/usage"
}: {
  traceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traceHrefBase?: string;
}) {
  const detail = useRequestLogDetailQuery(traceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {!detail.data ? (
          <div className="rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">正在加载请求详情…</div>
        ) : (
          <div className="space-y-5">
            <div>
              <DialogTitle className="text-xl font-semibold">请求详情</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                trace_id: <span className="font-mono">{detail.data.traceId}</span>
              </DialogDescription>
              <div className="mt-3">
                <Link
                  href={{ pathname: traceHrefBase, query: { trace_id: detail.data.traceId } }}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  跳转到带 trace_id 的日志链接
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <DetailMetric label="请求状态" value={<StatusBadge status={detail.data.requestStatus} />} />
              <DetailMetric label="重试状态" value={<StatusBadge status={detail.data.retryStatus} />} />
              <DetailMetric label="总 Tokens" value={formatNumber(detail.data.totalTokens)} />
              <DetailMetric label="实际成本" value={formatUsd(detail.data.actualCostUsd)} />
              <DetailMetric label="预估成本" value={formatUsd(detail.data.estimatedCostUsd)} />
              <DetailMetric label="路由 Profile" value={detail.data.routeProfileCode} />
            </div>

            <section className="space-y-3">
              <h3 className="font-medium">重试时间线</h3>
              <div className="space-y-3">
                {detail.data.retryTimeline.map((item) => (
                  <div key={`${item.step}-${item.time}`} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{item.step}</div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{item.time}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-medium">请求负载</h3>
              <JsonViewer value={detail.data.requestPayload} />
            </section>

            <section className="space-y-3">
              <h3 className="font-medium">响应负载</h3>
              <JsonViewer value={detail.data.responsePayload} />
            </section>
          </div>
        )}
      </DrawerContent>
    </Dialog>
  );
}

function DetailMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}
