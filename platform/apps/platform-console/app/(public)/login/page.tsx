"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ShieldCheck, Workflow } from "lucide-react";
import { useLoginMutation } from "@/hooks/use-console-data";
import { loginFormSchema, type LoginFormValues } from "@/features/auth/login-form-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolvePostLoginDestination } from "@/lib/portal-navigation";

export default function LoginPage() {
  const loginMutation = useLoginMutation();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      mfaCode: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await loginMutation.mutateAsync(values);
    const destination = resolvePostLoginDestination(result.sessionUser.role);
    window.location.assign(destination);
  });

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-6 px-6 py-10 lg:grid-cols-[1.1fr,0.9fr]">
      <section className="rounded-[32px] border border-white/15 bg-[linear-gradient(140deg,rgba(26,111,96,.98),rgba(22,90,78,.98))] p-8 text-white shadow-glow lg:p-12">
        <div className="text-xs uppercase tracking-[0.24em] text-white/75">app.auth.login.title</div>
        <h1 className="mt-4 font-display text-5xl leading-tight">把开发者调用、计费、风控和运营动作放进同一套控制台。</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/80">
          登录后按角色进入工作台或管理后台。UI 文案默认中文，后续可直接替换为 i18n key。
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <FeatureCard icon={ShieldCheck} title="安全登录" description="预留 MFA、设备识别、SSO 与登录审计能力。" />
          <FeatureCard icon={Workflow} title="角色分流" description="同一账号可按组织与平台角色进入不同控制台视图。" />
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardContent className="space-y-6 p-8">
          <div>
            <div className="text-sm text-muted-foreground">欢迎回来</div>
            <h2 className="mt-2 font-display text-3xl">登录到彗星科技</h2>
            <p className="mt-2 text-sm text-muted-foreground">Desktop 主方案为左信息区 + 右登录卡片。Tablet 建议上下堆叠并保持提交按钮常驻可见。</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="工作邮箱" error={form.formState.errors.email?.message}>
              <Input placeholder="name@company.com" {...form.register("email")} />
            </Field>
            <Field label="密码" error={form.formState.errors.password?.message}>
              <Input placeholder="请输入密码" type="password" {...form.register("password")} />
            </Field>
            <Field label="MFA 验证码（可选）" error={form.formState.errors.mfaCode?.message}>
              <Input placeholder="123456" {...form.register("mfaCode")} />
            </Field>

            {loginMutation.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">登录失败，请检查账号、密码或 MFA 验证码。</div>
            ) : null}

            {loginMutation.isSuccess ? (
              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">{loginMutation.data.message}</div>
            ) : null}

            <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "正在登录…" : "登录"}
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <Link href="/register" className="hover:text-foreground">
              注册组织
            </Link>
            <Link href="/forgot-password" className="hover:text-foreground">
              忘记密码
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur">
      <Icon className="h-5 w-5 text-[#f7f1d1]" />
      <div className="mt-3 font-medium">{title}</div>
      <div className="mt-1 text-sm text-white/75">{description}</div>
    </div>
  );
}
