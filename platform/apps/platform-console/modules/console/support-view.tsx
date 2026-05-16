"use client";

import { useState } from "react";
import { SupportTicketDetailDrawer } from "@/components/domain/support-ticket-detail-drawer";
import { SupportTicketTable } from "@/components/domain/support-ticket-table";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useSupportTicketsQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupportView() {
  const tickets = useSupportTicketsQuery();
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!tickets.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载支持工单…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>支持与工单</CardTitle>
          <p className="text-sm text-muted-foreground">面向客户的支持入口，按计费、技术、风控、功能诉求分流。Desktop 主方案为顶部筛选 + 列表 + 右侧详情预留。</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <select className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>全部分类</option>
            <option>billing</option>
            <option>technical</option>
            <option>risk</option>
            <option>feature_request</option>
          </select>
          <select className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>全部状态</option>
            <option>open</option>
            <option>pending</option>
            <option>resolved</option>
          </select>
          <input className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="搜索工单号 / 主题" />
          <input className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="时间范围（预留）" />
        </CardContent>
      </Card>
      {tickets.data.length === 0 ? (
        <EmptyStateBlock title="暂无工单" description="当前没有需要处理的支持工单。" />
      ) : (
        <SupportTicketTable
          rows={tickets.data}
          onSelect={(row) => {
            setSelectedTicketId(row.id);
            setDrawerOpen(true);
          }}
        />
      )}
      <SupportTicketDetailDrawer ticketId={selectedTicketId} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
