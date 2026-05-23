import {
  mockAdminUsers,
  mockApiKeys,
  mockAuditLogs,
  mockBilling,
  mockBills,
  mockBillDetail,
  mockCosts,
  mockCreatedKey,
  mockCreatedWebhook,
  mockInvoices,
  mockInvoiceDetail,
  mockLogs,
  mockModelDetails,
  mockModels,
  mockOrganizations,
  mockOverview,
  mockPlans,
  mockProviders,
  mockPricingRules,
  mockProjectSettings,
  mockRequestDetail,
  mockRiskEvents,
  mockSecuritySettings,
  mockSubscriptionOverview,
  mockSupportTickets,
  mockSupportTicketDetail,
  mockTeamInvitation,
  mockTeamRoleUpdate,
  mockTeamMembers,
  mockTopUpPackages,
  mockTrends,
  mockUser,
  mockWebhookDeliveryDetail,
  mockWebhookDeliveries,
  mockWebhookTest,
  mockWebhooks
} from "@/services/mock/data";
import type { LogoutResult, SessionUser } from "@/types/domain";
import type { UserRole } from "@/types/shared";

const SESSION_STORAGE_KEY = "platform_console_mock_session_user_v1";
const LOGIN_STORAGE_KEY = "platform_console_mock_logged_in_v1";
const adminRoles: ReadonlySet<UserRole> = new Set(["platform_super_admin", "ops_admin"]);

let runtimeMockUser: SessionUser = { ...mockUser };
let runtimeLoggedIn = true;
let runtimeHydrated = false;

function isBrowser() {
  return typeof window !== "undefined";
}

function cloneSessionUser(user: SessionUser): SessionUser {
  return { ...user };
}

function buildAvatar(displayName: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1e8b77`;
}

function readPersistedSession() {
  if (!isBrowser() || runtimeHydrated) return;
  runtimeHydrated = true;

  try {
    const storedLoginFlag = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    if (storedLoginFlag === "false") {
      runtimeLoggedIn = false;
    }

    const storedSessionRaw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedSessionRaw) return;
    const parsed = JSON.parse(storedSessionRaw) as Partial<SessionUser>;

    if (typeof parsed.id === "string" && typeof parsed.email === "string" && typeof parsed.displayName === "string" && typeof parsed.orgName === "string" && typeof parsed.role === "string") {
      runtimeMockUser = {
        id: parsed.id,
        email: parsed.email,
        displayName: parsed.displayName,
        orgName: parsed.orgName,
        role: parsed.role as UserRole,
        tier: parsed.tier === "pro" ? "pro" : "free",
        avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : buildAvatar(parsed.displayName)
      };
    }
  } catch {
    runtimeMockUser = { ...mockUser };
    runtimeLoggedIn = true;
  }
}

function persistSession() {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(runtimeMockUser));
  window.localStorage.setItem(LOGIN_STORAGE_KEY, runtimeLoggedIn ? "true" : "false");
}

function resolveRoleByEmail(email: string): UserRole {
  const normalized = email.toLowerCase().trim();
  const localPart = (normalized.split("@")[0] ?? "").trim();

  if (["superadmin", "platform-admin", "platform.superadmin"].includes(localPart)) return "platform_super_admin";
  if (["ops", "ops-admin", "platform-ops"].includes(localPart)) return "ops_admin";
  if (["owner", "orgadmin", "org-admin"].includes(localPart)) return "org_admin";
  if (["finance", "billing"].includes(localPart)) return "finance";
  if (["pm", "projectadmin", "project-admin"].includes(localPart)) return "project_admin";
  return "member";
}

function defaultDisplayNameByEmail(email: string) {
  const localPart = email.split("@")[0] ?? "开发者";
  return localPart.replace(/[._-]+/g, " ").trim() || "开发者";
}

export const mockApi = {
  getSessionUser: async () => {
    readPersistedSession();
    if (!runtimeLoggedIn) {
      throw new Error("mock_session_not_found");
    }
    return cloneSessionUser(runtimeMockUser);
  },
  login: async (payload?: { email?: string; password?: string; mfaCode?: string }) => {
    readPersistedSession();
    const normalizedEmail = String(payload?.email ?? runtimeMockUser.email).trim().toLowerCase() || runtimeMockUser.email;
    const role = resolveRoleByEmail(normalizedEmail);
    const displayName = normalizedEmail === runtimeMockUser.email ? runtimeMockUser.displayName : defaultDisplayNameByEmail(normalizedEmail);

    runtimeMockUser = {
      ...runtimeMockUser,
      email: normalizedEmail,
      role,
      displayName,
      avatarUrl: runtimeMockUser.avatarUrl || buildAvatar(displayName)
    };
    runtimeLoggedIn = true;
    persistSession();

    return {
      sessionUser: cloneSessionUser(runtimeMockUser),
      redirectTo: adminRoles.has(role) ? "/admin" : "/console",
      message: "登录成功，正在进入控制台。"
    };
  },
  logout: async (): Promise<LogoutResult> => {
    readPersistedSession();
    runtimeLoggedIn = false;
    persistSession();
    return {
      redirectTo: "/login",
      message: "已安全退出登录。"
    };
  },
  updateProfile: async (payload: { displayName?: string; avatarUrl?: string | null }) => {
    readPersistedSession();
    const nextDisplayName = payload.displayName?.trim();
    if (nextDisplayName) {
      runtimeMockUser.displayName = nextDisplayName;
    }
    if (payload.avatarUrl !== undefined) {
      runtimeMockUser.avatarUrl = payload.avatarUrl ?? undefined;
    } else if (!runtimeMockUser.avatarUrl) {
      runtimeMockUser.avatarUrl = buildAvatar(runtimeMockUser.displayName);
    }
    persistSession();
    return cloneSessionUser(runtimeMockUser);
  },
  updateTier: async (tier: "free" | "pro") => {
    readPersistedSession();
    runtimeMockUser.tier = tier === "pro" ? "pro" : "free";
    persistSession();
    return cloneSessionUser(runtimeMockUser);
  },
  register: async () => ({
    organizationId: "org_new_001",
    organizationName: "彗星科技新组织",
    redirectTo: "/login",
    message: "组织已创建，请前往登录并完成邮箱验证。"
  }),
  forgotPassword: async (email: string) => ({
    email,
    deliveryChannel: "email" as const,
    expiresInMinutes: 30,
    message: "重置链接已发送到你的邮箱。"
  }),
  getOverview: async () => mockOverview,
  getTrends: async () => mockTrends,
  getCostBreakdown: async () => mockCosts,
  listApiKeys: async () => mockApiKeys,
  createApiKey: async () => mockCreatedKey,
  listRequestLogs: async () => mockLogs,
  getRequestLogDetail: async () => mockRequestDetail,
  getBillingSummary: async () => mockBilling,
  listPlans: async () => mockPlans,
  listModels: async () => mockModels,
  getModelDetail: async (modelId: string) => mockModelDetails[modelId] ?? mockModelDetails["chat-pro"],
  getSubscriptionOverview: async () => mockSubscriptionOverview,
  listTopUpPackages: async () => mockTopUpPackages,
  listInvoices: async () => mockInvoices,
  getInvoiceDetail: async (_invoiceId: string) => mockInvoiceDetail,
  listBills: async () => mockBills,
  getBillDetail: async (_billId: string) => mockBillDetail,
  listProviders: async () => mockProviders,
  listRiskEvents: async () => mockRiskEvents,
  listAdminUsers: async () => mockAdminUsers,
  listOrganizations: async () => mockOrganizations,
  listPricingRules: async () => mockPricingRules,
  listAuditLogs: async () => mockAuditLogs,
  listTeamMembers: async () => mockTeamMembers,
  inviteTeamMember: async () => mockTeamInvitation,
  updateTeamRole: async () => mockTeamRoleUpdate,
  listWebhooks: async () => mockWebhooks,
  createWebhook: async () => mockCreatedWebhook,
  testWebhook: async () => mockWebhookTest,
  listWebhookDeliveries: async () => mockWebhookDeliveries,
  getWebhookDeliveryDetail: async () => mockWebhookDeliveryDetail,
  getWebhookDeliveryDetailByDeliveryId: async () => mockWebhookDeliveryDetail,
  getProjectSettings: async () => mockProjectSettings,
  getSecuritySettings: async () => mockSecuritySettings,
  updateProjectSettings: async () => mockProjectSettings,
  updateSecuritySettings: async () => mockSecuritySettings,
  listSupportTickets: async () => mockSupportTickets,
  getSupportTicketDetail: async (_ticketId: string) => mockSupportTicketDetail,
  replySupportTicket: async () => mockSupportTicketDetail
};
