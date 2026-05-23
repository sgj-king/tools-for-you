import type { Metadata } from "next";
import Link from "next/link";
import { fetchPlatformStatus, type ServiceStatus } from "@/lib/server/prometheus";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export const metadata: Metadata = {
  title: "服务状态 · 彗星科技"
};

function badgeFor(service: ServiceStatus): { label: string; tone: "green" | "red" | "amber" } {
  if (service.up === true) return { label: "正常", tone: "green" };
  if (service.up === false) return { label: "中断", tone: "red" };
  return { label: "未知", tone: "amber" };
}

function toneStyles(tone: "green" | "red" | "amber"): string {
  switch (tone) {
    case "green":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    case "red":
      return "bg-red-500/15 text-red-500 border-red-500/30";
    default:
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  }
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  if (value >= 99.995) return "100.000%";
  return `${value.toFixed(3)}%`;
}

function overallTone(services: ServiceStatus[]): { headline: string; subline: string; tone: "green" | "red" | "amber" } {
  if (services.every((s) => s.up === null)) {
    return { headline: "状态数据暂不可用", subline: "Prometheus 数据源未连通，详见运维通道。", tone: "amber" };
  }
  if (services.some((s) => s.up === false)) {
    return { headline: "部分服务异常", subline: "下方列出当前不可用的服务，工程团队已自动收到告警。", tone: "red" };
  }
  return { headline: "全部服务运行正常", subline: "过去 30 天的可用率会按 Prometheus 30 天滑动窗口实时计算。", tone: "green" };
}

export default async function StatusPage() {
  const status = await fetchPlatformStatus();
  const overall = overallTone(status.services);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <div className="rounded-[32px] border border-border/70 bg-card/90 p-8 shadow-glow backdrop-blur lg:p-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-accent">PLATFORM STATUS</div>
        <h1 className="mt-6 font-display text-4xl leading-tight lg:text-5xl">{overall.headline}</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground">{overall.subline}</p>
        <p className="mt-1 text-xs text-muted-foreground">数据更新时间：{new Date(status.generatedAt).toLocaleString()}</p>
        {!status.available ? (
          <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
            Prometheus 数据源暂未连通。请检查 <code className="font-mono">PROMETHEUS_BASE_URL</code> 环境变量、Prometheus 容器健康状态以及网络可达性。
          </p>
        ) : null}
        <section className="mt-10 space-y-3">
          {status.services.map((service) => {
            const badge = badgeFor(service);
            return (
              <div key={service.job} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold">{service.name}</div>
                  <div className="text-xs text-muted-foreground">job=<span className="font-mono">{service.job}</span></div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">30 天可用率</div>
                    <div className="text-sm font-mono">{formatPercent(service.uptimePercent30d)}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles(badge.tone)}`}>{badge.label}</span>
                </div>
              </div>
            );
          })}
        </section>
        <footer className="mt-10 grid gap-3 text-sm text-muted-foreground lg:grid-cols-2">
          <p>需要协助？请通过工作台<Link href="/console/support" className="ml-1 text-accent underline-offset-4 hover:underline">提交支持工单</Link>，并附带最近一次失败的 trace_id。</p>
          <p>开发接入或排障文档请参阅<Link href="/docs/developer" className="ml-1 text-accent underline-offset-4 hover:underline">开发接入文档</Link>。</p>
        </footer>
      </div>
    </main>
  );
}
