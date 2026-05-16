"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { teamInviteSchema, type TeamInviteValues } from "@/features/team/team-invite-schema";
import { useInviteTeamMemberMutation, useSessionUserQuery } from "@/hooks/use-console-data";
import { hasRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function InviteTeamMemberModal() {
  const session = useSessionUserQuery();
  const canInvite = session.data ? hasRole(session.data.role, "org_admin") : false;
  const [open, setOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = useInviteTeamMemberMutation();

  const form = useForm<TeamInviteValues>({
    resolver: zodResolver(teamInviteSchema),
    defaultValues: {
      email: "",
      role: "project_admin",
      projectScope: ["Web App"]
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await mutation.mutateAsync(values);
    setSuccessMessage(`已向 ${result.email} 发送邀请，角色为 ${result.role}。`);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canInvite}>邀请成员</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">邀请团队成员</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              支持角色、项目范围、成功反馈和权限限制。仅组织管理员及以上可邀请成员。
            </DialogDescription>
          </div>

          {!canInvite ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">当前账号没有邀请成员权限。</div> : null}

          {successMessage ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">{successMessage}</div>
              <Button className="w-full" onClick={() => setOpen(false)}>
                完成
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">成员邮箱</label>
                <Input {...form.register("email")} placeholder="member@example.com" />
                <FieldError message={form.formState.errors.email?.message} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">角色</label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={form.watch("role")}
                    onChange={(event) => form.setValue("role", event.target.value as TeamInviteValues["role"])}
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
                    defaultValue="Web App,Partner Integrations"
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
                  <FieldError message={form.formState.errors.projectScope?.message as string | undefined} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/60 p-4 text-sm text-muted-foreground">
                Desktop 主方案：列表页右上角主操作按钮打开弹窗。Tablet 兼容建议：切换为全宽 Sheet，并把角色提示放到提交按钮上方。
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={mutation.isPending || !canInvite}>
                  {mutation.isPending ? "发送中…" : "发送邀请"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-danger">{message}</p>;
}
