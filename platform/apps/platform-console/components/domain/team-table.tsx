import { EditTeamRoleModal } from "@/components/domain/edit-team-role-modal";
import type { TeamMember } from "@/types/domain";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TeamTable({
  rows,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: {
  rows: TeamMember[];
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
}) {
  const selectedSet = new Set(selectedIds ?? []);
  const allSelected = rows.length > 0 && rows.every((row) => selectedSet.has(row.id));
  return (
    <Card>
      <CardHeader>
        <CardTitle>团队成员</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-3">
                <input type="checkbox" checked={allSelected} onChange={(event) => onToggleSelectAll?.(event.target.checked)} />
              </th>
              <th className="pb-3">成员</th>
              <th className="pb-3">角色</th>
              <th className="pb-3">项目范围</th>
              <th className="pb-3">状态</th>
              <th className="pb-3">最近活跃</th>
              <th className="pb-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/70">
                <td className="py-4">
                  <input type="checkbox" checked={selectedSet.has(row.id)} onChange={(event) => onToggleSelect?.(row.id, event.target.checked)} />
                </td>
                <td className="py-4">
                  <div className="font-medium">{row.displayName}</div>
                  <div className="text-xs text-muted-foreground">{row.email}</div>
                </td>
                <td className="py-4">{row.role}</td>
                <td className="py-4">{row.projectScope.join(", ")}</td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4 text-muted-foreground">{row.lastActiveAt}</td>
                <td className="py-4 text-right">
                  <EditTeamRoleModal member={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
