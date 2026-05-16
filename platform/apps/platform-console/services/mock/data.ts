import type {
  AdminUserRecord,
  ApiKeyRecord,
  AuditLogRecord,
  BillingSummary,
  CreatedWebhookResult,
  CostBreakdown,
  CreatedApiKeyResult,
  DashboardOverview,
  BillRecord,
  BillDetail,
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
  SessionUser,
  SubscriptionOverview,
  SupportTicketRecord,
  SupportTicketDetail,
  TeamMember,
  TeamInvitationResult,
  TeamRoleUpdateResult,
  TopUpPackage,
  WebhookDeliveryRecord,
  TrendPoint
  ,
  WebhookDeliveryDetail,
  WebhookRecord,
  WebhookTestResult
} from "@/types/domain";

export const mockUser: SessionUser = {
  id: "usr_console_001",
  displayName: "林川",
  email: "linchuan@example.com",
  orgName: "彗星科技",
  role: "member",
  avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=%E6%9E%97%E5%B7%9D&backgroundColor=1e8b77"
};

export const mockOverview: DashboardOverview = {
  todayRequests: 128433,
  successRate: 99.18,
  activeKeys: 18,
  balanceUsd: 3812.42,
  estimatedTodayCostUsd: 128.24,
  frozenAmountUsd: 73.48,
  monthlyRevenueUsd: 18124.48,
  monthlyCostUsd: 11621.19,
  cacheHitRate: 28.4
};

export const mockTrends: TrendPoint[] = [
  { date: "04-15", requests: 81234, costUsd: 91.3, revenueUsd: 136.1, errors: 112 },
  { date: "04-16", requests: 93512, costUsd: 102.4, revenueUsd: 150.6, errors: 124 },
  { date: "04-17", requests: 102034, costUsd: 111.9, revenueUsd: 163.2, errors: 145 },
  { date: "04-18", requests: 118234, costUsd: 123.6, revenueUsd: 176.5, errors: 129 },
  { date: "04-19", requests: 110284, costUsd: 117.1, revenueUsd: 170.4, errors: 153 },
  { date: "04-20", requests: 124005, costUsd: 126.9, revenueUsd: 182.8, errors: 167 },
  { date: "04-21", requests: 128433, costUsd: 128.2, revenueUsd: 186.4, errors: 141 }
];

export const mockCosts: CostBreakdown[] = [
  { label: "chat-pro", value: 41.5, fill: "#1e8b77" },
  { label: "reasoning-pro", value: 23.4, fill: "#4f6bed" },
  { label: "vision-pro", value: 14.2, fill: "#d97706" },
  { label: "embedding-large(待接入)", value: 8.1, fill: "#7c3aed" },
  { label: "缓存账单", value: 4.8, fill: "#64748b" }
];

export const mockApiKeys: ApiKeyRecord[] = [
  {
    id: "key_001",
    name: "production-web",
    projectName: "Web App",
    keyPrefix: "ns_live_2f4d",
    status: "active",
    allowedModels: ["chat-pro", "reasoning-pro", "vision-pro"],
    rpmLimit: 800,
    tpmLimit: 320000,
    lastUsedAt: "2026-04-21 13:42",
    createdAt: "2026-03-02 09:20"
  },
  {
    id: "key_002",
    name: "batch-analytics",
    projectName: "Insights",
    keyPrefix: "ns_live_7ad1",
    status: "active",
    allowedModels: ["chat-pro", "vision-pro"],
    rpmLimit: 120,
    tpmLimit: 880000,
    lastUsedAt: "2026-04-21 13:28",
    createdAt: "2026-03-11 11:03"
  },
  {
    id: "key_003",
    name: "staging-gateway",
    projectName: "Platform QA",
    keyPrefix: "ns_test_d1a3",
    status: "disabled",
    allowedModels: ["chat-basic"],
    rpmLimit: 40,
    tpmLimit: 24000,
    lastUsedAt: "2026-04-19 17:12",
    createdAt: "2026-02-18 20:14"
  }
];

export const mockCreatedKey: CreatedApiKeyResult = {
  id: "key_new_001",
  name: "partner-gateway",
  projectId: "proj_002",
  projectName: "Partner Integrations",
  keyPrefix: "ns_live_8bc2",
  plainTextKey: "ns_live_full_secret_only_visible_once_8bc2",
  allowedModels: ["chat-pro", "reasoning-pro"],
  rpmLimit: 300,
  tpmLimit: 120000,
  expiresAt: "2026-12-31 23:59",
  ipAllowlist: ["203.0.113.11/32"]
};

export const mockLogs: RequestLogRecord[] = [
  {
    id: "req_001",
    traceId: "trace_9a2e41f8",
    requestStatus: "success",
    retryStatus: "none",
    projectName: "Web App",
    apiKeyName: "production-web",
    modelName: "chat-pro",
    providerCode: "groq-primary-dev",
    routeProfileCode: "chat-pro-global",
    totalTokens: 3128,
    actualCostUsd: 0.0184,
    latencyMs: 1220,
    cacheHit: false,
    createdAt: "13:42:08"
  },
  {
    id: "req_002",
    traceId: "trace_12bc91ad",
    requestStatus: "failed",
    retryStatus: "recovered",
    projectName: "Web App",
    apiKeyName: "production-web",
    modelName: "reasoning-pro",
    providerCode: "groq-primary-dev",
    routeProfileCode: "reasoning-multi-route",
    totalTokens: 4910,
    actualCostUsd: 0.0342,
    latencyMs: 3410,
    cacheHit: false,
    createdAt: "13:41:32"
  },
  {
    id: "req_003",
    traceId: "trace_0dc671ca",
    requestStatus: "success",
    retryStatus: "none",
    projectName: "Insights",
    apiKeyName: "batch-analytics",
    modelName: "vision-pro",
    providerCode: "groq-primary-dev",
    routeProfileCode: "vision-default",
    totalTokens: 1296,
    actualCostUsd: 0.0042,
    latencyMs: 1650,
    cacheHit: true,
    createdAt: "13:39:16"
  }
];

export const mockRequestDetail: RequestLogDetail = {
  ...mockLogs[1],
  requestId: "req-prod-20260421-0002",
  inputTokens: 2900,
  outputTokens: 2010,
  estimatedCostUsd: 0.0351,
  headers: {
    "x-request-id": "req-prod-20260421-0002",
    "x-trace-id": "trace_12bc91ad"
  },
  requestPayload: {
    model: "reasoning-pro",
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      { role: "system", content: "你是企业分析助手。" },
      { role: "user", content: "请输出本周利润与成本波动分析。" }
    ]
  },
  responsePayload: {
    id: "chatcmpl_admin_mock_001",
    object: "chat.completion",
    choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "已完成分析。" } }]
  },
  retryTimeline: [
    { step: "primary route", status: "provider_retry", time: "13:41:32.102" },
    { step: "same-provider retry", status: "recovered", time: "13:41:34.811" }
  ]
};

export const mockBilling: BillingSummary = {
  balanceUsd: 3812.42,
  frozenAmountUsd: 73.48,
  estimatedTodayCostUsd: 128.24,
  currentPlanName: "Growth 500K",
  includedQuotaText: "含 500,000 美元等值月度额度，超额按用量计费",
  nextInvoiceDate: "2026-05-01"
};

export const mockPlans: PlanCard[] = [
  {
    id: "starter",
    name: "Starter",
    priceUsdMonthly: 99,
    highlights: ["3 个项目", "基础日志保留", "标准支持"]
  },
  {
    id: "growth",
    name: "Growth",
    priceUsdMonthly: 399,
    recommended: true,
    highlights: ["20 个项目", "高级分析", "Webhook", "优先支持"]
  },
  {
    id: "scale",
    name: "Scale",
    priceUsdMonthly: 1499,
    highlights: ["企业路由", "专属 SLA", "发票与账期", "组织级配额控制"]
  }
];

export const mockSubscriptionOverview: SubscriptionOverview = {
  currentPlanName: "Growth 500K",
  contractType: "monthly",
  renewalDate: "2026-05-01",
  overagePolicy: "超出套餐额度后自动切换到按量计费",
  seatPolicy: "含 10 个成员席位，超出后按成员附加收费",
  entitlementSummary: ["500,000 美元等值月度额度", "优先工单支持", "高级用量分析", "Webhook 事件通知"]
};

export const mockTopUpPackages: TopUpPackage[] = [
  {
    id: "topup_100",
    label: "充值 $100",
    amountUsd: 100,
    bonusUsd: 0,
    description: "适合测试环境和小流量项目"
  },
  {
    id: "topup_500",
    label: "充值 $500",
    amountUsd: 500,
    bonusUsd: 20,
    recommended: true,
    description: "推荐给稳定生产环境，附加 $20 奖励余额"
  },
  {
    id: "topup_2000",
    label: "充值 $2,000",
    amountUsd: 2000,
    bonusUsd: 120,
    description: "适合月度集中采购和企业预存"
  }
];

export const mockInvoices: InvoiceRecord[] = [
  {
    id: "inv_001",
    invoiceNumber: "NS-2026-0401",
    status: "paid",
    amountUsd: 1824.64,
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    dueDate: "2026-04-07",
    issuedAt: "2026-04-01"
  },
  {
    id: "inv_002",
    invoiceNumber: "NS-2026-0415",
    status: "issued",
    amountUsd: 934.18,
    periodStart: "2026-04-01",
    periodEnd: "2026-04-15",
    dueDate: "2026-04-22",
    issuedAt: "2026-04-16"
  },
  {
    id: "inv_003",
    invoiceNumber: "NS-2026-0421",
    status: "draft",
    amountUsd: 418.07,
    periodStart: "2026-04-16",
    periodEnd: "2026-04-21",
    dueDate: "2026-04-28",
    issuedAt: "2026-04-21"
  }
];

export const mockInvoiceDetail: InvoiceDetail = {
  ...mockInvoices[1],
  billingEntityName: "彗星科技有限公司",
  taxId: "CN-TAX-91310000NSL",
  currency: "USD",
  lineItems: [
    { label: "Growth 500K 套餐", quantity: 1, unitPriceUsd: 399, amountUsd: 399 },
    { label: "超额按量计费", quantity: 1, unitPriceUsd: 515.18, amountUsd: 515.18 },
    { label: "附加成员席位", quantity: 2, unitPriceUsd: 10, amountUsd: 20 }
  ],
  notes: "企业账期 7 天，支持下载 PDF 与开票抬头变更。"
};

export const mockBills: BillRecord[] = [
  {
    id: "bill_001",
    billNumber: "BILL-2026-0401",
    status: "settled",
    amountUsd: 1824.64,
    usageAmountUsd: 1425.64,
    subscriptionAmountUsd: 399,
    adjustmentAmountUsd: 0,
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    dueDate: "2026-04-07"
  },
  {
    id: "bill_002",
    billNumber: "BILL-2026-0415",
    status: "open",
    amountUsd: 934.18,
    usageAmountUsd: 535.18,
    subscriptionAmountUsd: 399,
    adjustmentAmountUsd: 0,
    periodStart: "2026-04-01",
    periodEnd: "2026-04-15",
    dueDate: "2026-04-22"
  },
  {
    id: "bill_003",
    billNumber: "BILL-2026-0421",
    status: "partial",
    amountUsd: 418.07,
    usageAmountUsd: 418.07,
    subscriptionAmountUsd: 0,
    adjustmentAmountUsd: 0,
    periodStart: "2026-04-16",
    periodEnd: "2026-04-21",
    dueDate: "2026-04-28"
  }
];

export const mockBillDetail: BillDetail = {
  ...mockBills[1],
  currency: "USD",
  lineItems: [
    { label: "按量调用费用", amountUsd: 535.18, category: "usage" },
    { label: "Growth 500K 套餐", amountUsd: 399, category: "subscription" },
    { label: "人工调整", amountUsd: 0, category: "adjustment" }
  ],
  notes: "本账单包含 2026-04-01 至 2026-04-15 的用量聚合。"
};

export const mockModels: ModelCard[] = [
  {
    id: "chat-pro",
    publicName: "chat-pro",
    summary: "面向通用生产聊天与工具调用的主力模型。",
    contextWindow: "128K",
    modalities: ["text", "tools"],
    pricingText: "$2.8 / 1M input • $10 / 1M output",
    available: true
  },
  {
    id: "reasoning-pro",
    publicName: "reasoning-pro",
    summary: "适合复杂推理、规划与多步分析。",
    contextWindow: "256K",
    modalities: ["text", "reasoning"],
    pricingText: "$8 / 1M input • $24 / 1M output",
    available: true
  },
  {
    id: "vision-pro",
    publicName: "vision-pro",
    summary: "支持图像理解、OCR 与多模态问答。",
    contextWindow: "64K",
    modalities: ["vision", "text"],
    pricingText: "$12 / 1M input",
    available: true
  }
];

export const mockModelDetails: Record<string, ModelDetail> = {
  "chat-pro": {
    ...mockModels[0],
    maxOutputTokens: 16384,
    latencyTier: "standard",
    routeProfiles: ["chat-pro-global", "chat-pro-low-latency"],
    backingProviders: ["groq-primary-dev"],
    bestFor: ["通用生产聊天", "工具调用", "客服助手", "内部 Copilot"],
    limitations: ["不适合高精度长链推理", "图片输入需切换到多模态模型"],
    defaultTemperature: 0.4,
    streamingSupported: true
  },
  "reasoning-pro": {
    ...mockModels[1],
    maxOutputTokens: 32768,
    latencyTier: "priority",
    routeProfiles: ["reasoning-multi-route"],
    backingProviders: ["groq-primary-dev"],
    bestFor: ["复杂规划", "多步分析", "代码解释", "长文推理"],
    limitations: ["成本高于通用模型", "首 token 延迟更长"],
    defaultTemperature: 0.2,
    streamingSupported: true
  },
  "vision-pro": {
    ...mockModels[2],
    maxOutputTokens: 8192,
    latencyTier: "standard",
    routeProfiles: ["vision-default"],
    backingProviders: ["groq-primary-dev"],
    bestFor: ["OCR", "图片理解", "多模态问答"],
    limitations: ["长文本输出成本较高"],
    defaultTemperature: 0.3,
    streamingSupported: true
  }
};

export const mockProviders: ProviderHealth[] = [
  { providerCode: "groq-primary-dev", successRate: 99.42, p95LatencyMs: 1180, status: "healthy", avgCostUsdPer1k: 0.018 },
  { providerCode: "groq-secondary-dev", successRate: 97.11, p95LatencyMs: 2810, status: "degraded", avgCostUsdPer1k: 0.027 },
  { providerCode: "embedding-reserved", successRate: 0, p95LatencyMs: 0, status: "degraded", avgCostUsdPer1k: 0.006 }
];

export const mockRiskEvents: RiskEvent[] = [
  {
    id: "risk_001",
    title: "同一 Key 在异常地区高频调用",
    severity: "high",
    status: "investigating",
    createdAt: "10 分钟前",
    summary: "检测到 production-web 在两个国家同时发起高并发请求。"
  },
  {
    id: "risk_002",
    title: "组织消费接近日成本上限",
    severity: "medium",
    status: "open",
    createdAt: "42 分钟前",
    summary: "彗星科技今日消费已达到阈值的 84%。"
  }
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: "tm_001",
    displayName: "周宁",
    email: "zhou.ning@example.com",
    role: "org_admin",
    projectScope: ["Web App", "Insights"],
    status: "active",
    lastActiveAt: "5 分钟前"
  },
  {
    id: "tm_002",
    displayName: "许柯",
    email: "xu.ke@example.com",
    role: "finance",
    projectScope: ["Billing"],
    status: "active",
    lastActiveAt: "2 小时前"
  },
  {
    id: "tm_003",
    displayName: "王恬",
    email: "wang.tian@example.com",
    role: "member",
    projectScope: ["Web App"],
    status: "invited",
    lastActiveAt: "未激活"
  }
];

export const mockTeamInvitation: TeamInvitationResult = {
  id: "invite_001",
  email: "ops.partner@example.com",
  role: "project_admin",
  inviteStatus: "sent",
  projectScope: ["Partner Integrations", "Web App"]
};

export const mockTeamRoleUpdate: TeamRoleUpdateResult = {
  id: "tm_003",
  role: "project_admin",
  projectScope: ["Web App", "Partner Integrations"],
  status: "active"
};

export const mockWebhooks: WebhookRecord[] = [
  {
    id: "wh_001",
    name: "billing-alerts",
    endpoint: "https://hooks.example.com/billing",
    events: ["billing.low_balance", "invoice.created"],
    status: "active",
    retryPolicy: "指数退避，最多 8 次",
    lastDeliveryAt: "12 分钟前"
  },
  {
    id: "wh_002",
    name: "request-failures",
    endpoint: "https://hooks.example.com/ops",
    events: ["request.failed", "risk.event.opened"],
    status: "failing",
    retryPolicy: "固定间隔 30s，最多 5 次",
    lastDeliveryAt: "1 小时前"
  }
];

export const mockCreatedWebhook: CreatedWebhookResult = {
  id: "wh_003",
  name: "账单告警回调",
  endpoint: "https://hooks.example.com/billing-alerts",
  events: ["billing.invoice.overdue", "billing.balance.low"],
  signingSecret: "whsec_only_visible_once_dev_001",
  status: "active"
};

export const mockWebhookTest: WebhookTestResult = {
  deliveryId: "dlv_test_001",
  webhookId: "wh_003",
  event: "billing.balance.low",
  status: "delivered",
  latencyMs: 184
};

export const mockWebhookDeliveryDetail: WebhookDeliveryDetail = {
  deliveryId: "dlv_recent_009",
  webhookId: "wh_002",
  event: "request.failed",
  status: "retrying",
  latencyMs: 928,
  deliveredAt: "2026-04-21 15:08:11",
  responseCode: 502,
  attempts: 3,
  requestHeaders: {
    "x-webhook-id": "wh_002",
    "x-signature": "sha256=masked_signature",
    "content-type": "application/json"
  },
  requestBody: {
    event: "request.failed",
    trace_id: "trace_12bc91ad",
    project: "Web App",
    status: "failed"
  },
  responseBody: {
    message: "upstream temporarily unavailable"
  }
};

export const mockWebhookDeliveries: WebhookDeliveryRecord[] = [
  {
    deliveryId: "dlv_recent_009",
    webhookId: "wh_002",
    webhookName: "request-failures",
    event: "request.failed",
    status: "retrying",
    latencyMs: 928,
    attempts: 3,
    responseCode: 502,
    deliveredAt: "2026-04-21 15:08:11",
    traceId: "trace_12bc91ad"
  },
  {
    deliveryId: "dlv_recent_010",
    webhookId: "wh_001",
    webhookName: "billing-alerts",
    event: "invoice.created",
    status: "delivered",
    latencyMs: 183,
    attempts: 1,
    responseCode: 200,
    deliveredAt: "2026-04-21 14:41:03"
  },
  {
    deliveryId: "dlv_recent_011",
    webhookId: "wh_001",
    webhookName: "billing-alerts",
    event: "billing.balance.low",
    status: "failed",
    latencyMs: 1400,
    attempts: 5,
    responseCode: 500,
    deliveredAt: "2026-04-21 13:51:26"
  }
];

export const mockProjectSettings: ProjectSettings = {
  projectId: "proj_001",
  projectName: "Web App",
  environment: "production",
  defaultModel: "chat-pro",
  callbackUrl: "https://app.example.com/api/ai/webhook",
  monthlyBudgetUsd: 5000,
  allowedOrigins: ["https://app.example.com", "https://admin.example.com"],
  tags: ["production", "customer-facing", "web"]
};

export const mockSecuritySettings: SecuritySettings = {
  organizationId: "org_001",
  mfaRequired: true,
  sessionTimeoutMinutes: 120,
  ipAllowlist: ["203.0.113.10/32", "198.51.100.21/32"],
  webhookSignatureRequired: true,
  keyRotationDays: 90,
  lastSecurityReviewAt: "2026-04-18 10:00"
};

export const mockSupportTickets: SupportTicketRecord[] = [
  {
    id: "ticket_001",
    ticketNumber: "SUP-2026-101",
    subject: "本月超额计费明细需要核对",
    category: "billing",
    priority: "medium",
    status: "pending",
    createdAt: "2026-04-19 11:24",
    updatedAt: "2026-04-21 09:12",
    requesterName: "许柯"
  },
  {
    id: "ticket_002",
    ticketNumber: "SUP-2026-102",
    subject: "Playground 流式输出中断",
    category: "technical",
    priority: "high",
    status: "open",
    createdAt: "2026-04-20 16:08",
    updatedAt: "2026-04-21 13:05",
    requesterName: "周宁"
  },
  {
    id: "ticket_003",
    ticketNumber: "SUP-2026-103",
    subject: "希望增加 embedding-large 权限",
    category: "feature_request",
    priority: "low",
    status: "resolved",
    createdAt: "2026-04-17 09:43",
    updatedAt: "2026-04-18 14:30",
    requesterName: "王恬"
  }
];

export const mockSupportTicketDetail: SupportTicketDetail = {
  ...mockSupportTickets[1],
  description: "在高并发场景下，Playground 的流式输出在 6-8 秒后中断，希望排查是否为上游超时或 SSE 代理缓冲问题。",
  projectName: "Web App",
  traceId: "trace_12bc91ad",
  replies: [
    {
      id: "reply_001",
      authorName: "周宁",
      authorRole: "customer",
      content: "问题从昨天下午开始出现，复现概率较高。",
      createdAt: "2026-04-20 16:11"
    },
    {
      id: "reply_002",
      authorName: "平台支持",
      authorRole: "support",
      content: "我们已定位到一条异常 trace，正在核对 relay 到 new-api 的超时配置。",
      createdAt: "2026-04-21 10:04"
    }
  ]
};

export const mockAdminUsers: AdminUserRecord[] = [
  {
    id: "adm_usr_001",
    displayName: "林川",
    email: "linchuan@example.com",
    role: "platform_super_admin",
    orgName: "彗星科技",
    status: "active",
    mfaEnabled: true,
    lastActiveAt: "2 分钟前"
  },
  {
    id: "adm_usr_002",
    displayName: "周宁",
    email: "zhou.ning@example.com",
    role: "ops_admin",
    orgName: "彗星科技",
    status: "active",
    mfaEnabled: true,
    lastActiveAt: "18 分钟前"
  },
  {
    id: "adm_usr_003",
    displayName: "许柯",
    email: "xu.ke@example.com",
    role: "finance",
    orgName: "Helio Data",
    status: "invited",
    mfaEnabled: false,
    lastActiveAt: "未激活"
  },
  {
    id: "adm_usr_004",
    displayName: "赵朔",
    email: "zhao.shuo@example.com",
    role: "member",
    orgName: "Vector Forge",
    status: "suspended",
    mfaEnabled: false,
    lastActiveAt: "1 天前"
  }
];

export const mockOrganizations: OrganizationRecord[] = [
  {
    id: "org_001",
    name: "彗星科技",
    planName: "Growth 500K",
    memberCount: 18,
    activeProjects: 7,
    monthlySpendUsd: 18124.48,
    status: "active"
  },
  {
    id: "org_002",
    name: "Helio Data",
    planName: "Enterprise Credit",
    memberCount: 42,
    activeProjects: 12,
    monthlySpendUsd: 62112.22,
    status: "trial"
  },
  {
    id: "org_003",
    name: "Vector Forge",
    planName: "Starter",
    memberCount: 6,
    activeProjects: 2,
    monthlySpendUsd: 984.36,
    status: "restricted"
  }
];

export const mockPricingRules: PricingRuleRecord[] = [
  {
    id: "price_001",
    publicModel: "chat-pro",
    upstreamModel: "openai/gpt-oss-120b",
    providerCode: "groq-primary-dev",
    sellPricePer1kUsd: 0.0028,
    costPricePer1kUsd: 0.0018,
    grossMarginPercent: 35.71,
    status: "active"
  },
  {
    id: "price_002",
    publicModel: "reasoning-pro",
    upstreamModel: "openai/gpt-oss-120b",
    providerCode: "groq-primary-dev",
    sellPricePer1kUsd: 0.008,
    costPricePer1kUsd: 0.0055,
    grossMarginPercent: 31.25,
    status: "active"
  },
  {
    id: "price_003",
    publicModel: "embedding-large",
    upstreamModel: "pending-provider-model",
    providerCode: "embedding-reserved",
    sellPricePer1kUsd: 0.00062,
    costPricePer1kUsd: 0.00031,
    grossMarginPercent: 50,
    status: "draft"
  }
];

export const mockAuditLogs: AuditLogRecord[] = [
  {
    id: "audit_001",
    actor: "linchuan@example.com",
    action: "admin.user.suspend",
    resourceType: "user",
    resourceId: "adm_usr_004",
    result: "success",
    createdAt: "2026-04-21 15:02:08",
    traceId: "trace_admin_8be201"
  },
  {
    id: "audit_002",
    actor: "zhou.ning@example.com",
    action: "routing.profile.update",
    resourceType: "route_profile",
    resourceId: "chat-pro-global",
    result: "success",
    createdAt: "2026-04-21 14:48:11",
    traceId: "trace_admin_4fbc18"
  },
  {
    id: "audit_003",
    actor: "system",
    action: "risk.event.auto_open",
    resourceType: "risk_event",
    resourceId: "risk_001",
    result: "success",
    createdAt: "2026-04-21 14:31:53"
  }
];
