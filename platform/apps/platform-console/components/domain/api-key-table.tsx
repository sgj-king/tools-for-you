import type { ApiKeyRecord } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";

export function ApiKeyTable({ rows }: { rows: ApiKeyRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">名称</th>
              <th className="pb-3">项目</th>
              <th className="pb-3">状态</th>
              <th className="pb-3">模型权限</th>
              <th className="pb-3">限流</th>
              <th className="pb-3">最后使用</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/70">
                <td className="py-4">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.keyPrefix}</div>
                </td>
                <td className="py-4">{row.projectName}</td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4">{row.allowedModels.join(", ")}</td>
                <td className="py-4 text-muted-foreground">
                  {row.rpmLimit} RPM / {row.tpmLimit} TPM
                </td>
                <td className="py-4 text-muted-foreground">{row.lastUsedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
