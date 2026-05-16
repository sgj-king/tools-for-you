"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import type { Route as AppRoute } from "next";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, FileSearch, FolderKanban, Home, KeyRound, Route, Receipt, ShieldAlert, Sparkles, Tags, Users, Webhook, Building2, BookText, WalletCards, Settings2, Shield, LifeBuoy, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: AppRoute; label: string; icon: ComponentType<{ className?: string }> };

const consoleItems: NavItem[] = [
  { href: "/console", label: "总览", icon: Home },
  { href: "/console/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/console/models", label: "模型目录", icon: BookText },
  { href: "/console/usage", label: "用量分析", icon: BarChart3 },
  { href: "/console/request-logs", label: "请求日志", icon: FolderKanban },
  { href: "/console/billing", label: "计费", icon: CreditCard },
  { href: "/console/bills", label: "账单", icon: ScrollText },
  { href: "/console/top-up", label: "充值", icon: WalletCards },
  { href: "/console/subscriptions", label: "订阅", icon: Tags },
  { href: "/console/invoices", label: "发票", icon: Receipt },
  { href: "/console/playground", label: "Playground", icon: Sparkles },
  { href: "/console/team", label: "团队", icon: Users },
  { href: "/console/project-settings", label: "项目设置", icon: Settings2 },
  { href: "/console/security", label: "安全设置", icon: Shield },
  { href: "/console/webhooks", label: "Webhook", icon: Webhook },
  { href: "/console/support", label: "支持工单", icon: LifeBuoy }
];

const adminItems: NavItem[] = [
  { href: "/admin", label: "Admin 总览", icon: Home },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/organizations", label: "组织管理", icon: Building2 },
  { href: "/admin/routing", label: "路由配置", icon: Route },
  { href: "/admin/pricing", label: "定价规则", icon: Tags },
  { href: "/admin/risk", label: "风控事件", icon: ShieldAlert },
  { href: "/admin/audit", label: "审计日志", icon: FileSearch }
];

export function Sidebar({ variant = "console" }: { variant?: "console" | "admin" }) {
  const pathname = usePathname();
  const items = variant === "admin" ? adminItems : consoleItems;

  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 self-start border-r border-border/70 bg-background/70 px-4 py-5 backdrop-blur lg:block">
      <div className="space-y-5">
        <div className="rounded-[24px] border border-white/15 bg-[linear-gradient(140deg,rgba(26,111,96,.98),rgba(22,90,78,.98))] p-5 text-white shadow-glow">
          <div className="font-display text-2xl tracking-[0.08em]">彗星科技</div>
          <div className="mt-2 h-1 w-14 rounded-full bg-[linear-gradient(90deg,#f7f1d1,#6ce7c1)]" />
          <div className="mt-3 text-xs tracking-[0.18em] text-white/75">{variant === "admin" ? "管理后台" : "工作台"}</div>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href as AppRoute}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active ? "bg-accent/12 text-accent" : "text-foreground hover:bg-muted/70"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
