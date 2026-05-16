import Link from "next/link";
import type { RequestLogRecord } from "@/types/domain";
import { formatNumber, formatUsd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";

export function RequestLogTable({
  rows,
  onSelect,
  traceHrefBase = "/console/usage"
}: {
  rows: RequestLogRecord[];
  onSelect?: (row: RequestLogRecord) => void;
  traceHrefBase?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>请求日志</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">状态</th>
              <th className="pb-3">trace_id</th>
              <th className="pb-3">模型</th>
              <th className="pb-3">Key / 项目</th>
              <th className="pb-3">供应商</th>
              <th className="pb-3">Tokens / 成本</th>
              <th className="pb-3">重试</th>
              <th className="pb-3">时间</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="cursor-pointer border-t border-border/70 align-top hover:bg-muted/40" onClick={() => onSelect?.(row)}>
                <td className="py-4">
                  <StatusBadge status={row.requestStatus} />
                </td>
                <td className="py-4 font-mono text-xs text-accent">
                  <Link
                    href={{ pathname: traceHrefBase, query: { trace_id: row.traceId } }}
                    className="hover:underline"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect?.(row);
                    }}
                  >
                    {row.traceId}
                  </Link>
                </td>
                <td className="py-4">
                  <div className="font-medium">{row.modelName}</div>
                  <div className="text-xs text-muted-foreground">{row.routeProfileCode}</div>
                </td>
                <td className="py-4">
                  <div>{row.apiKeyName}</div>
                  <div className="text-xs text-muted-foreground">{row.projectName}</div>
                </td>
                <td className="py-4 text-muted-foreground">{row.providerCode}</td>
                <td className="py-4">
                  <div>{formatNumber(row.totalTokens)}</div>
                  <div className="text-xs text-muted-foreground">{formatUsd(row.actualCostUsd)}</div>
                </td>
                <td className="py-4">
                  <StatusBadge status={row.retryStatus} />
                </td>
                <td className="py-4 text-muted-foreground">{row.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
