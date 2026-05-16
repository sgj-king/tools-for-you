type ScopeMetadata = {
  title: string;
  description: string;
  href: string;
  serialize: (values: Record<string, unknown>) => URLSearchParams;
};

function appendIfPresent(params: URLSearchParams, key: string, value: unknown) {
  if (typeof value === "string" && value !== "") {
    params.set(key, value);
  }
}

function appendCsvIfPresent(params: URLSearchParams, key: string, value: unknown) {
  if (Array.isArray(value)) {
    const normalized = value.map((item) => String(item).trim()).filter(Boolean);
    if (normalized.length > 0) {
      params.set(key, normalized.join(","));
    }
  }
}

function appendPositivePage(params: URLSearchParams, value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 1) {
    params.set("page", String(value));
  }
}

export const FILTER_PRESET_SCOPE_META: Record<string, ScopeMetadata> = {
  "console-usage": {
    title: "Usage",
    description: "请求日志、用量分析与 trace 查询",
    href: "/console/usage",
    serialize(values) {
      const params = new URLSearchParams();
      appendIfPresent(params, "keyword", values.keyword);
      if (values.model && values.model !== "all") params.set("model", String(values.model));
      if (values.project && values.project !== "all") params.set("project", String(values.project));
      if (values.status && values.status !== "all") params.set("status", String(values.status));
      if (values.provider && values.provider !== "all") params.set("provider", String(values.provider));
      return params;
    }
  },
  "console-bills": {
    title: "账单",
    description: "账单筛选、分页与导出视图",
    href: "/console/billing/bills",
    serialize(values) {
      const params = new URLSearchParams();
      appendIfPresent(params, "search", values.search);
      appendCsvIfPresent(params, "status", values.statuses);
      appendIfPresent(params, "date_from", values.dateFrom);
      appendIfPresent(params, "date_to", values.dateTo);
      appendIfPresent(params, "amount_min", values.amountMin);
      appendIfPresent(params, "amount_max", values.amountMax);
      if (values.sortBy && values.sortBy !== "periodStart") params.set("sort_by", String(values.sortBy));
      if (values.sortDir && values.sortDir !== "desc") params.set("sort_dir", String(values.sortDir));
      appendPositivePage(params, values.page);
      return params;
    }
  },
  "console-invoices": {
    title: "发票",
    description: "发票列表、状态筛选与金额区间",
    href: "/console/billing/invoices",
    serialize(values) {
      const params = new URLSearchParams();
      appendIfPresent(params, "search", values.search);
      appendCsvIfPresent(params, "status", values.statuses);
      appendIfPresent(params, "date_from", values.dateFrom);
      appendIfPresent(params, "date_to", values.dateTo);
      appendIfPresent(params, "amount_min", values.amountMin);
      appendIfPresent(params, "amount_max", values.amountMax);
      if (values.sortBy && values.sortBy !== "issuedAt") params.set("sort_by", String(values.sortBy));
      if (values.sortDir && values.sortDir !== "desc") params.set("sort_dir", String(values.sortDir));
      appendPositivePage(params, values.page);
      return params;
    }
  },
  "console-webhooks": {
    title: "Webhook",
    description: "Webhook 列表、投递筛选与状态排查",
    href: "/console/webhooks",
    serialize(values) {
      const params = new URLSearchParams();
      appendIfPresent(params, "search", values.search);
      appendCsvIfPresent(params, "status", values.statuses);
      appendIfPresent(params, "date_from", values.dateFrom);
      appendIfPresent(params, "date_to", values.dateTo);
      if (values.sortBy && values.sortBy !== "lastDeliveryAt") params.set("sort_by", String(values.sortBy));
      if (values.sortDir && values.sortDir !== "desc") params.set("sort_dir", String(values.sortDir));
      appendPositivePage(params, values.page);
      return params;
    }
  }
};

export const FILTER_PRESET_SCOPE_ORDER = Object.keys(FILTER_PRESET_SCOPE_META);

export function getFilterPresetScopeMeta(scope: string) {
  return FILTER_PRESET_SCOPE_META[scope];
}

export function buildFilterPresetHref(scope: string, values: Record<string, unknown>) {
  const meta = getFilterPresetScopeMeta(scope);
  if (!meta) return "#";
  const query = meta.serialize(values).toString();
  return query ? `${meta.href}?${query}` : meta.href;
}
