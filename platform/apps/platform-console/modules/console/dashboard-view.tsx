"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BillingSummaryCard } from "@/components/domain/billing-summary-card";
import { KpiStatCard } from "@/components/domain/kpi-stat-card";
import { CostBreakdownChart } from "@/components/charts/cost-breakdown-chart";
import { ProviderHealthWidget } from "@/components/domain/provider-health-widget";
import { UsageTrendChart } from "@/components/charts/usage-trend-chart";
import { buildFilterPresetHref, FILTER_PRESET_SCOPE_ORDER, getFilterPresetScopeMeta } from "@/lib/filter-preset-scopes";
import { filterPresetApi } from "@/services/sdk/console-api";
import {
  useBillingSummaryQuery,
  useCostBreakdownQuery,
  useOverviewQuery,
  useProvidersQuery,
  useSessionUserQuery,
  useTrendQuery
} from "@/hooks/use-console-data";
import { formatNumber, formatPercent, formatUsd } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const useRemotePresetStore = process.env.NEXT_PUBLIC_ENABLE_PLATFORM_BFF === "true";
const DASHBOARD_PRESET_SECTIONS_STORAGE_KEY = "platform-console.dashboard-preset-sections";
const DASHBOARD_PRESET_SECTION_ORDER_STORAGE_KEY = "platform-console.dashboard-preset-section-order";
const DEFAULT_DASHBOARD_SECTION_ORDER: DashboardPresetSectionKey[] = ["defaults", "recent", "favorites", "recommended"];

type DashboardPresetEntry = {
  id: string;
  scope: string;
  title: string;
  description: string;
  presetName: string;
  ownerDisplayName: string;
  sourceLabel: string;
  href: string;
  lastUsedAt: string | null;
  isPinned: boolean;
};

type DashboardPresetSectionKey = "defaults" | "recent" | "favorites" | "recommended";

export function DashboardView() {
  const overview = useOverviewQuery();
  const trends = useTrendQuery();
  const costs = useCostBreakdownQuery();
  const providers = useProvidersQuery();
  const billing = useBillingSummaryQuery();
  const session = useSessionUserQuery();
  const [collapsedSections, setCollapsedSections] = useState<Record<DashboardPresetSectionKey, boolean>>({
    defaults: false,
    recent: false,
    favorites: false,
    recommended: false
  });
  const [sectionOrder, setSectionOrder] = useState<DashboardPresetSectionKey[]>(DEFAULT_DASHBOARD_SECTION_ORDER);
  const [draggingSection, setDraggingSection] = useState<DashboardPresetSectionKey | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(DASHBOARD_PRESET_SECTIONS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<Record<DashboardPresetSectionKey, boolean>>;
      setCollapsedSections((current) => ({ ...current, ...parsed }));
    } catch {
      // ignore invalid local storage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(DASHBOARD_PRESET_SECTION_ORDER_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DashboardPresetSectionKey[];
      const nextOrder = parsed.filter((item, index, items) => DEFAULT_DASHBOARD_SECTION_ORDER.includes(item) && items.indexOf(item) === index);
      if (nextOrder.length) {
        setSectionOrder([...nextOrder, ...DEFAULT_DASHBOARD_SECTION_ORDER.filter((item) => !nextOrder.includes(item))]);
      }
    } catch {
      // ignore invalid local storage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_PRESET_SECTIONS_STORAGE_KEY, JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_PRESET_SECTION_ORDER_STORAGE_KEY, JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  const presetDefaults = useQuery({
    queryKey: ["dashboard", "filter-preset-defaults", session.data?.id],
    enabled: useRemotePresetStore && Boolean(session.data),
    queryFn: async () => {
      const user = session.data!;
      const results = await Promise.all(
        FILTER_PRESET_SCOPE_ORDER.map(async (scope) => ({
          scope,
          items: await filterPresetApi.list(user, { scope })
        }))
      );
      return results;
    }
  });

  const quickEntries = useMemo(() => {
    const groups = presetDefaults.data ?? [];
    return groups
      .map(({ scope, items }) => {
        const personalDefault = items.find((item) => item.isDefault && item.visibility === "private");
        const selected = personalDefault ?? items.find((item) => item.isDefault);
        if (!selected) return null;
        const meta = getFilterPresetScopeMeta(scope);
        if (!meta) return null;
        return {
          id: `${scope}:${selected.id}`,
          scope,
          title: meta.title,
          description: meta.description,
          presetName: selected.name,
          ownerDisplayName: selected.ownerDisplayName,
          sourceLabel: selected.visibility === "organization" ? "团队默认" : "个人默认",
          href: buildFilterPresetHref(scope, selected.values),
          lastUsedAt: selected.lastUsedAt ?? null,
          isPinned: selected.isPinned ?? false
        };
      })
      .filter((entry): entry is DashboardPresetEntry => entry !== null);
  }, [presetDefaults.data]);

  const recentEntries = useMemo(() => {
    const groups = presetDefaults.data ?? [];
    return groups
      .flatMap(({ scope, items }) => {
        const meta = getFilterPresetScopeMeta(scope);
        if (!meta) return [];
        return items.map((item) => ({
          id: `${scope}:${item.id}`,
          scope,
          title: meta.title,
          description: meta.description,
          presetName: item.name,
          ownerDisplayName: item.ownerDisplayName,
          sourceLabel: item.visibility === "organization" ? "团队共享" : "个人方案",
          href: buildFilterPresetHref(scope, item.values),
          lastUsedAt: item.lastUsedAt ?? null,
          isPinned: item.isPinned ?? false
        }));
      })
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return Number(right.isPinned) - Number(left.isPinned);
        }
        return new Date(right.lastUsedAt ?? 0).getTime() - new Date(left.lastUsedAt ?? 0).getTime();
      })
      .filter((entry) => entry.isPinned || entry.lastUsedAt)
      .slice(0, 6);
  }, [presetDefaults.data]);

  const favoriteEntries = useMemo(() => {
    const groups = presetDefaults.data ?? [];
    return groups
      .flatMap(({ scope, items }) => {
        const meta = getFilterPresetScopeMeta(scope);
        if (!meta) return [];
        return items
          .filter((item) => item.visibility === "private" && (item.isPinned ?? false))
          .map((item) => ({
            id: `${scope}:${item.id}`,
            scope,
            title: meta.title,
            description: meta.description,
            presetName: item.name,
            ownerDisplayName: item.ownerDisplayName,
            sourceLabel: "我的收藏",
            href: buildFilterPresetHref(scope, item.values),
            lastUsedAt: item.lastUsedAt ?? null,
            isPinned: item.isPinned ?? false
          }));
      })
      .sort((left, right) => new Date(right.lastUsedAt ?? 0).getTime() - new Date(left.lastUsedAt ?? 0).getTime())
      .slice(0, 4);
  }, [presetDefaults.data]);

  const recommendedEntries = useMemo(() => {
    const groups = presetDefaults.data ?? [];
    return groups
      .flatMap(({ scope, items }) => {
        const meta = getFilterPresetScopeMeta(scope);
        if (!meta) return [];
        return items
          .filter((item) => item.visibility === "organization" && (item.isPinned || item.isDefault))
          .map((item) => ({
            id: `${scope}:${item.id}`,
            scope,
            title: meta.title,
            description: meta.description,
            presetName: item.name,
            ownerDisplayName: item.ownerDisplayName,
            sourceLabel: item.isDefault ? "团队默认" : "团队推荐",
            href: buildFilterPresetHref(scope, item.values),
            lastUsedAt: item.lastUsedAt ?? null,
            isPinned: item.isPinned ?? false
          }));
      })
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return Number(right.isPinned) - Number(left.isPinned);
        }
        return new Date(right.lastUsedAt ?? 0).getTime() - new Date(left.lastUsedAt ?? 0).getTime();
      })
      .slice(0, 4);
  }, [presetDefaults.data]);

  const toggleSection = (section: DashboardPresetSectionKey) => {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section]
    }));
  };

  const moveSection = (section: DashboardPresetSectionKey, direction: "up" | "down") => {
    setSectionOrder((current) => {
      const index = current.indexOf(section);
      if (index < 0) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleDropSection = (target: DashboardPresetSectionKey) => {
    if (!draggingSection || draggingSection === target) return;
    setSectionOrder((current) => {
      const sourceIndex = current.indexOf(draggingSection);
      const targetIndex = current.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggingSection(null);
  };

  const resetSectionOrder = () => {
    setSectionOrder(DEFAULT_DASHBOARD_SECTION_ORDER);
  };

  const renderSectionActions = (section: DashboardPresetSectionKey) => {
    const index = sectionOrder.indexOf(section);
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => moveSection(section, "up")} disabled={index <= 0}>
          上移
        </Button>
        <Button variant="ghost" size="sm" onClick={() => moveSection(section, "down")} disabled={index < 0 || index >= sectionOrder.length - 1}>
          下移
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toggleSection(section)}>
          {collapsedSections[section] ? "展开" : "折叠"}
        </Button>
      </div>
    );
  };

  const renderPresetSection = (section: DashboardPresetSectionKey): ReactNode => {
    switch (section) {
      case "defaults":
        return (
          <Card
            key={section}
            draggable
            onDragStart={() => setDraggingSection(section)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropSection(section)}
            className={draggingSection === section ? "opacity-70" : undefined}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>默认筛选快捷入口</CardTitle>
                {renderSectionActions(section)}
              </div>
              <p className="text-sm text-muted-foreground">把团队常用运营视图固定到首页。打开后会自动带上当前默认筛选参数。</p>
            </CardHeader>
            {!collapsedSections.defaults ? (
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {presetDefaults.isPending ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">正在加载默认筛选入口…</div>
                ) : quickEntries.length > 0 ? (
                  quickEntries.map((entry) => (
                    <Link
                      key={entry.id}
                      href={entry.href}
                      className="rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{entry.sourceLabel}</div>
                      <div className="mt-2 text-lg font-semibold">{entry.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                      <div className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                        <div className="font-medium">{entry.presetName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{entry.ownerDisplayName}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
                    暂未发现已设置的个人默认或团队默认筛选。你可以先在 Usage、账单、发票或 Webhook 页面把常用筛选保存为默认方案。
                  </div>
                )}
              </CardContent>
            ) : null}
          </Card>
        );
      case "recent":
        return (
          <Card
            key={section}
            draggable
            onDragStart={() => setDraggingSection(section)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropSection(section)}
            className={draggingSection === section ? "opacity-70" : undefined}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>最近使用与置顶 Preset</CardTitle>
                {renderSectionActions(section)}
              </div>
              <p className="text-sm text-muted-foreground">优先展示你置顶的方案，其次展示最近使用过的筛选入口。</p>
            </CardHeader>
            {!collapsedSections.recent ? (
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {presetDefaults.isPending ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">正在加载最近使用 Preset…</div>
                ) : recentEntries.length > 0 ? (
                  recentEntries.map((entry) => (
                    <Link key={entry.id} href={entry.href} className="rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:border-primary/40 hover:bg-primary/5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">{entry.presetName}</div>
                        <div className="flex items-center gap-2">
                          {entry.isPinned ? <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">置顶</span> : null}
                          <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{entry.sourceLabel}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">{entry.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {entry.lastUsedAt ? `最近使用：${new Date(entry.lastUsedAt).toLocaleString("zh-CN")}` : "尚未记录最近使用时间"}
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">{entry.ownerDisplayName}</div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                    你还没有最近使用或置顶的 Preset。可以先在 Usage、账单、发票或 Webhook 页面应用一次方案，或将常用方案标记为置顶。
                  </div>
                )}
              </CardContent>
            ) : null}
          </Card>
        );
      case "favorites":
        return (
          <Card
            key={section}
            draggable
            onDragStart={() => setDraggingSection(section)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropSection(section)}
            className={draggingSection === section ? "opacity-70" : undefined}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>我收藏的 Preset</CardTitle>
                {renderSectionActions(section)}
              </div>
              <p className="text-sm text-muted-foreground">展示你个人置顶收藏的常用筛选入口，适合作为自己的日常工作台。</p>
            </CardHeader>
            {!collapsedSections.favorites ? (
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {presetDefaults.isPending ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">正在加载我的收藏…</div>
                ) : favoriteEntries.length > 0 ? (
                  favoriteEntries.map((entry) => (
                    <Link key={entry.id} href={entry.href} className="rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:border-primary/40 hover:bg-primary/5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{entry.presetName}</div>
                        <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">收藏</span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">{entry.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{entry.description}</div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {entry.lastUsedAt ? `最近使用：${new Date(entry.lastUsedAt).toLocaleString("zh-CN")}` : "尚未记录最近使用时间"}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
                    你还没有个人收藏的 Preset。可以在筛选方案列表里将常用方案置顶，它就会显示在这里。
                  </div>
                )}
              </CardContent>
            ) : null}
          </Card>
        );
      case "recommended":
        return (
          <Card
            key={section}
            draggable
            onDragStart={() => setDraggingSection(section)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropSection(section)}
            className={draggingSection === section ? "opacity-70" : undefined}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>团队推荐 Preset</CardTitle>
                {renderSectionActions(section)}
              </div>
              <p className="text-sm text-muted-foreground">展示团队共享中已置顶或设为默认的运营视图，方便成员快速进入统一看板。</p>
            </CardHeader>
            {!collapsedSections.recommended ? (
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {presetDefaults.isPending ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">正在加载团队推荐 Preset…</div>
                ) : recommendedEntries.length > 0 ? (
                  recommendedEntries.map((entry) => (
                    <Link key={entry.id} href={entry.href} className="rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:border-primary/40 hover:bg-primary/5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{entry.presetName}</div>
                        <div className="flex items-center gap-2">
                          {entry.isPinned ? <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">置顶</span> : null}
                          <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{entry.sourceLabel}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">{entry.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{entry.description}</div>
                      <div className="mt-3 text-xs text-muted-foreground">{entry.ownerDisplayName}</div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
                    当前还没有团队推荐 Preset。你可以将团队共享方案设为默认或置顶，它就会出现在这里。
                  </div>
                )}
              </CardContent>
            ) : null}
          </Card>
        );
      default:
        return null;
    }
  };

  if (!overview.data || !trends.data || !costs.data || !providers.data || !billing.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载控制台概览数据…</div>;
  }

  return (
    <div className="section-shell">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard label="今日调用量" value={formatNumber(overview.data.todayRequests)} hint="较昨日增加 8.6%" trend="+8.6%" />
        <KpiStatCard label="成功率" value={formatPercent(overview.data.successRate)} hint="包含自动重试恢复后的结果" trend="+0.28%" />
        <KpiStatCard label="当前余额" value={formatUsd(billing.data.balanceUsd)} hint={`冻结 ${formatUsd(billing.data.frozenAmountUsd)}`} />
        <KpiStatCard label="缓存命中率" value={formatPercent(overview.data.cacheHitRate)} hint="命中请求按缓存账单策略计费" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <UsageTrendChart data={trends.data} />
        <CostBreakdownChart data={costs.data} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <BillingSummaryCard summary={billing.data} />
        <ProviderHealthWidget providers={providers.data} />
      </section>
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={resetSectionOrder}>
          恢复首页卡区默认顺序
        </Button>
      </div>
      {sectionOrder.map((section) => renderPresetSection(section))}
    </div>
  );
}
