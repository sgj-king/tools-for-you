import { mockApi } from "@/services/mock";
import { apiClient, apiFileClient, platformClient, platformFileClient } from "@/services/sdk/client";
import type {
  AdminUserRecord,
  ApiKeyRecord,
  AuditLogRecord,
  BillingSummary,
  BillRecord,
  BillDetail,
  CreatedWebhookResult,
  CostBreakdown,
  CreatedApiKeyResult,
  DashboardOverview,
  FilterPresetExportPayload,
  FilterPresetImportResult,
  FilterPresetRecord,
  InvoiceRecord,
  InvoiceDetail,
  ModelCard,
  ModelDetail,
  OrganizationRecord,
  PlanCard,
  ProviderHealth,
  PricingRuleRecord,
  ProjectSettings,
  RequestLogRecord,
  RequestLogDetail,
  RiskEvent,
  SecuritySettings,
  SubscriptionOverview,
  SupportTicketRecord,
  SupportTicketDetail,
  TeamMember,
  TeamInvitationResult,
  TeamRoleUpdateResult,
  TrendPoint,
  TopUpPackage,
  WebhookDeliveryDetail,
  WebhookDeliveryRecord,
  WebhookRecord,
  WebhookTestResult,
  SessionUser
} from "@/types/domain";
import type { ApiEnvelope, RequestMeta } from "@/types/shared";

const useMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
const usePlatformBff = process.env.NEXT_PUBLIC_ENABLE_PLATFORM_BFF === "true";

function buildSessionHeaders(session: SessionUser) {
  return {
    "X-Session-User-Id": encodeSessionHeaderValue(session.id),
    "X-Session-User-Email": encodeSessionHeaderValue(session.email),
    "X-Session-User-Name": encodeSessionHeaderValue(session.displayName),
    "X-Session-Org-Name": encodeSessionHeaderValue(session.orgName),
    "X-Session-User-Role": encodeSessionHeaderValue(session.role)
  };
}

function encodeSessionHeaderValue(value: string) {
  return encodeURIComponent(value);
}

async function unwrap<T>(path: string) {
  const response = await apiClient<ApiEnvelope<T>>(path);
  return response.data;
}

type PagedResult<T> = {
  items: T[];
  meta?: RequestMeta;
};

type CommonFilterQuery = {
  search?: string;
  status?: string;
  statuses?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
};

type BillingAdvancedFilterQuery = CommonFilterQuery & {
  amountMin?: number;
  amountMax?: number;
};

export const overviewApi = {
  getOverview: async (): Promise<DashboardOverview> => (useMock ? mockApi.getOverview() : unwrap("/v1/usage/overview")),
  getTrends: async (): Promise<TrendPoint[]> => (useMock ? mockApi.getTrends() : unwrap("/v1/usage/trends")),
  getCostBreakdown: async (): Promise<CostBreakdown[]> =>
    useMock ? mockApi.getCostBreakdown() : unwrap("/v1/usage/cost-breakdown")
};

export const apiKeyApi = {
  list: async (): Promise<ApiKeyRecord[]> => (useMock ? mockApi.listApiKeys() : unwrap("/v1/api-keys")),
  create: async (payload: Record<string, unknown>): Promise<CreatedApiKeyResult> => {
    if (useMock) {
      return mockApi.createApiKey();
    }
    const response = await apiClient<ApiEnvelope<CreatedApiKeyResult>>("/v1/api-keys", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  }
};

export const usageApi = {
  listLogs: async (query?: { traceId?: string }): Promise<RequestLogRecord[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<RequestLogRecord[]>>("/api/platform/request-logs", {
        query: {
          trace_id: query?.traceId
        }
      });
      return response.data;
    }
    return useMock ? mockApi.listRequestLogs() : unwrap("/v1/request-logs");
  },
  getLogDetail: async (traceId: string): Promise<RequestLogDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<RequestLogDetail>>(`/api/platform/request-logs/${traceId}`);
      return response.data;
    }
    if (useMock) {
      return mockApi.getRequestLogDetail();
    }
    return unwrap(`/v1/request-logs/${traceId}`);
  }
};

export const billingApi = {
  getSummary: async (): Promise<BillingSummary> => (useMock ? mockApi.getBillingSummary() : unwrap("/v1/billing/summary")),
  listPlans: async (): Promise<PlanCard[]> => (useMock ? mockApi.listPlans() : unwrap("/v1/subscriptions/plans")),
  getSubscriptionOverview: async (): Promise<SubscriptionOverview> =>
    useMock ? mockApi.getSubscriptionOverview() : unwrap("/v1/subscriptions/current"),
  listTopUpPackages: async (): Promise<TopUpPackage[]> =>
    useMock ? mockApi.listTopUpPackages() : unwrap("/v1/billing/top-up/packages"),
  listInvoices: async (query?: BillingAdvancedFilterQuery): Promise<InvoiceRecord[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<InvoiceRecord[]>>("/api/platform/invoices", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo,
          amount_min: query?.amountMin,
          amount_max: query?.amountMax
        }
      });
      return response.data;
    }
    return useMock ? mockApi.listInvoices() : unwrap("/v1/billing/invoices");
  },
  listInvoicesPaged: async (query?: BillingAdvancedFilterQuery): Promise<PagedResult<InvoiceRecord>> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<InvoiceRecord[]>>("/api/platform/invoices", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo,
          amount_min: query?.amountMin,
          amount_max: query?.amountMax
        }
      });
      return { items: response.data, meta: response.meta };
    }
    const items = useMock ? await mockApi.listInvoices() : await unwrap<InvoiceRecord[]>("/v1/billing/invoices");
    return {
      items,
      meta: {
        requestId: "local",
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? items.length,
        total: items.length
      }
    };
  },
  createInvoice: async (payload: Record<string, unknown>): Promise<InvoiceDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<InvoiceDetail>>("/api/platform/invoices", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    return unwrap("/v1/billing/invoices");
  },
  exportInvoices: async (query?: BillingAdvancedFilterQuery) => {
    if (usePlatformBff) {
      return platformFileClient("/api/platform/invoices/export", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo,
          amount_min: query?.amountMin,
          amount_max: query?.amountMax
        }
      });
    }
    return apiFileClient("/v1/billing/invoices/export");
  },
  getInvoiceDetail: async (invoiceId: string): Promise<InvoiceDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<InvoiceDetail>>(`/api/platform/invoices/${invoiceId}`);
      return response.data;
    }
    if (useMock) {
      return mockApi.getInvoiceDetail(invoiceId);
    }
    return unwrap(`/v1/billing/invoices/${invoiceId}`);
  },
  updateInvoice: async (invoiceId: string, payload: Record<string, unknown>): Promise<InvoiceDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<InvoiceDetail>>(`/api/platform/invoices/${invoiceId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    return unwrap(`/v1/billing/invoices/${invoiceId}`);
  },
  listBills: async (query?: BillingAdvancedFilterQuery): Promise<BillRecord[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<BillRecord[]>>("/api/platform/bills", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo,
          amount_min: query?.amountMin,
          amount_max: query?.amountMax
        }
      });
      return response.data;
    }
    return useMock ? mockApi.listBills() : unwrap("/v1/billing/bills");
  },
  listBillsPaged: async (query?: BillingAdvancedFilterQuery): Promise<PagedResult<BillRecord>> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<BillRecord[]>>("/api/platform/bills", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo,
          amount_min: query?.amountMin,
          amount_max: query?.amountMax
        }
      });
      return { items: response.data, meta: response.meta };
    }
    const items = useMock ? await mockApi.listBills() : await unwrap<BillRecord[]>("/v1/billing/bills");
    return {
      items,
      meta: {
        requestId: "local",
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? items.length,
        total: items.length
      }
    };
  },
  getBillDetail: async (billId: string): Promise<BillDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<BillDetail>>(`/api/platform/bills/${billId}`);
      return response.data;
    }
    if (useMock) {
      return mockApi.getBillDetail(billId);
    }
    return unwrap(`/v1/billing/bills/${billId}`);
  },
  updateBill: async (billId: string, payload: Record<string, unknown>): Promise<BillDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<BillDetail>>(`/api/platform/bills/${billId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    return unwrap(`/v1/billing/bills/${billId}`);
  },
  exportBills: async (query?: BillingAdvancedFilterQuery) => {
    if (usePlatformBff) {
      return platformFileClient("/api/platform/bills/export", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo,
          amount_min: query?.amountMin,
          amount_max: query?.amountMax
        }
      });
    }
    return apiFileClient("/v1/billing/bills/export");
  }
};

export const modelApi = {
  listCatalog: async (): Promise<ModelCard[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<ModelCard[]>>("/api/platform/models");
      return response.data;
    }
    return useMock ? mockApi.listModels() : unwrap("/v1/models");
  },
  getDetail: async (modelId: string): Promise<ModelDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<ModelDetail>>(`/api/platform/models/${modelId}`);
      return response.data;
    }
    if (useMock) {
      return mockApi.getModelDetail(modelId);
    }
    return unwrap(`/v1/models/${modelId}`);
  }
};

export const adminRoutingApi = {
  listProviders: async (): Promise<ProviderHealth[]> => (useMock ? mockApi.listProviders() : unwrap("/v1/admin/routing/health"))
};

export const adminRiskApi = {
  listEvents: async (): Promise<RiskEvent[]> => (useMock ? mockApi.listRiskEvents() : unwrap("/v1/admin/risk/events"))
};

export const adminUserApi = {
  listUsers: async (): Promise<AdminUserRecord[]> => (useMock ? mockApi.listAdminUsers() : unwrap("/v1/admin/users"))
};

export const adminOrgApi = {
  listOrganizations: async (): Promise<OrganizationRecord[]> =>
    useMock ? mockApi.listOrganizations() : unwrap("/v1/admin/organizations")
};

export const adminPricingApi = {
  listRules: async (): Promise<PricingRuleRecord[]> => (useMock ? mockApi.listPricingRules() : unwrap("/v1/admin/pricing/rules"))
};

export const auditApi = {
  listLogs: async (): Promise<AuditLogRecord[]> => (useMock ? mockApi.listAuditLogs() : unwrap("/v1/admin/audit/logs"))
};

export const filterPresetApi = {
  list: async (session: SessionUser, query: { scope: string }): Promise<FilterPresetRecord[]> => {
    if (!usePlatformBff) {
      throw new Error("filter presets require platform BFF");
    }
    const response = await platformClient<ApiEnvelope<FilterPresetRecord[]>>("/api/platform/filter-presets", {
      query,
      headers: buildSessionHeaders(session)
    });
    return response.data;
  },
  create: async (
    session: SessionUser,
    payload: {
      scope: string;
      name: string;
      values: Record<string, unknown>;
      groupName?: string;
      tags?: string[];
      visibility: "private" | "organization";
      isDefault?: boolean;
      isPinned?: boolean;
      sortOrder?: number;
    }
  ): Promise<FilterPresetRecord> => {
    if (!usePlatformBff) {
      throw new Error("filter presets require platform BFF");
    }
    const response = await platformClient<ApiEnvelope<FilterPresetRecord>>("/api/platform/filter-presets", {
      method: "POST",
      headers: buildSessionHeaders(session),
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  update: async (
    session: SessionUser,
    presetId: string,
    payload: {
      name?: string;
      values?: Record<string, unknown>;
      groupName?: string;
      tags?: string[];
      visibility?: "private" | "organization";
      isDefault?: boolean;
      isPinned?: boolean;
      markUsed?: boolean;
      sortOrder?: number;
    }
  ): Promise<FilterPresetRecord> => {
    if (!usePlatformBff) {
      throw new Error("filter presets require platform BFF");
    }
    const response = await platformClient<ApiEnvelope<FilterPresetRecord>>(`/api/platform/filter-presets/${presetId}`, {
      method: "PUT",
      headers: buildSessionHeaders(session),
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  remove: async (session: SessionUser, presetId: string): Promise<{ id: string; deleted: boolean }> => {
    if (!usePlatformBff) {
      throw new Error("filter presets require platform BFF");
    }
    const response = await platformClient<ApiEnvelope<{ id: string; deleted: boolean }>>(`/api/platform/filter-presets/${presetId}`, {
      method: "DELETE",
      headers: buildSessionHeaders(session)
    });
    return response.data;
  },
  export: async (session: SessionUser, query: { scope: string }) => {
    if (!usePlatformBff) {
      throw new Error("filter presets require platform BFF");
    }
    return platformFileClient("/api/platform/filter-presets/export", {
      query,
      headers: buildSessionHeaders(session)
    });
  },
  import: async (
    session: SessionUser,
    payload: {
      scope?: string;
      presets: Array<{
        name: string;
        values: Record<string, unknown>;
        groupName?: string;
        tags?: string[];
        visibility?: "private" | "organization";
        isDefault?: boolean;
        isPinned?: boolean;
        sortOrder?: number;
      }>;
    }
  ): Promise<FilterPresetImportResult> => {
    if (!usePlatformBff) {
      throw new Error("filter presets require platform BFF");
    }
    const response = await platformClient<ApiEnvelope<FilterPresetImportResult>>("/api/platform/filter-presets/import", {
      method: "POST",
      headers: buildSessionHeaders(session),
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  parseExportPayload: async (response: Response): Promise<FilterPresetExportPayload> => {
    return (await response.json()) as FilterPresetExportPayload;
  }
};

export const teamApi = {
  listMembers: async (query?: CommonFilterQuery & { role?: string }): Promise<TeamMember[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<TeamMember[]>>("/api/platform/team/members", {
        query: {
          search: query?.search,
          role: query?.role,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo
        }
      });
      return response.data;
    }
    return useMock ? mockApi.listTeamMembers() : unwrap("/v1/team/members");
  },
  listMembersPaged: async (query?: CommonFilterQuery & { role?: string }): Promise<PagedResult<TeamMember>> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<TeamMember[]>>("/api/platform/team/members", {
        query: {
          search: query?.search,
          role: query?.role,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo
        }
      });
      return { items: response.data, meta: response.meta };
    }
    const items = useMock ? await mockApi.listTeamMembers() : await unwrap<TeamMember[]>("/v1/team/members");
    return {
      items,
      meta: {
        requestId: "local",
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? items.length,
        total: items.length
      }
    };
  },
  exportMembers: async (query?: CommonFilterQuery & { role?: string }) => {
    if (usePlatformBff) {
      return platformFileClient("/api/platform/team/members/export", {
        query: {
          search: query?.search,
          role: query?.role,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo
        }
      });
    }
    return apiFileClient("/v1/team/members/export");
  },
  invite: async (payload: Record<string, unknown>): Promise<TeamInvitationResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<TeamInvitationResult>>("/api/platform/team/invitations", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.inviteTeamMember();
    }
    const response = await apiClient<ApiEnvelope<TeamInvitationResult>>("/v1/team/invitations", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  updateRole: async (memberId: string, payload: Record<string, unknown>): Promise<TeamRoleUpdateResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<TeamRoleUpdateResult>>(`/api/platform/team/members/${memberId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.updateTeamRole();
    }
    const response = await apiClient<ApiEnvelope<TeamRoleUpdateResult>>(`/v1/team/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return response.data;
  }
};

export const projectApi = {
  getSettings: async (): Promise<ProjectSettings> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<ProjectSettings>>("/api/platform/project-settings");
      return response.data;
    }
    return useMock ? mockApi.getProjectSettings() : unwrap("/v1/projects/current/settings");
  },
  updateSettings: async (payload: Record<string, unknown>): Promise<ProjectSettings> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<ProjectSettings>>("/api/platform/project-settings", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.updateProjectSettings();
    }
    const response = await apiClient<ApiEnvelope<ProjectSettings>>("/v1/projects/current/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return response.data;
  }
};

export const securityApi = {
  getSettings: async (): Promise<SecuritySettings> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SecuritySettings>>("/api/platform/security-settings");
      return response.data;
    }
    return useMock ? mockApi.getSecuritySettings() : unwrap("/v1/security/settings");
  },
  updateSettings: async (payload: Record<string, unknown>): Promise<SecuritySettings> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SecuritySettings>>("/api/platform/security-settings", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.updateSecuritySettings();
    }
    const response = await apiClient<ApiEnvelope<SecuritySettings>>("/v1/security/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return response.data;
  }
};

export const webhookApi = {
  list: async (query?: CommonFilterQuery): Promise<WebhookRecord[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<WebhookRecord[]>>("/api/platform/webhooks", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo
        }
      });
      return response.data;
    }
    return useMock ? mockApi.listWebhooks() : unwrap("/v1/webhooks");
  },
  listPaged: async (query?: CommonFilterQuery): Promise<PagedResult<WebhookRecord>> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<WebhookRecord[]>>("/api/platform/webhooks", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          page: query?.page,
          page_size: query?.pageSize,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo
        }
      });
      return { items: response.data, meta: response.meta };
    }
    const items = useMock ? await mockApi.listWebhooks() : await unwrap<WebhookRecord[]>("/v1/webhooks");
    return {
      items,
      meta: {
        requestId: "local",
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? items.length,
        total: items.length
      }
    };
  },
  exportWebhooks: async (query?: CommonFilterQuery) => {
    if (usePlatformBff) {
      return platformFileClient("/api/platform/webhooks/export", {
        query: {
          search: query?.search,
          status: query?.statuses?.length ? query.statuses.join(",") : query?.status,
          sort_by: query?.sortBy,
          sort_dir: query?.sortDir,
          date_from: query?.dateFrom,
          date_to: query?.dateTo
        }
      });
    }
    return apiFileClient("/v1/webhooks/export");
  },
  create: async (payload: Record<string, unknown>): Promise<CreatedWebhookResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<CreatedWebhookResult>>("/api/platform/webhooks", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.createWebhook();
    }
    const response = await apiClient<ApiEnvelope<CreatedWebhookResult>>("/v1/webhooks", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  update: async (webhookId: string, payload: Record<string, unknown>): Promise<WebhookRecord> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<WebhookRecord>>(`/api/platform/webhooks/${webhookId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    const response = await apiClient<ApiEnvelope<WebhookRecord>>(`/v1/webhooks/${webhookId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  test: async (payload: Record<string, unknown>): Promise<WebhookTestResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<WebhookTestResult>>("/api/platform/webhooks/test", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.testWebhook();
    }
    const response = await apiClient<ApiEnvelope<WebhookTestResult>>("/v1/webhooks/test", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  listDeliveries: async (): Promise<WebhookDeliveryRecord[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<WebhookDeliveryRecord[]>>("/api/platform/webhook-deliveries");
      return response.data;
    }
    return useMock ? mockApi.listWebhookDeliveries() : unwrap("/v1/webhooks/deliveries");
  },
  getRecentDeliveryDetail: async (webhookId: string): Promise<WebhookDeliveryDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<WebhookDeliveryDetail>>(`/api/platform/webhooks/${webhookId}/deliveries/latest`);
      return response.data;
    }
    if (useMock) {
      return mockApi.getWebhookDeliveryDetail();
    }
    return unwrap(`/v1/webhooks/${webhookId}/deliveries/latest`);
  },
  getDeliveryDetail: async (deliveryId: string): Promise<WebhookDeliveryDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<WebhookDeliveryDetail>>(`/api/platform/webhook-deliveries/${deliveryId}`);
      return response.data;
    }
    if (useMock) {
      return mockApi.getWebhookDeliveryDetailByDeliveryId();
    }
    return unwrap(`/v1/webhooks/deliveries/${deliveryId}`);
  }
};

export const supportApi = {
  listTickets: async (): Promise<SupportTicketRecord[]> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SupportTicketRecord[]>>("/api/platform/support-tickets");
      return response.data;
    }
    return useMock ? mockApi.listSupportTickets() : unwrap("/v1/support/tickets");
  },
  getTicketDetail: async (ticketId: string): Promise<SupportTicketDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SupportTicketDetail>>(`/api/platform/support-tickets/${ticketId}`);
      return response.data;
    }
    if (useMock) {
      return mockApi.getSupportTicketDetail(ticketId);
    }
    return unwrap(`/v1/support/tickets/${ticketId}`);
  },
  replyTicket: async (ticketId: string, payload: Record<string, unknown>): Promise<SupportTicketDetail> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SupportTicketDetail>>(`/api/platform/support-tickets/${ticketId}/replies`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.replySupportTicket();
    }
    const response = await apiClient<ApiEnvelope<SupportTicketDetail>>(`/v1/support/tickets/${ticketId}/replies`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  }
};
