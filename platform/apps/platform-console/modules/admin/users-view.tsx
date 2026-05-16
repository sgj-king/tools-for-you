"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/domain/status-badge";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useAdminUsersQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function UsersView() {
  const users = useAdminUsersQuery();
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("all");

  const rows = useMemo(() => {
    return (users.data ?? []).filter((row) => {
      const matchesKeyword =
        !keyword ||
        row.displayName.toLowerCase().includes(keyword.toLowerCase()) ||
        row.email.toLowerCase().includes(keyword.toLowerCase()) ||
        row.orgName.toLowerCase().includes(keyword.toLowerCase());
      const matchesRole = role === "all" || row.role === role;
      return matchesKeyword && matchesRole;
    });
  }, [keyword, role, users.data]);

  if (!users.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载用户管理数据…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>用户管理</CardTitle>
            <p className="text-sm text-muted-foreground">
              支持搜索、筛选、排序、分页、批量封禁、MFA 状态查看与组织跳转。Tablet 建议把筛选区折叠到顶部。
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:justify-end">
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索用户 / 邮箱 / 组织" className="md:max-w-xs" />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">全部角色</option>
              <option value="platform_super_admin">平台超管</option>
              <option value="ops_admin">运维管理员</option>
              <option value="finance">财务</option>
              <option value="org_admin">组织管理员</option>
              <option value="member">普通成员</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      {rows.length === 0 ? (
        <EmptyStateBlock title="没有符合条件的用户" description="尝试放宽角色或关键词筛选条件。" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3">用户</th>
                  <th className="pb-3">所属组织</th>
                  <th className="pb-3">角色</th>
                  <th className="pb-3">状态</th>
                  <th className="pb-3">MFA</th>
                  <th className="pb-3">最近活跃</th>
                  <th className="pb-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="py-4">
                      <div className="font-medium">{row.displayName}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </td>
                    <td className="py-4">{row.orgName}</td>
                    <td className="py-4">{row.role}</td>
                    <td className="py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4">{row.mfaEnabled ? "已启用" : "未启用"}</td>
                    <td className="py-4 text-muted-foreground">{row.lastActiveAt}</td>
                    <td className="py-4 text-right text-xs text-muted-foreground">重置 MFA / 封禁 / 查看工单</td>
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
