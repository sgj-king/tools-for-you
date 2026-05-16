"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DrawerContent, Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useReplySupportTicketMutation, useSupportTicketDetailQuery } from "@/hooks/use-console-data";

export function SupportTicketDetailDrawer({
  ticketId,
  open,
  onOpenChange
}: {
  ticketId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useSupportTicketDetailQuery(ticketId);
  const replyMutation = useReplySupportTicketMutation();
  const [reply, setReply] = useState("");

  async function handleReply() {
    if (!ticketId || !reply.trim()) return;
    await replyMutation.mutateAsync({
      ticketId,
      payload: {
        content: reply.trim()
      }
    });
    setReply("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {!detail.data ? (
          <div className="rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">正在加载工单详情…</div>
        ) : (
          <div className="space-y-5">
            <div>
              <DialogTitle className="text-xl font-semibold">{detail.data.subject}</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                {detail.data.ticketNumber} · {detail.data.category} · {detail.data.status}
              </DialogDescription>
              {detail.data.traceId ? (
                <div className="mt-3">
                  <Link href={`/console/request-logs?trace_id=${detail.data.traceId}`} className="text-sm font-medium text-accent hover:underline">
                    查看关联 trace 日志
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm leading-7 text-muted-foreground">{detail.data.description}</div>
            <section className="space-y-3">
              <h3 className="font-medium">对话记录</h3>
              <div className="space-y-3">
                {detail.data.replies.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{item.authorName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.authorRole} · {item.createdAt}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{item.content}</div>
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="font-medium">回复工单</h3>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入给客户或内部支持团队的回复内容"
              />
              {replyMutation.error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">回复失败，请稍后重试。</div> : null}
              <div className="flex justify-end">
                <Button onClick={handleReply} disabled={replyMutation.isPending || !reply.trim()}>
                  {replyMutation.isPending ? "发送中…" : "发送回复"}
                </Button>
              </div>
            </section>
          </div>
        )}
      </DrawerContent>
    </Dialog>
  );
}
