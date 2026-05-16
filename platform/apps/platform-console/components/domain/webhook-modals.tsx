"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CopySecretField } from "@/components/domain/copy-secret-field";
import { createWebhookSchema, testWebhookSchema, type CreateWebhookValues, type TestWebhookValues } from "@/features/webhooks/webhook-schema";
import { useCreateWebhookMutation, useSessionUserQuery, useTestWebhookMutation, useWebhooksQuery } from "@/hooks/use-console-data";
import { hasRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateWebhookModal() {
  const session = useSessionUserQuery();
  const canManage = session.data ? hasRole(session.data.role, "project_admin") : false;
  const [open, setOpen] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const mutation = useCreateWebhookMutation();

  const form = useForm<CreateWebhookValues>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      name: "",
      endpoint: "https://hooks.example.com/platform",
      events: ["request.failed"],
      retryPolicy: "指数退避，最多 6 次"
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await mutation.mutateAsync(values);
    setCreatedSecret(result.signingSecret);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canManage}>创建 Webhook</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">创建 Webhook</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              配置 endpoint、事件订阅、重试策略与签名密钥。仅项目管理员及以上可操作。
            </DialogDescription>
          </div>

          {createdSecret ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">签名密钥只展示一次，请立即复制到你的接收端服务配置。</div>
              <CopySecretField value={createdSecret} />
              <Button className="w-full" onClick={() => setOpen(false)}>
                完成
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">名称</label>
                <Input {...form.register("name")} placeholder="余额预警通知" />
                <FieldError message={form.formState.errors.name?.message} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint</label>
                <Input {...form.register("endpoint")} placeholder="https://hooks.example.com/platform" />
                <FieldError message={form.formState.errors.endpoint?.message} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">订阅事件（逗号分隔）</label>
                  <Input
                    defaultValue="request.failed,billing.balance.low"
                    onChange={(event) =>
                      form.setValue(
                        "events",
                        event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                  <FieldError message={form.formState.errors.events?.message as string | undefined} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">重试策略</label>
                  <Input {...form.register("retryPolicy")} />
                  <FieldError message={form.formState.errors.retryPolicy?.message} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/60 p-4 text-sm text-muted-foreground">
                表单校验：必须是 HTTPS endpoint；至少一个事件；无权限用户按钮禁用。Tablet 兼容建议：改成底部抽屉并保留“测试回调”快捷操作。
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={mutation.isPending || !canManage}>
                  {mutation.isPending ? "创建中…" : "创建 Webhook"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TestWebhookModal() {
  const webhooks = useWebhooksQuery();
  const mutation = useTestWebhookMutation();
  const [open, setOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const form = useForm<TestWebhookValues>({
    resolver: zodResolver(testWebhookSchema),
    defaultValues: {
      webhookId: "wh_001",
      event: "request.failed"
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await mutation.mutateAsync(values);
    setResultMessage(`测试投递 ${result.status}，delivery_id=${result.deliveryId}，耗时 ${result.latencyMs}ms。`);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">测试投递</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">测试 Webhook 投递</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">用于验证签名、网络连通性和接收端幂等处理。</DialogDescription>
          </div>

          {resultMessage ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm">{resultMessage}</div>
              <Button className="w-full" onClick={() => setOpen(false)}>
                完成
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={form.watch("webhookId")}
                  onChange={(event) => form.setValue("webhookId", event.target.value)}
                >
                  {(webhooks.data ?? []).map((webhook) => (
                    <option key={webhook.id} value={webhook.id}>
                      {webhook.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">测试事件</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={form.watch("event")}
                  onChange={(event) => form.setValue("event", event.target.value)}
                >
                  <option value="request.failed">request.failed</option>
                  <option value="billing.balance.low">billing.balance.low</option>
                  <option value="risk.event.opened">risk.event.opened</option>
                </select>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/60 p-4 text-sm text-muted-foreground">
                Desktop 主方案：创建按钮与测试按钮并列放在列表页右上。真实后端联调时建议在详情抽屉展示最近一次 delivery body 与签名头。
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "测试中…" : "发送测试事件"}
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
