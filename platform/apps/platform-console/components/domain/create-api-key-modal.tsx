"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createApiKeySchema, type CreateApiKeyValues } from "@/features/api-keys/create-api-key-schema";
import { useCreateApiKeyMutation, useSessionUserQuery } from "@/hooks/use-console-data";
import { hasRole } from "@/lib/permissions";
import { CopySecretField } from "@/components/domain/copy-secret-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateApiKeyModal() {
  const session = useSessionUserQuery();
  const canCreate = session.data ? hasRole(session.data.role, "project_admin") : false;
  const [open, setOpen] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const mutation = useCreateApiKeyMutation();

  const form = useForm<CreateApiKeyValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      projectId: "proj_001",
      allowedModels: ["chat-pro"],
      rpmLimit: 300,
      tpmLimit: 120000,
      ipAllowlist: []
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      ...values,
      allowedModels: values.allowedModels,
      ipAllowlist: values.ipAllowlist
    };
    const result = await mutation.mutateAsync(payload);
    setCreatedSecret(result.plainTextKey);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate}>创建 API Key</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">创建 API Key</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              配置项目、模型权限、RPM/TPM、过期时间和 IP 白名单。成功后只展示一次明文 key。
            </DialogDescription>
          </div>

          {!canCreate ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">当前账号没有创建 API Key 的权限。</div> : null}

          {createdSecret ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                明文密钥只会展示一次。请立即复制或保存到你的密钥管理系统。
              </div>
              <CopySecretField value={createdSecret} />
              <Button className="w-full" onClick={() => setOpen(false)}>
                完成
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">名称</label>
                  <Input {...form.register("name")} placeholder="例如 production-web" />
                  <FieldError message={form.formState.errors.name?.message} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">所属项目</label>
                  <Input {...form.register("projectId")} placeholder="proj_001" />
                  <FieldError message={form.formState.errors.projectId?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">可访问模型（逗号分隔）</label>
                <Input
                  defaultValue="chat-pro,reasoning-pro"
                  onChange={(event) =>
                    form.setValue(
                      "allowedModels",
                      event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    )
                  }
                />
                <FieldError message={form.formState.errors.allowedModels?.message as string | undefined} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">RPM 限制</label>
                  <Input type="number" {...form.register("rpmLimit", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">TPM 限制</label>
                  <Input type="number" {...form.register("tpmLimit", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">过期时间</label>
                  <Input {...form.register("expiresAt")} placeholder="2026-12-31 23:59" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">IP 白名单（逗号分隔）</label>
                  <Input
                    placeholder="203.0.113.10/32,203.0.113.11/32"
                    onChange={(event) =>
                      form.setValue(
                        "ipAllowlist",
                        event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/60 p-4 text-sm text-muted-foreground">
                权限与交互要求：仅项目管理员以上可创建；表单实时校验；成功用 result panel 展示；失败用字段错误和全局错误提示。
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={mutation.isPending || !canCreate}>
                  {mutation.isPending ? "创建中…" : "创建"}
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
