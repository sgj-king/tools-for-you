"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CostBreakdownChart } from "@/components/charts/cost-breakdown-chart";
import { FilterPresetBar } from "@/components/domain/filter-preset-bar";
import { RequestDetailDrawer } from "@/components/domain/request-detail-drawer";
import { RequestLogTable } from "@/components/domain/request-log-table";
import { UsageTrendChart } from "@/components/charts/usage-trend-chart";
import { useCostBreakdownQuery, useRequestLogsQuery, useTrendQuery } from "@/hooks/use-console-data";
import type { RequestLogRecord } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParamReader = Pick<URLSearchParams, "get">;
type UsageFilters = {
  keyword: string;
  model: string;
  project: string;
  status: string;
  provider: string;
};

const DEFAULT_USAGE_FILTERS: UsageFilters = {
  keyword: "",
  model: "all",
  project: "all",
  status: "all",
  provider: "all"
};

function readUsageFilters(searchParams: SearchParamReader): UsageFilters {
  return {
    keyword: searchParams.get("keyword") ?? DEFAULT_USAGE_FILTERS.keyword,
    model: searchParams.get("model") ?? DEFAULT_USAGE_FILTERS.model,
    project: searchParams.get("project") ?? DEFAULT_USAGE_FILTERS.project,
    status: searchParams.get("status") ?? DEFAULT_USAGE_FILTERS.status,
    provider: searchParams.get("provider") ?? DEFAULT_USAGE_FILTERS.provider
  };
}

function buildUsageQueryParams(filters: UsageFilters, traceId?: string): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.model !== DEFAULT_USAGE_FILTERS.model) params.set("model", filters.model);
  if (filters.project !== DEFAULT_USAGE_FILTERS.project) params.set("project", filters.project);
  if (filters.status !== DEFAULT_USAGE_FILTERS.status) params.set("status", filters.status);
  if (filters.provider !== DEFAULT_USAGE_FILTERS.provider) params.set("provider", filters.provider);
  if (traceId) params.set("trace_id", traceId);
  return params;
}

function matchesUsageFilters(row: RequestLogRecord, filters: UsageFilters) {
  const keyword = filters.keyword.trim().toLowerCase();
  const searchTarget = [row.traceId, row.id, row.apiKeyName, row.projectName, row.modelName, row.providerCode].join(" ").toLowerCase();

  if (keyword && !searchTarget.includes(keyword)) return false;
  if (filters.model !== "all" && row.modelName !== filters.model) return false;
  if (filters.project !== "all" && row.projectName !== filters.project) return false;
  if (filters.status !== "all" && row.requestStatus !== filters.status) return false;
  if (filters.provider !== "all" && row.providerCode !== filters.provider) return false;
  return true;
}

export function UsageView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const trends = useTrendQuery();
  const costs = useCostBreakdownQuery();
  const logs = useRequestLogsQuery();
  const initialFilters = useMemo(() => readUsageFilters(searchParams), [searchParams]);
  const [keyword, setKeyword] = useState(initialFilters.keyword);
  const [model, setModel] = useState(initialFilters.model);
  const [project, setProject] = useState(initialFilters.project);
  const [status, setStatus] = useState(initialFilters.status);
  const [provider, setProvider] = useState(initialFilters.provider);
  const currentFilters = useMemo<UsageFilters>(() => ({ keyword, model, project, status, provider }), [keyword, model, project, status, provider]);

  useEffect(() => {
    const traceId = searchParams.get("trace_id");
    if (traceId) {
      setSelectedTraceId(traceId);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const next = buildUsageQueryParams(currentFilters, selectedTraceId).toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [currentFilters, selectedTraceId, pathname, router, searchParams]);

  if (!trends.data || !costs.data || !logs.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载 Usage 数据…</div>;
  }

  const filteredLogs = logs.data.filter((row) => matchesUsageFilters(row, currentFilters));
  const modelOptions = Array.from(new Set(logs.data.map((row) => row.modelName))).sort();
  const projectOptions = Array.from(new Set(logs.data.map((row) => row.projectName))).sort();
  const providerOptions = Array.from(new Set(logs.data.map((row) => row.providerCode))).sort();

  const applyFilters = (next: UsageFilters) => {
    setKeyword(next.keyword);
    setModel(next.model);
    setProject(next.project);
    setStatus(next.status);
    setProvider(next.provider);
  };

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>高级筛选器</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <FilterPresetBar
            scope="console-usage"
            currentValues={currentFilters}
            defaultValues={DEFAULT_USAGE_FILTERS}
            onApply={applyFilters}
            serialize={(filters) => buildUsageQueryParams(filters, selectedTraceId)}
          />
        </CardContent>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索 trace_id / request_id / key" />
          <select value={model} onChange={(event) => setModel(event.target.value)} className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="all">全部模型</option>
            {modelOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={project} onChange={(event) => setProject(event.target.value)} className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="all">全部项目</option>
            {projectOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="all">全部状态</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
            <option value="rate_limited">rate_limited</option>
            <option value="in_progress">in_progress</option>
          </select>
          <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="all">全部供应商</option>
            {providerOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <UsageTrendChart data={trends.data} />
        <CostBreakdownChart data={costs.data} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>请求日志与详情抽屉</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">筛选维度：trace_id / request_id / 项目 / key / 模型 / 状态 / 缓存命中 / 重试状态 / 时间。点击下方日志行即可打开请求详情抽屉。</p>
        </CardContent>
      </Card>
      <RequestLogTable
        rows={filteredLogs}
        onSelect={(row) => {
          setSelectedTraceId(row.traceId);
          setDrawerOpen(true);
          const next = buildUsageQueryParams(currentFilters, row.traceId).toString();
          window.history.replaceState(null, "", next ? `${pathname}?${next}` : pathname);
        }}
      />
      <RequestDetailDrawer
        traceId={selectedTraceId}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            const next = buildUsageQueryParams(currentFilters).toString();
            window.history.replaceState(null, "", next ? `${pathname}?${next}` : pathname);
          }
        }}
      />
    </div>
  );
}
