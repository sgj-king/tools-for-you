"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSessionUserQuery, useUpdateTeamRoleMutation } from "@/hooks/use-console-data";
import { hasRole } from "@/lib/permissions";
import type { TeamMember } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const editRoleSchema = z.object({
  role: z.enum(["member", "project_admin", "org_admin", "finance"]),
  projectScope: z.array(z.string()).min(1, "至少保留一个项目范围"),
  status: z.enum(["active", "invited", "disabled"])
});

type EditRoleValues = z.infer<typeof editRoleSchema>;

export function EditTeamRoleModal({ member }: { member: TeamMember }) {
  const session = useSessionUserQuery();
  const canManage = session.data ? hasRole(session.data.role, "org_admin") : false;
  const [open, setOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = useUpdateTeamRoleMutation();

  const form = useForm<EditRoleValues>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      role: member.role,
      projectScope: member.projectScope,
      status: member.status
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await mutation.mutateAsync({
      memberId: member.id,
      payload: values
    });
    setSuccessMessage(`已更新 ${member.displayName} 的角色为 ${result.role}。`);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" disabled={!canManage}>
          编辑角色
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">编辑成员权限</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              用于调整角色、项目范围和成员状态。桌面端建议使用行内动作，平板端建议切到全屏抽屉。
            </DialogDescription>
          </div>
          {!canManage ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">当前账号没有编辑团队权限，仅组织管理员及以上可修改成员角色。</div> : null}
          {successMessage ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm">{successMessage}</div>
              <Button className="w-full" onClick={() => setOpen(false)}>
                完成
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">角色</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={form.watch("role")}
                  onChange={(event) => form.setValue("role", event.target.value as EditRoleValues["role"])}
                >
                  <option value="member">member</option>
                  <option value="project_admin">project_admin</option>
                  <option value="org_admin">org_admin</option>
                  <option value="finance">finance</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">项目范围（逗号分隔）</label>
                <Input
                  defaultValue={member.projectScope.join(", ")}
                  onChange={(event) =>
                    form.setValue(
                      "projectScope",
                      event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">成员状态</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={form.watch("status")}
                  onChange={(event) => form.setValue("status", event.target.value as EditRoleValues["status"])}
                >
                  <option value="active">active</option>
                  <option value="invited">invited</option>
                  <option value="disabled">disabled</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={mutation.isPending || !canManage}>
                  {mutation.isPending ? "保存中…" : "保存修改"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
