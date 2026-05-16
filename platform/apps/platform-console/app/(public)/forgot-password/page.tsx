"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MailCheck, ShieldEllipsis } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/features/auth/forgot-password-schema";
import { useForgotPasswordMutation } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const mutation = useForgotPasswordMutation();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-6 px-6 py-10 lg:grid-cols-[0.88fr,1.12fr]">
      <Card className="border-border/70 bg-card/80">
        <CardContent className="space-y-5 p-8">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">app.auth.forgotPassword.title</div>
          <h1 className="font-display text-4xl">重置密码</h1>
          <p className="text-sm leading-7 text-muted-foreground">
            输入工作邮箱后，系统会通过邮件发送一次性重置链接。Desktop 主方案为说明卡 + 表单卡；Tablet 建议纵向堆叠并保留提交反馈。
          </p>
          <div className="grid gap-3">
            <InfoRow icon={MailCheck} title="邮箱送达反馈" description="提交后显示目标邮箱、失效时间与下一步说明。" />
            <InfoRow icon={ShieldEllipsis} title="安全保护" description="默认配合登录审计、频率限制与风险校验，避免恶意探测。" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-8">
          <div>
            <div className="text-sm text-muted-foreground">找回访问权限</div>
            <h2 className="mt-2 font-display text-3xl">发送密码重置链接</h2>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">工作邮箱</span>
              <Input placeholder="name@company.com" {...form.register("email")} />
              {form.formState.errors.email ? <span className="text-xs text-danger">{form.formState.errors.email.message}</span> : null}
            </label>

            {mutation.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">发送失败，请稍后重试。</div>
            ) : null}

            {mutation.isSuccess ? (
              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                {mutation.data.message} 目标邮箱：{mutation.data.email}，链接有效期 {mutation.data.expiresInMinutes} 分钟。
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "正在发送…" : "发送重置链接"}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              返回登录
            </Link>
            <Link href="/register" className="hover:text-foreground">
              创建新组织
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function InfoRow({
  icon: Icon,
  title,
  description
}: {
  icon: typeof MailCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
      <Icon className="h-5 w-5 text-accent" />
      <div className="mt-3 font-medium">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    </div>
  );
}
