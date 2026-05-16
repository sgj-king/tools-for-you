"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-client-error";
import { useUpdateWebhookMutation } from "@/hooks/use-console-data";
import type { WebhookRecord } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function EditWebhookModal({
  webhook,
  open,
  onOpenChange
}: {
  webhook?: WebhookRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateWebhookMutation();
  const fieldErrors = getApiFieldErrors(mutation.error);
  const [formValues, setFormValues] = useState({
    name: "",
    endpoint: "",
    events: "",
    retryPolicy: "",
    status: "active"
  });

  useEffect(() => {
    if (!webhook) return;
    setFormValues({
      name: webhook.name,
      endpoint: webhook.endpoint,
      events: webhook.events.join(", "),
      retryPolicy: webhook.retryPolicy,
      status: webhook.status
    });
  }, [webhook, open]);

  if (!webhook) return null;
  const targetWebhook = webhook;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({
      webhookId: targetWebhook.id,
      payload: {
        name: formValues.name,
        endpoint: formValues.endpoint,
        events: formValues.events.split(",").map((item) => item.trim()).filter(Boolean),
        retryPolicy: formValues.retryPolicy,
        status: formValues.status
      }
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">编辑 Webhook</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">修改 endpoint、事件、重试与状态。</DialogDescription>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">名称</span>
              <Input value={formValues.name} onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))} />
              <FieldError message={fieldErrors.name} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Endpoint</span>
              <Input value={formValues.endpoint} onChange={(event) => setFormValues((current) => ({ ...current, endpoint: event.target.value }))} />
              <FieldError message={fieldErrors.endpoint} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">订阅事件（逗号分隔）</span>
                <Input value={formValues.events} onChange={(event) => setFormValues((current) => ({ ...current, events: event.target.value }))} />
                <FieldError message={fieldErrors.events} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">重试策略</span>
                <Input value={formValues.retryPolicy} onChange={(event) => setFormValues((current) => ({ ...current, retryPolicy: event.target.value }))} />
                <FieldError message={fieldErrors.retryPolicy} />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">状态</span>
              <select
                value={formValues.status}
                onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="active">active</option>
                <option value="disabled">disabled</option>
                <option value="failing">failing</option>
              </select>
              <FieldError message={fieldErrors.status} />
            </label>
            {mutation.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {getApiErrorMessage(mutation.error, "更新 Webhook 失败，请稍后重试。")}
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "保存中…" : "保存修改"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="text-xs text-danger">{message}</div>;
}
