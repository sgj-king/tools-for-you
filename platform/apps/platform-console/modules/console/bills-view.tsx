"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BillDetailDrawer } from "@/components/domain/bill-detail-drawer";
import { EditBillModal } from "@/components/domain/edit-bill-modal";
import { FilterPresetBar } from "@/components/domain/filter-preset-bar";
import { BillTable } from "@/components/domain/bill-table";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useBillsPagedQuery } from "@/hooks/use-console-data";
import { billingApi } from "@/services/sdk/console-api";
import type { BillRecord } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const BILL_STATUS_OPTIONS: BillRecord["status"][] = ["open", "settled", "partial", "overdue"];

type SearchParamReader = Pick<URLSearchParams, "get">;
type BillFilters = {
  search: string;
  statuses: string[];
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
};

const DEFAULT_BILL_FILTERS: BillFilters = {
  search: "",
  statuses: [],
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  sortBy: "periodStart",
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

function parseNumberParam(value: string | null): string {
  if (!value) return "";
  return value.trim();
}

function readBillFilters(searchParams: SearchParamReader): BillFilters {
  return {
    search: searchParams.get("search") ?? DEFAULT_BILL_FILTERS.search,
    statuses: parseCsvParam(searchParams.get("status")),
    dateFrom: searchParams.get("date_from") ?? DEFAULT_BILL_FILTERS.dateFrom,
    dateTo: searchParams.get("date_to") ?? DEFAULT_BILL_FILTERS.dateTo,
    amountMin: parseNumberParam(searchParams.get("amount_min")),
    amountMax: parseNumberParam(searchParams.get("amount_max")),
    sortBy: searchParams.get("sort_by") ?? DEFAULT_BILL_FILTERS.sortBy,
    sortDir: searchParams.get("sort_dir") === "asc" ? "asc" : DEFAULT_BILL_FILTERS.sortDir,
    page: Math.max(1, Number(searchParams.get("page") ?? DEFAULT_BILL_FILTERS.page))
  };
}

function buildBillQueryParams(filters: BillFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.statuses.length > 0) params.set("status", filters.statuses.join(","));
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.amountMin !== "") params.set("amount_min", filters.amountMin);
  if (filters.amountMax !== "") params.set("amount_max", filters.amountMax);
  if (filters.sortBy !== DEFAULT_BILL_FILTERS.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.sortDir !== DEFAULT_BILL_FILTERS.sortDir) params.set("sort_dir", filters.sortDir);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function BillsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const initialFilters = useMemo(() => readBillFilters(searchParams), [searchParams]);

  const [search, setSearch] = useState(initialFilters.search);
  const [statuses, setStatuses] = useState<string[]>(initialFilters.statuses);
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom);
  const [dateTo, setDateTo] = useState(initialFilters.dateTo);
  const [amountMin, setAmountMin] = useState(initialFilters.amountMin);
  const [amountMax, setAmountMax] = useState(initialFilters.amountMax);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialFilters.sortDir);
  const [page, setPage] = useState(initialFilters.page);
  const [selectedBillId, setSelectedBillId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillRecord | undefined>();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMessage, setBatchMessage] = useState("");
  const [batchPending, setBatchPending] = useState(false);
  const currentFilters = useMemo<BillFilters>(
    () => ({
      search,
      statuses,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      sortBy,
      sortDir,
      page
    }),
    [search, statuses, dateFrom, dateTo, amountMin, amountMax, sortBy, sortDir, page]
  );

  const pageSize = 10;
  const bills = useBillsPagedQuery({
    search: search || undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    amountMin: amountMin === "" ? undefined : Number(amountMin),
    amountMax: amountMax === "" ? undefined : Number(amountMax),
    sortBy,
    sortDir,
    page,
    pageSize
  });

  const rows = useMemo(() => bills.data?.items ?? [], [bills.data?.items]);
  const total = bills.data?.meta?.total ?? rows.length;
  const hasNext = page * pageSize < total;
  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.includes(row.id)), [rows, selectedIds]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => rows.some((row) => row.id === id));
      return next.length === current.length ? current : next;
    });
  }, [rows]);

  useEffect(() => {
    const next = buildBillQueryParams(currentFilters).toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [currentFilters, pathname, router, searchParams]);

  if (!bills.data?.items) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载账单页…</div>;
  }

  const handleExport = async () => {
    const response = await billingApi.exportBills({
      search: search || undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      amountMin: amountMin === "" ? undefined : Number(amountMin),
      amountMax: amountMax === "" ? undefined : Number(amountMax),
      sortBy,
      sortDir
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bills.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleBatchStatus = async (nextStatus: BillRecord["status"]) => {
    if (selectedRows.length === 0) return;
    setBatchPending(true);
    setBatchMessage("");
    try {
      await Promise.all(
        selectedRows.map((row) =>
          billingApi.updateBill(row.id, {
            status: nextStatus,
            notes: "batch-update"
          })
        )
      );
      setSelectedIds([]);
      setBatchMessage(`已批量更新 ${selectedRows.length} 个账单状态为 ${nextStatus}。`);
      await queryClient.invalidateQueries({ queryKey: ["bills"] });
      await queryClient.invalidateQueries({ queryKey: ["bills-paged"] });
    } catch {
      setBatchMessage("批量更新失败，请稍后重试。");
    } finally {
      setBatchPending(false);
    }
  };

  const applyFilters = (next: BillFilters) => {
    setSearch(next.search);
    setStatuses([...next.statuses]);
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    setAmountMin(next.amountMin);
    setAmountMax(next.amountMax);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
    setPage(next.page);
  };

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>账单页</CardTitle>
          <p className="text-sm text-muted-foreground">支持 URL 持久化筛选、排序、分页、批量状态更新、导出与单条编辑。</p>
        </CardHeader>
        <CardContent className="pt-0">
          <FilterPresetBar
            scope="console-bills"
            currentValues={currentFilters}
            defaultValues={DEFAULT_BILL_FILTERS}
            onApply={applyFilters}
            serialize={buildBillQueryParams}
          />
        </CardContent>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="搜索账单号"
          />
          <Input
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            type="date"
          />
          <Input
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            type="date"
          />
          <Input
            value={amountMin}
            onChange={(event) => {
              setAmountMin(event.target.value);
              setPage(1);
            }}
            inputMode="decimal"
            placeholder="最小金额 USD"
          />
          <Input
            value={amountMax}
            onChange={(event) => {
              setAmountMax(event.target.value);
              setPage(1);
            }}
            inputMode="decimal"
            placeholder="最大金额 USD"
          />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="periodStart">按账期开始</option>
            <option value="amountUsd">按金额</option>
            <option value="dueDate">按到期日</option>
            <option value="status">按状态</option>
            <option value="billNumber">按账单号</option>
          </select>
          <select value={sortDir} onChange={(event) => setSortDir(event.target.value as "asc" | "desc")} className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
          <Button variant="secondary" onClick={handleExport}>
            导出 CSV
          </Button>
          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">状态筛选：</span>
            {BILL_STATUS_OPTIONS.map((item) => {
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
              size="sm"
              variant="ghost"
              onClick={() => applyFilters({ ...currentFilters, statuses: [], dateFrom: "", dateTo: "", amountMin: "", amountMax: "", page: 1 })}
            >
              清空高级筛选
            </Button>
          </div>
          <Button variant="secondary" disabled={selectedRows.length === 0 || batchPending} onClick={() => void handleBatchStatus("partial")}>
            批量设为 partial
          </Button>
          <Button variant="secondary" disabled={selectedRows.length === 0 || batchPending} onClick={() => void handleBatchStatus("settled")}>
            批量设为 settled
          </Button>
          <Button variant="ghost" disabled={selectedRows.length === 0 || batchPending} onClick={() => setSelectedIds([])}>
            清空已选
          </Button>
          <div className="text-xs text-muted-foreground md:col-span-2">已选 {selectedRows.length} 项</div>
          <div className="flex items-center justify-end gap-2 md:col-span-2">
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
        </CardContent>
        {batchMessage ? (
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-3 text-xs text-muted-foreground">{batchMessage}</div>
          </CardContent>
        ) : null}
      </Card>
      {rows.length === 0 ? (
        <EmptyStateBlock title="暂无账单" description="当前组织还没有生成账单。" />
      ) : (
        <BillTable
          rows={rows}
          selectedIds={selectedIds}
          onToggleSelect={(id, checked) =>
            setSelectedIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)))
          }
          onToggleSelectAll={(checked) => setSelectedIds(checked ? rows.map((row) => row.id) : [])}
          onSelect={(row) => {
            setSelectedBillId(row.id);
            setDrawerOpen(true);
          }}
          onEdit={(row) => {
            setEditingBill(row);
            setEditOpen(true);
          }}
        />
      )}
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
      <BillDetailDrawer billId={selectedBillId} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <EditBillModal bill={editingBill} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
