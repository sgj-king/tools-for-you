import type { UserRole } from "@/types/shared";

export type DashboardOverview = {
  todayRequests: number;
  successRate: number;
  activeKeys: number;
  balanceUsd: number;
  estimatedTodayCostUsd: number;
  frozenAmountUsd: number;
  monthlyRevenueUsd: number;
  monthlyCostUsd: number;
  cacheHitRate: number;
};

export type TrendPoint = {
  date: string;
  requests: number;
  costUsd: number;
  revenueUsd: number;
  errors: number;
};

export type CostBreakdown = {
  label: string;
  value: number;
  fill: string;
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  projectName: string;
  keyPrefix: string;
  status: "active" | "disabled" | "expired" | "blocked";
  allowedModels: string[];
  rpmLimit: number;
  tpmLimit: number;
  lastUsedAt: string;
  createdAt: string;
};

export type CreatedApiKeyResult = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  keyPrefix: string;
  plainTextKey: string;
  allowedModels: string[];
  rpmLimit: number;
  tpmLimit: number;
  expiresAt?: string;
  ipAllowlist: string[];
};

export type RequestLogRecord = {
  id: string;
  traceId: string;
  requestStatus: "success" | "failed" | "rate_limited" | "in_progress";
  retryStatus: "none" | "retried" | "recovered" | "exhausted";
  projectName: string;
  apiKeyName: string;
  modelName: string;
  providerCode: string;
  routeProfileCode: string;
  totalTokens: number;
  actualCostUsd: number;
  latencyMs: number;
  cacheHit: boolean;
  createdAt: string;
};

export type RequestLogDetail = RequestLogRecord & {
  requestId: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  headers: Record<string, string>;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  retryTimeline: Array<{
    step: string;
    status: string;
    time: string;
  }>;
};

export type BillingSummary = {
  balanceUsd: number;
  frozenAmountUsd: number;
  estimatedTodayCostUsd: number;
  currentPlanName: string;
  includedQuotaText: string;
  nextInvoiceDate: string;
};

export type PlanCard = {
  id: string;
  name: string;
  priceUsdMonthly: number;
  highlights: string[];
  recommended?: boolean;
};

export type SubscriptionOverview = {
  currentPlanName: string;
  contractType: "monthly" | "annual" | "enterprise_credit";
  renewalDate: string;
  overagePolicy: string;
  seatPolicy: string;
  entitlementSummary: string[];
};

export type TopUpPackage = {
  id: string;
  label: string;
  amountUsd: number;
  bonusUsd: number;
  recommended?: boolean;
  description: string;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  status: "draft" | "issued" | "paid" | "overdue" | "void";
  amountUsd: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  issuedAt: string;
};

export type InvoiceDetail = InvoiceRecord & {
  billingEntityName: string;
  taxId?: string;
  currency: string;
  lineItems: Array<{
    label: string;
    quantity: number;
    unitPriceUsd: number;
    amountUsd: number;
  }>;
  notes?: string;
};

export type BillRecord = {
  id: string;
  billNumber: string;
  status: "open" | "settled" | "partial" | "overdue";
  amountUsd: number;
  usageAmountUsd: number;
  subscriptionAmountUsd: number;
  adjustmentAmountUsd: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
};

export type BillDetail = BillRecord & {
  currency: string;
  lineItems: Array<{
    label: string;
    amountUsd: number;
    category: "usage" | "subscription" | "adjustment";
  }>;
  notes?: string;
};

export type ModelCard = {
  id: string;
  publicName: string;
  summary: string;
  contextWindow: string;
  modalities: string[];
  pricingText: string;
  available: boolean;
};

export type ModelDetail = ModelCard & {
  maxOutputTokens: number;
  latencyTier: "standard" | "priority" | "batch";
  routeProfiles: string[];
  backingProviders: string[];
  bestFor: string[];
  limitations: string[];
  defaultTemperature: number;
  streamingSupported: boolean;
};

export type ProviderHealth = {
  providerCode: string;
  successRate: number;
  p95LatencyMs: number;
  status: "healthy" | "degraded" | "down";
  avgCostUsdPer1k: number;
};

export type RiskEvent = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "open" | "investigating" | "resolved";
  createdAt: string;
  summary: string;
};

export type TeamMember = {
  id: string;
  displayName: string;
  email: string;
  role: "member" | "project_admin" | "org_admin" | "finance";
  projectScope: string[];
  status: "active" | "invited" | "disabled";
  lastActiveAt: string;
};

export type TeamInvitationResult = {
  id: string;
  email: string;
  role: TeamMember["role"];
  inviteStatus: "sent" | "resent";
  projectScope: string[];
};

export type TeamRoleUpdateResult = {
  id: string;
  role: TeamMember["role"];
  projectScope: string[];
  status: TeamMember["status"];
};

export type WebhookRecord = {
  id: string;
  name: string;
  endpoint: string;
  events: string[];
  status: "active" | "disabled" | "failing";
  retryPolicy: string;
  lastDeliveryAt: string;
};

export type CreatedWebhookResult = {
  id: string;
  name: string;
  endpoint: string;
  events: string[];
  signingSecret: string;
  status: WebhookRecord["status"];
};

export type WebhookTestResult = {
  deliveryId: string;
  webhookId: string;
  event: string;
  status: "queued" | "delivered" | "failed";
  latencyMs: number;
};

export type WebhookDeliveryDetail = {
  deliveryId: string;
  webhookId: string;
  event: string;
  status: "delivered" | "failed" | "retrying";
  latencyMs: number;
  deliveredAt: string;
  responseCode: number;
  attempts: number;
  requestHeaders: Record<string, string>;
  requestBody: Record<string, unknown>;
  responseBody: Record<string, unknown>;
};

export type WebhookDeliveryRecord = {
  deliveryId: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: "delivered" | "failed" | "retrying";
  latencyMs: number;
  attempts: number;
  responseCode: number;
  deliveredAt: string;
  traceId?: string;
};

export type ProjectSettings = {
  projectId: string;
  projectName: string;
  environment: "production" | "staging" | "development";
  defaultModel: string;
  callbackUrl?: string;
  monthlyBudgetUsd: number;
  allowedOrigins: string[];
  tags: string[];
};

export type SecuritySettings = {
  organizationId: string;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  ipAllowlist: string[];
  webhookSignatureRequired: boolean;
  keyRotationDays: number;
  lastSecurityReviewAt: string;
};

export type SupportTicketRecord = {
  id: string;
  ticketNumber: string;
  subject: string;
  category: "billing" | "technical" | "risk" | "feature_request";
  priority: "low" | "medium" | "high";
  status: "open" | "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
  requesterName: string;
};

export type SupportTicketDetail = SupportTicketRecord & {
  description: string;
  projectName?: string;
  traceId?: string;
  replies: Array<{
    id: string;
    authorName: string;
    authorRole: "customer" | "support" | "system";
    content: string;
    createdAt: string;
  }>;
};

export type PlanTier = "free" | "pro";

export type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  orgName: string;
  role: UserRole;
  tier: PlanTier;
  avatarUrl?: string;
};

export type FilterPresetRecord = {
  id: string;
  scope: string;
  name: string;
  values: Record<string, unknown>;
  groupName?: string | null;
  tags?: string[];
  visibility: "private" | "organization";
  isDefault: boolean;
  isPinned?: boolean;
  sortOrder?: number;
  ownerUserId: string;
  ownerDisplayName: string;
  orgName: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
};

export type FilterPresetExportPayload = {
  version: string;
  exportedAt: string;
  scope: string;
  presets: FilterPresetRecord[];
};

export type FilterPresetImportResult = {
  scope: string;
  created: number;
  updated: number;
  skipped: number;
  total: number;
};

export type LoginResult = {
  sessionUser: SessionUser;
  redirectTo: string;
  returnTo?: string;
  message: string;
};

export type RegisterResult = {
  organizationId: string;
  organizationName: string;
  redirectTo: string;
  message: string;
};

export type ForgotPasswordResult = {
  email: string;
  deliveryChannel: "email";
  expiresInMinutes: number;
  message: string;
};

export type LogoutResult = {
  redirectTo: string;
  message: string;
};

export type AdminUserRecord = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  orgName: string;
  status: "active" | "suspended" | "invited";
  mfaEnabled: boolean;
  lastActiveAt: string;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  planName: string;
  memberCount: number;
  activeProjects: number;
  monthlySpendUsd: number;
  status: "active" | "restricted" | "trial";
};

export type PricingRuleRecord = {
  id: string;
  publicModel: string;
  upstreamModel: string;
  providerCode: string;
  sellPricePer1kUsd: number;
  costPricePer1kUsd: number;
  grossMarginPercent: number;
  status: "active" | "draft";
};

export type AuditLogRecord = {
  id: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: "success" | "failed";
  createdAt: string;
  traceId?: string;
};
