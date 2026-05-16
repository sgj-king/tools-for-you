"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FilterPresetBar } from "@/components/domain/filter-preset-bar";
import { InviteTeamMemberModal } from "@/components/domain/invite-team-member-modal";
import { TeamTable } from "@/components/domain/team-table";
import { useTeamMembersPagedQuery } from "@/hooks/use-console-data";
import { teamApi } from "@/services/sdk/console-api";
import type { TeamMember } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TEAM_STATUS_OPTIONS: TeamMember["status"][] = ["active", "invited", "disabled"];

type SearchParamReader = Pick<URLSearchParams, "get">;
type TeamFilters = {
  search: string;
  role: string;
  statuses: string[];
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
};

const DEFAULT_TEAM_FILTERS: TeamFilters = {
  search: "",
  role: "all",
  statuses: [],
  dateFrom: "",
  dateTo: "",
  sortBy: "displayName",
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

function readTeamFilters(searchParams: SearchParamReader): TeamFilters {
  return {
    search: searchParams.get("search") ?? DEFAULT_TEAM_FILTERS.search,
    role: searchParams.get("role") ?? DEFAULT_TEAM_FILTERS.role,
    statuses: parseCsvParam(searchParams.get("status")),
    dateFrom: searchParams.get("date_from") ?? DEFAULT_TEAM_FILTERS.dateFrom,
    dateTo: searchParams.get("date_to") ?? DEFAULT_TEAM_FILTERS.dateTo,
    sortBy: searchParams.get("sort_by") ?? DEFAULT_TEAM_FILTERS.sortBy,
    sortDir: searchParams.get("sort_dir") === "asc" ? "asc" : DEFAULT_TEAM_FILTERS.sortDir,
    page: Math.max(1, Number(searchParams.get("page") ?? DEFAULT_TEAM_FILTERS.page))
  };
}

function buildTeamQueryParams(filters: TeamFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.role !== DEFAULT_TEAM_FILTERS.role) params.set("role", filters.role);
  if (filters.statuses.length > 0) params.set("status", filters.statuses.join(","));
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.sortBy !== DEFAULT_TEAM_FILTERS.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.sortDir !== DEFAULT_TEAM_FILTERS.sortDir) params.set("sort_dir", filters.sortDir);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function TeamView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const initialFilters = useMemo(() => readTeamFilters(searchParams), [searchParams]);

  const [search, setSearch] = useState(initialFilters.search);
  const [role, setRole] = useState(initialFilters.role);
  const [statuses, setStatuses] = useState<string[]>(initialFilters.statuses);
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom);
  const [dateTo, setDateTo] = useState(initialFilters.dateTo);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialFilters.sortDir);
  const [page, setPage] = useState(initialFilters.page);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMessage, setBatchMessage] = useState("");
  const [batchPending, setBatchPending] = useState(false);
  const currentFilters = useMemo<TeamFilters>(
    () => ({
      search,
      role,
      statuses,
      dateFrom,
      dateTo,
      sortBy,
      sortDir,
      page
    }),
    [search, role, statuses, dateFrom, dateTo, sortBy, sortDir, page]
  );

  const pageSize = 10;
  const team = useTeamMembersPagedQuery({
    search: search || undefined,
    role: role === "all" ? undefined : role,
    statuses: statuses.length > 0 ? statuses : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortDir,
    page,
    pageSize
  });

  const rows = useMemo(() => team.data?.items ?? [], [team.data?.items]);
  const total = team.data?.meta?.total ?? rows.length;
  const hasNext = page * pageSize < total;
  const selectedRows = useMemo(() => rows.filter((row) => selectedIds.includes(row.id)), [rows, selectedIds]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => rows.some((row) => row.id === id));
      return next.length === current.length ? current : next;
    });
  }, [rows]);

  useEffect(() => {
    const next = buildTeamQueryParams(currentFilters).toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [currentFilters, pathname, router, searchParams]);

  if (!team.data?.items) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载团队成员…</div>;
  }

  const handleExport = async () => {
    const response = await teamApi.exportMembers({
      search: search || undefined,
      role: role === "all" ? undefined : role,
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
    link.download = "team-members.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleBatchStatus = async (nextStatus: TeamMember["status"]) => {
    if (selectedRows.length === 0) return;
    setBatchPending(true);
    setBatchMessage("");
    try {
      await Promise.all(
        selectedRows.map((row) =>
          teamApi.updateRole(row.id, {
            role: row.role,
            projectScope: row.projectScope,
            status: nextStatus
          })
        )
      );
      setSelectedIds([]);
      setBatchMessage(`已批量更新 ${selectedRows.length} 个成员状态为 ${nextStatus}。`);
      await queryClient.invalidateQueries({ queryKey: ["team-members"] });
      await queryClient.invalidateQueries({ queryKey: ["team-members-paged"] });
    } catch {
      setBatchMessage("批量更新失败，请稍后重试。");
    } finally {
      setBatchPending(false);
    }
  };

  const applyFilters = (next: TeamFilters) => {
    setSearch(next.search);
    setRole(next.role);
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
            <CardTitle>团队与权限</CardTitle>
            <p className="text-sm text-muted-foreground">支持成员搜索、角色筛选、排序、分页、批量启用/禁用与导出。</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="搜索成员邮箱 / 姓名 / 角色"
              className="max-w-sm"
            />
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="all">全部角色</option>
              <option value="org_admin">组织管理员</option>
              <option value="project_admin">项目管理员</option>
              <option value="member">成员</option>
              <option value="finance">财务</option>
            </select>
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
              <option value="displayName">按姓名</option>
              <option value="email">按邮箱</option>
              <option value="role">按角色</option>
              <option value="status">按状态</option>
              <option value="lastActiveAt">按最近活跃</option>
            </select>
            <select value={sortDir} onChange={(event) => setSortDir(event.target.value as "asc" | "desc")} className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
            <Button variant="secondary" onClick={handleExport}>
              导出 CSV
            </Button>
            <InviteTeamMemberModal />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <FilterPresetBar
            scope="console-team"
            currentValues={currentFilters}
            defaultValues={DEFAULT_TEAM_FILTERS}
            onApply={applyFilters}
            serialize={buildTeamQueryParams}
          />
        </CardContent>
        <CardContent className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">状态筛选：</span>
          {TEAM_STATUS_OPTIONS.map((item) => {
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
      </Card>
      <TeamTable
        rows={rows}
        selectedIds={selectedIds}
        onToggleSelect={(id, checked) =>
          setSelectedIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)))
        }
        onToggleSelectAll={(checked) => setSelectedIds(checked ? rows.map((row) => row.id) : [])}
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
    </div>
  );
}
