"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-client-error";
import { useUpdateSecuritySettingsMutation } from "@/hooks/use-console-data";
import type { SecuritySettings } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SecuritySettingsModal({ settings }: { settings: SecuritySettings }) {
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    mfaRequired: settings.mfaRequired,
    sessionTimeoutMinutes: String(settings.sessionTimeoutMinutes),
    ipAllowlist: settings.ipAllowlist.join(", "),
    webhookSignatureRequired: settings.webhookSignatureRequired,
    keyRotationDays: String(settings.keyRotationDays)
  });
  const mutation = useUpdateSecuritySettingsMutation();
  const fieldErrors = getApiFieldErrors(mutation.error);
  const initialSnapshot = JSON.stringify({
    mfaRequired: settings.mfaRequired,
    sessionTimeoutMinutes: String(settings.sessionTimeoutMinutes),
    ipAllowlist: settings.ipAllowlist.join(", "),
    webhookSignatureRequired: settings.webhookSignatureRequired,
    keyRotationDays: String(settings.keyRotationDays)
  });
  const currentSnapshot = JSON.stringify(formValues);
  const isDirty = initialSnapshot !== currentSnapshot;

  useEffect(() => {
    setFormValues({
      mfaRequired: settings.mfaRequired,
      sessionTimeoutMinutes: String(settings.sessionTimeoutMinutes),
      ipAllowlist: settings.ipAllowlist.join(", "),
      webhookSignatureRequired: settings.webhookSignatureRequired,
      keyRotationDays: String(settings.keyRotationDays)
    });
  }, [settings, open]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!open || !isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isDirty && !mutation.isPending) {
      const confirmed = window.confirm("当前有未保存的安全设置修改，确认放弃吗？");
      if (!confirmed) return;
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({
      mfaRequired: formValues.mfaRequired,
      sessionTimeoutMinutes: Number(formValues.sessionTimeoutMinutes),
      ipAllowlist: formValues.ipAllowlist.split(",").map((item) => item.trim()).filter(Boolean),
      webhookSignatureRequired: formValues.webhookSignatureRequired,
      keyRotationDays: Number(formValues.keyRotationDays)
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>编辑安全设置</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">编辑安全设置</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">修改组织级安全策略并提交到安全服务。</DialogDescription>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <BooleanField
              label="强制 MFA"
              checked={formValues.mfaRequired}
              onChange={(value) => setFormValues((current) => ({ ...current, mfaRequired: value }))}
            />
            <BooleanField
              label="Webhook 签名校验"
              checked={formValues.webhookSignatureRequired}
              onChange={(value) => setFormValues((current) => ({ ...current, webhookSignatureRequired: value }))}
            />
            <Field label="会话超时（分钟）">
              <Input value={formValues.sessionTimeoutMinutes} onChange={(event) => setFormValues((current) => ({ ...current, sessionTimeoutMinutes: event.target.value }))} />
              <FieldError message={fieldErrors.sessionTimeoutMinutes} />
            </Field>
            <Field label="Key 轮换周期（天）">
              <Input value={formValues.keyRotationDays} onChange={(event) => setFormValues((current) => ({ ...current, keyRotationDays: event.target.value }))} />
              <FieldError message={fieldErrors.keyRotationDays} />
            </Field>
            <Field label="IP 白名单（逗号分隔）">
              <Input value={formValues.ipAllowlist} onChange={(event) => setFormValues((current) => ({ ...current, ipAllowlist: event.target.value }))} />
              <FieldError message={fieldErrors.ipAllowlist} />
            </Field>
            {isDirty ? <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">你有尚未保存的安全设置修改。</div> : null}
            {mutation.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {getApiErrorMessage(mutation.error, "保存失败，请检查输入或稍后重试。")}
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isPending || !isDirty}>
                {mutation.isPending ? "保存中…" : "保存修改"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="text-xs text-danger">{message}</div>;
}

function BooleanField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
    </label>
  );
}
