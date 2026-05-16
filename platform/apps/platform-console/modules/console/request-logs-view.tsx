"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequestDetailDrawer } from "@/components/domain/request-detail-drawer";
import { RequestLogTable } from "@/components/domain/request-log-table";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useRequestLogsQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function RequestLogsView() {
  const searchParams = useSearchParams();
  const traceFilter = searchParams.get("trace_id") ?? undefined;
  const logs = useRequestLogsQuery(traceFilter);
  const [keyword, setKeyword] = useState("");
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (traceFilter) {
      setSelectedTraceId(traceFilter);
      setDrawerOpen(true);
    }
  }, [traceFilter]);

  const rows = useMemo(
    () =>
      (logs.data ?? []).filter(
        (row) =>
          !keyword ||
          row.traceId.toLowerCase().includes(keyword.toLowerCase()) ||
          row.apiKeyName.toLowerCase().includes(keyword.toLowerCase()) ||
          row.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
          row.modelName.toLowerCase().includes(keyword.toLowerCase())
      ),
    [keyword, logs.data]
  );

  if (!logs.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载请求日志页…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>独立请求日志页</CardTitle>
            <p className="text-sm text-muted-foreground">
              真实业务筛选维度：trace_id、request_id、项目、Key、模型、状态、供应商、缓存命中、重试状态、时间范围。
            </p>
          </div>
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索 trace_id / key / 项目 / 模型" className="lg:max-w-sm" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>全部状态</option>
            <option>success</option>
            <option>failed</option>
            <option>rate_limited</option>
          </select>
          <select className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>全部重试状态</option>
            <option>none</option>
            <option>recovered</option>
            <option>exhausted</option>
          </select>
          <select className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>全部供应商</option>
            <option>groq-primary-dev</option>
            <option>groq-secondary-dev</option>
          </select>
          <select className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>缓存命中全部</option>
            <option>cache_hit</option>
            <option>cache_miss</option>
          </select>
          <input className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="时间范围（预留）" />
        </CardContent>
      </Card>
      {rows.length === 0 ? (
        <EmptyStateBlock title="没有符合条件的请求" description="尝试调整筛选条件或扩大时间范围。" />
      ) : (
        <RequestLogTable
          rows={rows}
          traceHrefBase="/console/request-logs"
          onSelect={(row) => {
            setSelectedTraceId(row.traceId);
            setDrawerOpen(true);
            window.history.replaceState(null, "", `/console/request-logs?trace_id=${encodeURIComponent(row.traceId)}`);
          }}
        />
      )}
      <RequestDetailDrawer
        traceId={selectedTraceId}
        open={drawerOpen}
        traceHrefBase="/console/request-logs"
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            window.history.replaceState(null, "", "/console/request-logs");
          }
        }}
      />
    </div>
  );
}
