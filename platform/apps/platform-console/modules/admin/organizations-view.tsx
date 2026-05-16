"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/domain/status-badge";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useOrganizationsQuery } from "@/hooks/use-console-data";
import { formatUsd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function OrganizationsView() {
  const organizations = useOrganizationsQuery();
  const [keyword, setKeyword] = useState("");

  const rows = useMemo(
    () =>
      (organizations.data ?? []).filter(
        (row) =>
          !keyword ||
          row.name.toLowerCase().includes(keyword.toLowerCase()) ||
          row.planName.toLowerCase().includes(keyword.toLowerCase())
      ),
    [keyword, organizations.data]
  );

  if (!organizations.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载组织数据…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>组织管理</CardTitle>
            <p className="text-sm text-muted-foreground">
              查看组织套餐、项目数、成员数与月度消费。真实业务筛选维度建议包含套餐、状态、月消费区间、欠费状态。
            </p>
          </div>
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索组织 / 套餐" className="lg:max-w-xs" />
        </CardHeader>
      </Card>

      {rows.length === 0 ? (
        <EmptyStateBlock title="没有符合条件的组织" description="尝试更换关键词，或从账单/风控页交叉定位目标组织。" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3">组织</th>
                  <th className="pb-3">套餐</th>
                  <th className="pb-3">成员数</th>
                  <th className="pb-3">项目数</th>
                  <th className="pb-3">月消费</th>
                  <th className="pb-3">状态</th>
                  <th className="pb-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="py-4 font-medium">{row.name}</td>
                    <td className="py-4">{row.planName}</td>
                    <td className="py-4">{row.memberCount}</td>
                    <td className="py-4">{row.activeProjects}</td>
                    <td className="py-4">{formatUsd(row.monthlySpendUsd)}</td>
                    <td className="py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4 text-right text-xs text-muted-foreground">进入组织详情 / 调整套餐 / 风险限制</td>
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
