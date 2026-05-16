"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-client-error";
import { useProjectSettingsQuery, useUpdateProjectSettingsMutation } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ProjectSettingsView() {
  const settings = useProjectSettingsQuery();
  const mutation = useUpdateProjectSettingsMutation();
  const [formValues, setFormValues] = useState({
    projectName: "",
    environment: "production",
    defaultModel: "",
    callbackUrl: "",
    monthlyBudgetUsd: "",
    allowedOrigins: "",
    tags: ""
  });
  const fieldErrors = getApiFieldErrors(mutation.error);

  useEffect(() => {
    if (!settings.data) return;
    setFormValues({
      projectName: settings.data.projectName,
      environment: settings.data.environment,
      defaultModel: settings.data.defaultModel,
      callbackUrl: settings.data.callbackUrl ?? "",
      monthlyBudgetUsd: String(settings.data.monthlyBudgetUsd),
      allowedOrigins: settings.data.allowedOrigins.join(", "),
      tags: settings.data.tags.join(", ")
    });
  }, [settings.data]);

  const initialSnapshot = settings.data
    ? JSON.stringify({
        projectName: settings.data.projectName,
        environment: settings.data.environment,
        defaultModel: settings.data.defaultModel,
        callbackUrl: settings.data.callbackUrl ?? "",
        monthlyBudgetUsd: String(settings.data.monthlyBudgetUsd),
        allowedOrigins: settings.data.allowedOrigins.join(", "),
        tags: settings.data.tags.join(", ")
      })
    : "";
  const currentSnapshot = JSON.stringify(formValues);
  const isDirty = Boolean(settings.data) && initialSnapshot !== currentSnapshot;

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (!settings.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载项目设置…</div>;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({
      projectName: formValues.projectName,
      environment: formValues.environment,
      defaultModel: formValues.defaultModel,
      callbackUrl: formValues.callbackUrl || undefined,
      monthlyBudgetUsd: Number(formValues.monthlyBudgetUsd),
      allowedOrigins: formValues.allowedOrigins.split(",").map((item) => item.trim()).filter(Boolean),
      tags: formValues.tags.split(",").map((item) => item.trim()).filter(Boolean)
    });
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>项目设置</CardTitle>
          <p className="text-sm text-muted-foreground">这里承接项目级的默认模型、预算、回调地址、允许来源和标签配置。Tablet 建议采用分组折叠卡片。</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
            <Field label="项目名称">
              <Input value={formValues.projectName} onChange={(event) => setFormValues((current) => ({ ...current, projectName: event.target.value }))} />
              <FieldError message={fieldErrors.projectName} />
            </Field>
            <Field label="运行环境">
              <select
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={formValues.environment}
                onChange={(event) => setFormValues((current) => ({ ...current, environment: event.target.value }))}
              >
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
              <FieldError message={fieldErrors.environment} />
            </Field>
            <Field label="默认模型">
              <Input value={formValues.defaultModel} onChange={(event) => setFormValues((current) => ({ ...current, defaultModel: event.target.value }))} />
              <FieldError message={fieldErrors.defaultModel} />
            </Field>
            <Field label="月预算（USD）">
              <Input value={formValues.monthlyBudgetUsd} onChange={(event) => setFormValues((current) => ({ ...current, monthlyBudgetUsd: event.target.value }))} />
              <FieldError message={fieldErrors.monthlyBudgetUsd} />
            </Field>
            <div className="md:col-span-2">
              <Field label="回调地址">
                <Input value={formValues.callbackUrl} onChange={(event) => setFormValues((current) => ({ ...current, callbackUrl: event.target.value }))} />
                <FieldError message={fieldErrors.callbackUrl} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="允许来源（逗号分隔）">
                <Input value={formValues.allowedOrigins} onChange={(event) => setFormValues((current) => ({ ...current, allowedOrigins: event.target.value }))} />
                <FieldError message={fieldErrors.allowedOrigins} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="标签（逗号分隔）">
                <Input value={formValues.tags} onChange={(event) => setFormValues((current) => ({ ...current, tags: event.target.value }))} />
                <FieldError message={fieldErrors.tags} />
              </Field>
            </div>
            {isDirty ? <div className="md:col-span-2 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">你有尚未保存的项目设置修改。</div> : null}
            {mutation.error ? (
              <div className="md:col-span-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {getApiErrorMessage(mutation.error, "保存失败，请检查配置。")}
              </div>
            ) : null}
            {mutation.isSuccess ? <div className="md:col-span-2 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent">项目设置已保存。</div> : null}
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={!isDirty || mutation.isPending}
                onClick={() => {
                  if (!settings.data) return;
                  setFormValues({
                    projectName: settings.data.projectName,
                    environment: settings.data.environment,
                    defaultModel: settings.data.defaultModel,
                    callbackUrl: settings.data.callbackUrl ?? "",
                    monthlyBudgetUsd: String(settings.data.monthlyBudgetUsd),
                    allowedOrigins: settings.data.allowedOrigins.join(", "),
                    tags: settings.data.tags.join(", ")
                  });
                }}
              >
                重置
              </Button>
              <Button type="submit" disabled={mutation.isPending || !isDirty}>
                {mutation.isPending ? "保存中…" : "保存项目设置"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>标签与治理</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {settings.data.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-3 py-1 text-sm">
              {tag}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
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
