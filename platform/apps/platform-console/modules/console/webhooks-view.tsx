"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { EditWebhookModal } from "@/components/domain/edit-webhook-modal";
import { FilterPresetBar } from "@/components/domain/filter-preset-bar";
import { WebhookDeliveryDrawer } from "@/components/domain/webhook-delivery-drawer";
import { CreateWebhookModal, TestWebhookModal } from "@/components/domain/webhook-modals";
import { WebhookTable } from "@/components/domain/webhook-table";
import { useWebhooksPagedQuery } from "@/hooks/use-console-data";
import type { WebhookRecord } from "@/types/domain";
import { webhookApi } from "@/services/sdk/console-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const WEBHOOK_STATUS_OPTIONS: WebhookRecord["status"][] = ["active", "failing", "disabled"];

type SearchParamReader = Pick<URLSearchParams, "get">;
type WebhookFilters = {
  search: string;
  statuses: string[];
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
};

const DEFAULT_WEBHOOK_FILTERS: WebhookFilters = {
  search: "",
  statuses: [],
  dateFrom: "",
  dateTo: "",
  sortBy: "lastDeliveryAt",
  sortDir: "desc",
  page: 1
};

function parseCsvParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readWebhookFilters(searchParams: SearchParamReader): WebhookFilters {
  return {
    search: searchParams.get("search") ?? DEFAULT_WEBHOOK_FILTERS.search,
    statuses: parseCsvParam(searchParams.get("status")),
    dateFrom: searchParams.get("date_from") ?? DEFAULT_WEBHOOK_FILTERS.dateFrom,
    dateTo: searchParams.get("date_to") ?? DEFAULT_WEBHOOK_FILTERS.dateTo,
    sortBy: searchParams.get("sort_by") ?? DEFAULT_WEBHOOK_FILTERS.sortBy,
    sortDir: searchParams.get("sort_dir") === "asc" ? "asc" : DEFAULT_WEBHOOK_FILTERS.sortDir,
    page: Math.max(1, Number(searchParams.get("page") ?? DEFAULT_WEBHOOK_FILTERS.page))
  };
}

function buildWebhookQueryParams(filters: WebhookFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.statuses.length > 0) params.set("status", filters.statuses.join(","));
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.sortBy !== DEFAULT_WEBHOOK_FILTERS.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.sortDir !== DEFAULT_WEBHOOK_FILTERS.sortDir) params.set("sort_dir", filters.sortDir);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function WebhooksView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const initialFilters = useMemo(() => readWebhookFilters(searchParams), [searchParams]);

  const [selectedWebhookId, setSelectedWebhookId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookRecord | undefined>();
  const [editOpen, setEditOpen] = useState(false);

  const [search, setSearch] = useState(initialFilters.search);
  const [statuses, setStatuses] = useState<string[]>(initialFilters.statuses);
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom);
  const [dateTo, setDateTo] = useState(initialFilters.dateTo);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialFilters.sortDir);
  const [page, setPage] = useState(initialFilters.page);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMessage, setBatchMessage] = useState("");
  const [batchPending, setBatchPending] = useState(false);
  const currentFilters = useMemo<WebhookFilters>(
    () => ({
      search,
      statuses,
      dateFrom,
      dateTo,
      sortBy,
      sortDir,
      page
    }),
    [search, statuses, dateFrom, dateTo, sortBy, sortDir, page]
  );

  const pageSize = 10;
  const webhooks = useWebhooksPagedQuery({
    search: search || undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortDir,
    page,
    pageSize
  });

  const rows = useMemo(() => webhooks.data?.items ?? [], [webhooks.data?.items]);
  const total = webhooks.data?.meta?.total ?? rows.length;
  const hasNext = page * pageSize < total;
  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.includes(row.id)), [rows, selectedIds]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => rows.some((row) => row.id === id));
      return next.length === current.length ? current : next;
    });
  }, [rows]);

  useEffect(() => {
    const next = buildWebhookQueryParams(currentFilters).toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [currentFilters, pathname, router, searchParams]);

  if (!webhooks.data?.items) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载 Webhook 配置…</div>;
  }

  const handleExport = async () => {
    const response = await webhookApi.exportWebhooks({
      search: search || undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy,
      sortDir
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "webhooks.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleBatchStatus = async (nextStatus: WebhookRecord["status"]) => {
    if (selectedRows.length === 0) return;
    setBatchPending(true);
    setBatchMessage("");
    try {
      await Promise.all(
        selectedRows.map((row) =>
          webhookApi.update(row.id, {
            name: row.name,
            endpoint: row.endpoint,
            events: row.events,
            retryPolicy: row.retryPolicy,
            status: nextStatus
          })
        )
      );
      setSelectedIds([]);
      setBatchMessage(`已批量更新 ${selectedRows.length} 个 Webhook 状态为 ${nextStatus}。`);
      await queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      await queryClient.invalidateQueries({ queryKey: ["webhooks-paged"] });
    } catch {
      setBatchMessage("批量更新失败，请稍后重试。");
    } finally {
      setBatchPending(false);
    }
  };

  const applyFilters = (next: WebhookFilters) => {
    setSearch(next.search);
    setStatuses([...next.statuses]);
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
    setPage(next.page);
  };

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-3 lg:flex-row lg:items-center">
          <div>
            <CardTitle>Webhook 设置</CardTitle>
            <p className="text-sm text-muted-foreground">支持搜索、筛选、排序、分页、批量状态更新与导出。</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="搜索 Webhook 名称 / endpoint / 事件"
              className="max-w-sm"
            />
            <Input
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              type="date"
              className="max-w-[180px]"
            />
            <Input
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              type="date"
              className="max-w-[180px]"
            />
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
              <option value="lastDeliveryAt">按最后投递</option>
              <option value="name">按名称</option>
              <option value="status">按状态</option>
            </select>
            <select value={sortDir} onChange={(event) => setSortDir(event.target.value as "asc" | "desc")} className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
            <Button variant="secondary" onClick={handleExport}>
              导出 CSV
            </Button>
            <TestWebhookModal />
            <CreateWebhookModal />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <FilterPresetBar
            scope="console-webhooks"
            currentValues={currentFilters}
            defaultValues={DEFAULT_WEBHOOK_FILTERS}
            onApply={applyFilters}
            serialize={buildWebhookQueryParams}
          />
        </CardContent>
        <CardContent className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">状态筛选：</span>
          {WEBHOOK_STATUS_OPTIONS.map((item) => {
            const active = statuses.includes(item);
            return (
              <Button
                key={item}
                size="sm"
                variant={active ? "default" : "secondary"}
                onClick={() => {
                  setStatuses((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
                  setPage(1);
                }}
              >
                {item}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFilters({ ...currentFilters, statuses: [], dateFrom: "", dateTo: "", page: 1 })}
          >
            清空高级筛选
          </Button>
        </CardContent>
        <CardContent className="flex flex-wrap items-center gap-2 pt-0">
          <Button variant="secondary" disabled={selectedRows.length === 0 || batchPending} onClick={() => void handleBatchStatus("active")}>
            批量设为 active
          </Button>
          <Button variant="secondary" disabled={selectedRows.length === 0 || batchPending} onClick={() => void handleBatchStatus("disabled")}>
            批量设为 disabled
          </Button>
          <Button variant="ghost" disabled={selectedRows.length === 0 || batchPending} onClick={() => setSelectedIds([])}>
            清空已选
          </Button>
          <span className="text-xs text-muted-foreground">已选 {selectedRows.length} 项</span>
        </CardContent>
        {batchMessage ? (
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-3 text-xs text-muted-foreground">{batchMessage}</div>
          </CardContent>
        ) : null}
        <CardContent className="pt-0">
          <Button asChild variant="secondary">
            <Link href="/console/webhooks/history">查看历史投递列表</Link>
          </Button>
        </CardContent>
      </Card>
      <WebhookTable
        rows={rows}
        selectedIds={selectedIds}
        onToggleSelect={(id, checked) =>
          setSelectedIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)))
        }
        onToggleSelectAll={(checked) => setSelectedIds(checked ? rows.map((row) => row.id) : [])}
        onSelect={(row) => {
          setSelectedWebhookId(row.id);
          setDrawerOpen(true);
        }}
        onEdit={(row) => {
          setEditingWebhook(row);
          setEditOpen(true);
        }}
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
          上一页
        </Button>
        <div className="text-xs text-muted-foreground">
          第 {page} 页 · 共 {total} 条
        </div>
        <Button variant="secondary" disabled={!hasNext} onClick={() => setPage((value) => value + 1)}>
          下一页
        </Button>
      </div>
      <WebhookDeliveryDrawer webhookId={selectedWebhookId} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <EditWebhookModal webhook={editingWebhook} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
