import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16">
      <div className="max-w-4xl rounded-[32px] border border-border/70 bg-card/85 p-8 shadow-glow backdrop-blur lg:p-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          彗星科技 AI Platform
        </div>
        <h1 className="mt-6 font-display text-5xl leading-tight lg:text-6xl">把 AI 网关、计费与开发者体验组合成一套真正可卖的产品。</h1>
        <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
          这是一套面向商业化 AI API 平台的前端骨架。客户只看到彗星科技自己的品牌工作台，内部继续通过闭源服务编排网关、计费、风控与路由。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-card">
            进入彗星科技
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href={siteConfig.docsUrl} className="inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-medium">
            文档中心
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-muted/60 p-4">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <div className="mt-3 font-medium">商业边界清晰</div>
            <div className="mt-1 text-sm text-muted-foreground">前端只调用你的闭源服务，不直接接触 OSS Gateway。</div>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <div className="font-medium">双控制台</div>
            <div className="mt-1 text-sm text-muted-foreground">工作台与管理后台共享设计系统，但权限与信息架构严格分离。</div>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <div className="font-medium">可直接开发</div>
            <div className="mt-1 text-sm text-muted-foreground">已包含布局、图表、SDK、mock 数据、主题切换与关键页面骨架。</div>
          </div>
        </div>
      </div>
    </main>
  );
}
