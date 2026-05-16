"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/domain/status-badge";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useAuditLogsQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuditView() {
  const audit = useAuditLogsQuery();
  const [keyword, setKeyword] = useState("");

  const rows = useMemo(
    () =>
      (audit.data ?? []).filter(
        (row) =>
          !keyword ||
          row.actor.toLowerCase().includes(keyword.toLowerCase()) ||
          row.action.toLowerCase().includes(keyword.toLowerCase()) ||
          row.resourceId.toLowerCase().includes(keyword.toLowerCase()) ||
          (row.traceId ?? "").toLowerCase().includes(keyword.toLowerCase())
      ),
    [keyword, audit.data]
  );

  if (!audit.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载审计日志…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>审计日志</CardTitle>
            <p className="text-sm text-muted-foreground">支持按 actor、动作、资源类型、trace_id 与结果查询。真实生产建议增加导出、保留策略和敏感字段脱敏。</p>
          </div>
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索 actor / action / trace_id" className="lg:max-w-sm" />
        </CardHeader>
      </Card>

      {rows.length === 0 ? (
        <EmptyStateBlock title="没有匹配的审计记录" description="可以尝试直接搜索 trace_id 或动作类型。" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3">时间</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">动作</th>
                  <th className="pb-3">资源</th>
                  <th className="pb-3">结果</th>
                  <th className="pb-3">trace_id</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="py-4 text-muted-foreground">{row.createdAt}</td>
                    <td className="py-4 font-medium">{row.actor}</td>
                    <td className="py-4">{row.action}</td>
                    <td className="py-4">
                      {row.resourceType} / {row.resourceId}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={row.result} />
                    </td>
                    <td className="py-4">
                      {row.traceId ? (
                        <Link href={`/console/usage?trace_id=${row.traceId}`} className="text-accent underline-offset-4 hover:underline">
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
      )}
    </div>
  );
}
