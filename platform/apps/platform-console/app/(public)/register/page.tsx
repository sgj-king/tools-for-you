"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Building2, KeyRound, Layers3 } from "lucide-react";
import { registerFormSchema, type RegisterFormValues } from "@/features/auth/register-form-schema";
import { useRegisterMutation } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const registerMutation = useRegisterMutation();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      adminName: "",
      email: "",
      organizationName: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await registerMutation.mutateAsync({
      adminName: values.adminName,
      email: values.email,
      organizationName: values.organizationName,
      password: values.password
    });
    window.location.assign(loginHref);
  });

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-6 px-6 py-10 lg:grid-cols-[0.92fr,1.08fr]">
      <Card className="overflow-hidden border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,.96),rgba(24,48,69,.92))] text-white">
        <CardContent className="space-y-6 p-8 lg:p-10">
          <div className="text-xs uppercase tracking-[0.24em] text-white/65">app.auth.register.title</div>
          <h1 className="font-display text-4xl leading-tight">创建组织、工作区与第一个可计费项目。</h1>
          <p className="text-sm leading-7 text-white/75">
            注册完成后建议马上进入项目设置、API Key 管理和计费中心。Tablet 兼容建议：信息说明折叠为顶部介绍卡。
          </p>
          <div className="space-y-3">
            <Highlight icon={Building2} title="组织与成员" description="一次注册完成组织创建与管理员账号初始化。" />
            <Highlight icon={KeyRound} title="API 产品就绪" description="后续可直接发起首个项目、配置 API Key 与模型权限。" />
            <Highlight icon={Layers3} title="商业化预留" description="套餐、账单、发票、额度和风控页面都从这里延伸。" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-8">
          <div>
            <div className="text-sm text-muted-foreground">创建组织</div>
            <h2 className="mt-2 font-display text-3xl">开始你的 AI API 平台</h2>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="管理员姓名" error={form.formState.errors.adminName?.message}>
              <Input placeholder="例如：林川" {...form.register("adminName")} />
            </Field>
            <Field label="工作邮箱" error={form.formState.errors.email?.message}>
              <Input placeholder="name@company.com" {...form.register("email")} />
            </Field>
            <div className="md:col-span-2">
              <Field label="组织名称" error={form.formState.errors.organizationName?.message}>
                <Input placeholder="彗星科技" {...form.register("organizationName")} />
              </Field>
            </div>
            <Field label="设置密码" error={form.formState.errors.password?.message}>
              <Input placeholder="至少 8 位" type="password" {...form.register("password")} />
            </Field>
            <Field label="确认密码" error={form.formState.errors.confirmPassword?.message}>
              <Input placeholder="再次输入密码" type="password" {...form.register("confirmPassword")} />
            </Field>

            {registerMutation.error ? (
              <div className="md:col-span-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                注册失败，请检查输入信息或稍后重试。
              </div>
            ) : null}

            {registerMutation.isSuccess ? (
              <div className="md:col-span-2 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                {registerMutation.data.message}
              </div>
            ) : null}

            <div className="md:col-span-2 flex flex-col gap-3">
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "正在创建组织…" : "创建组织"}
              </Button>
              <div className="text-sm text-muted-foreground">
                已有账号？
                <Link href={loginHref} className="ml-2 text-foreground underline-offset-4 hover:underline">
                  返回登录
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function Highlight({
  icon: Icon,
  title,
  description
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <Icon className="h-5 w-5 text-[#6ce7c1]" />
      <div className="mt-3 font-medium">{title}</div>
      <div className="mt-1 text-sm text-white/70">{description}</div>
    </div>
  );
}
