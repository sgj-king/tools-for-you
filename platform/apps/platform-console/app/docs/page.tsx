import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenText, Code2, PanelsTopLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "文档中心"
};

const entries = [
  {
    title: "工作台说明",
    description: "面向客户与组织成员，覆盖 API Key、模型目录、Playground、用量、账单、团队、Webhook 与支持工单。",
    href: "/console/docs",
    icon: PanelsTopLeft
  },
  {
    title: "管理后台说明",
    description: "面向平台管理员、运维、财务与风控角色，覆盖用户、组织、路由、定价、风控与审计。",
    href: "/admin/docs",
    icon: BookOpenText
  },
  {
    title: "开发接入 / API 使用文档",
    description: "面向开发者与对接工程师，说明统一域名、鉴权、模型调用、流式输出、排错与最佳实践。",
    href: "/docs/developer",
    icon: Code2
  },
  {
    title: "常见错误码与排障手册",
    description: "面向联调、支持与运营同学，覆盖鉴权失败、限流、上游异常、trace_id 回查与排障路径。",
    href: "/docs/troubleshooting",
    icon: AlertTriangle
  }
];

export default function DocsLandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-14">
      <div className="rounded-[32px] border border-border/70 bg-card/90 p-8 shadow-glow backdrop-blur lg:p-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-accent">DOCS CENTER</div>
        <h1 className="mt-6 font-display text-5xl leading-tight lg:text-6xl">彗星科技文档中心</h1>
        <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
          这里汇总了工作台说明、管理后台说明、开发接入文档和排障手册，适合作为客户交付、内部培训、联调协作和日常运营的统一入口。
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <Link key={entry.href} href={entry.href}>
                <Card className="h-full transition hover:border-accent/35 hover:bg-muted/35">
                  <CardContent className="h-full p-6">
                    <Icon className="h-6 w-6 text-accent" />
                    <div className="mt-5 text-lg font-semibold">{entry.title}</div>
                    <div className="mt-3 text-sm leading-7 text-muted-foreground">{entry.description}</div>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">
                      进入文档
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
