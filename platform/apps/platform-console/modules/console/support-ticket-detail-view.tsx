"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useReplySupportTicketMutation, useSupportTicketDetailQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupportTicketDetailView({ ticketId }: { ticketId: string }) {
  const detail = useSupportTicketDetailQuery(ticketId);
  const replyMutation = useReplySupportTicketMutation();
  const [reply, setReply] = useState("");

  if (!detail.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载工单详情页…</div>;
  }

  async function handleReply() {
    if (!reply.trim()) return;
    await replyMutation.mutateAsync({
      ticketId,
      payload: {
        content: reply.trim()
      }
    });
    setReply("");
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>{detail.data.subject}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {detail.data.ticketNumber} · {detail.data.category} · {detail.data.status}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm leading-7 text-muted-foreground">{detail.data.description}</div>
          {detail.data.traceId ? (
            <Link href={`/console/request-logs?trace_id=${detail.data.traceId}`} className="text-sm font-medium text-accent hover:underline">
              查看关联 trace 日志
            </Link>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>对话记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>回复工单</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入要回复给客户或支持团队的内容"
          />
          {replyMutation.error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">回复发送失败。</div> : null}
          {replyMutation.isSuccess ? <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent">回复已发送。</div> : null}
          <div className="flex justify-end">
            <Button onClick={handleReply} disabled={replyMutation.isPending || !reply.trim()}>
              {replyMutation.isPending ? "发送中…" : "发送回复"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
