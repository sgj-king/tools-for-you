import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import type {
  BillDetail,
  BillRecord,
  ProjectSettings,
  RequestLogDetail,
  RequestLogRecord,
  SecuritySettings,
  SupportTicketDetail,
  SupportTicketRecord,
  WebhookDeliveryDetail,
  WebhookDeliveryRecord
} from "@/types/domain";
import { dbExecute, dbQuery } from "@/lib/server/db";

const DEFAULT_PROJECT_ID = 2001;
const DEFAULT_ORG_ID = 1001;

const jsonObjectSchema = z.record(z.any()).catch({});

function parseJsonValue(value: unknown) {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      return jsonObjectSchema.parse(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return {};
}

function iso(value: Date | string | null | undefined) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace("T", " ");
  }
  return String(value);
}

function monthToken(dateValue: Date | string) {
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}${month}`;
}

function decodeBillMonth(billId: string) {
  const match = /^bill_(\d{4})(\d{2})$/.exec(billId);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export const projectSettingsSchema = z.object({
  projectName: z.string().trim().min(2, "项目名称至少 2 个字符").max(128, "项目名称不能超过 128 个字符"),
  environment: z.enum(["production", "staging", "development"]),
  defaultModel: z.string().trim().min(2, "默认模型不能为空").max(64, "默认模型不能超过 64 个字符"),
  callbackUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^https?:\/\//.test(value), "回调地址必须以 http:// 或 https:// 开头"),
  monthlyBudgetUsd: z.coerce.number().min(0, "月预算不能小于 0").max(1_000_000, "月预算超出允许范围"),
  allowedOrigins: z.array(z.string().trim().min(1)).max(20, "允许来源不能超过 20 条"),
  tags: z.array(z.string().trim().min(1)).max(20, "标签不能超过 20 条")
});

export const securitySettingsSchema = z.object({
  mfaRequired: z.boolean(),
  sessionTimeoutMinutes: z.coerce.number().int().min(15, "会话超时不能低于 15 分钟").max(1440, "会话超时不能超过 1440 分钟"),
  ipAllowlist: z
    .array(z.string().trim())
    .max(20, "IP 白名单不能超过 20 条")
    .refine((items) => items.every((item) => !item || /^[0-9a-fA-F:.\/]+$/.test(item)), "IP 白名单格式不正确"),
  webhookSignatureRequired: z.boolean(),
  keyRotationDays: z.coerce.number().int().min(1, "Key 轮换周期至少 1 天").max(365, "Key 轮换周期不能超过 365 天")
});

export const supportReplySchema = z.object({
  content: z.string().trim().min(2, "回复内容至少 2 个字符").max(4000, "回复内容不能超过 4000 个字符")
});

function zodFieldErrors(error: z.ZodError) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors)
      .map(([key, messages]) => [key, messages?.[0]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0)
  );
}

let tablesEnsured = false;

export async function ensureConsoleTables() {
  if (tablesEnsured) return;

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(64) NOT NULL,
      ticket_number VARCHAR(64) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      category VARCHAR(32) NOT NULL,
      priority VARCHAR(16) NOT NULL,
      status VARCHAR(16) NOT NULL,
      requester_name VARCHAR(128) NOT NULL,
      description TEXT NOT NULL,
      project_name VARCHAR(128) NULL,
      trace_id VARCHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_support_ticket_number (ticket_number),
      KEY idx_support_tickets_trace_id (trace_id),
      KEY idx_support_tickets_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS support_ticket_replies (
      id VARCHAR(64) NOT NULL,
      ticket_id VARCHAR(64) NOT NULL,
      author_name VARCHAR(128) NOT NULL,
      author_role VARCHAR(16) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_support_ticket_replies_ticket_id (ticket_id),
      CONSTRAINT fk_support_ticket_replies_ticket_id FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      delivery_id VARCHAR(96) NOT NULL,
      webhook_id VARCHAR(64) NOT NULL,
      webhook_name VARCHAR(128) NOT NULL,
      event_name VARCHAR(128) NOT NULL,
      status VARCHAR(16) NOT NULL,
      latency_ms INT NOT NULL DEFAULT 0,
      attempts INT NOT NULL DEFAULT 1,
      response_code INT NOT NULL DEFAULT 200,
      delivered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      trace_id VARCHAR(64) NULL,
      request_headers_json LONGTEXT NULL,
      request_body_json LONGTEXT NULL,
      response_body_json LONGTEXT NULL,
      PRIMARY KEY (delivery_id),
      KEY idx_webhook_deliveries_trace_id (trace_id),
      KEY idx_webhook_deliveries_delivered_at (delivered_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  tablesEnsured = true;
  await seedConsoleTables();
}

async function seedConsoleTables() {
  const supportCountRows = await dbQuery<Array<RowDataPacket & { count: number }>>("SELECT COUNT(*) AS count FROM support_tickets");
  if (Number(supportCountRows[0]?.count ?? 0) === 0) {
    const traceRows = await dbQuery<Array<RowDataPacket & { trace_id: string | null; request_id: string; external_model_name: string; started_at: Date }>>(
      `SELECT trace_id, request_id, external_model_name, started_at
       FROM usage_records
       ORDER BY started_at DESC
       LIMIT 2`
    );

    const seeds = traceRows.length
      ? traceRows.map((row, index) => ({
          id: `ticket_seed_${index + 1}`,
          ticketNumber: `TCK-${new Date().getUTCFullYear()}-${String(index + 1).padStart(4, "0")}`,
          subject: `关于 ${row.external_model_name} 调用链路的排查`,
          category: index === 0 ? "technical" : "billing",
          priority: index === 0 ? "high" : "medium",
          status: index === 0 ? "open" : "pending",
          requesterName: "Demo Owner",
          description: `请协助确认 request_id=${row.request_id} 的调用情况，并核对 trace 对应的费用与状态。`,
          projectName: "demo-project",
          traceId: row.trace_id,
          createdAt: iso(row.started_at),
          updatedAt: iso(row.started_at)
        }))
      : [
          {
            id: "ticket_seed_1",
            ticketNumber: `TCK-${new Date().getUTCFullYear()}-0001`,
            subject: "开发环境支持工单示例",
            category: "technical",
            priority: "medium",
            status: "open",
            requesterName: "Demo Owner",
            description: "这是一条开发环境示例工单，用于联调支持中心详情与回复流程。",
            projectName: "demo-project",
            traceId: null,
            createdAt: iso(new Date()),
            updatedAt: iso(new Date())
          }
        ];

    for (const seed of seeds) {
      await dbExecute(
        `INSERT IGNORE INTO support_tickets
          (id, ticket_number, subject, category, priority, status, requester_name, description, project_name, trace_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          seed.id,
          seed.ticketNumber,
          seed.subject,
          seed.category,
          seed.priority,
          seed.status,
          seed.requesterName,
          seed.description,
          seed.projectName,
          seed.traceId,
          seed.createdAt,
          seed.updatedAt
        ]
      );

      await dbExecute(
        `INSERT INTO support_ticket_replies (id, ticket_id, author_name, author_role, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), seed.id, "Support Bot", "support", "已收到工单，我们正在结合 trace_id 进行排查。", seed.createdAt]
      );
    }
  }

  const traceRows = await dbQuery<
    Array<
      RowDataPacket & {
        request_id: string;
        trace_id: string | null;
        edge_status_code: number;
        latency_ms: number;
        error_code: string | null;
        created_at: Date;
      }
    >
  >(
    `SELECT request_id, trace_id, edge_status_code, latency_ms, error_code, created_at
     FROM request_traces
     ORDER BY created_at DESC
     LIMIT 20`
  );

  for (const row of traceRows) {
    const deliveryId = `del_${row.request_id}`;
    const existingRows = await dbQuery<Array<RowDataPacket & { count: number }>>("SELECT COUNT(*) AS count FROM webhook_deliveries WHERE delivery_id = ?", [deliveryId]);
    if (Number(existingRows[0]?.count ?? 0) > 0) {
      continue;
    }

    const requestBody = JSON.stringify({
      event: "request.trace.recorded",
      trace_id: row.trace_id,
      request_id: row.request_id
    });
    const responseBody = JSON.stringify({
      accepted: !row.error_code,
      edge_status_code: row.edge_status_code,
      error_code: row.error_code
    });

    await dbExecute(
      `INSERT INTO webhook_deliveries
        (delivery_id, webhook_id, webhook_name, event_name, status, latency_ms, attempts, response_code, delivered_at, trace_id, request_headers_json, request_body_json, response_body_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deliveryId,
        "wh_trace_bridge",
        "Trace Delivery Bridge",
        "request.trace.recorded",
        row.error_code ? "failed" : "delivered",
        row.latency_ms,
        1,
        row.edge_status_code || 200,
        iso(row.created_at),
        row.trace_id,
        JSON.stringify({ "content-type": "application/json" }),
        requestBody,
        responseBody
      ]
    );
  }
}

type ProjectRow = RowDataPacket & {
  id: number;
  name: string;
  env: string;
  monthly_cost_cap: number;
  metadata: string | null;
};

type OrgRow = RowDataPacket & {
  id: number;
  metadata: string | null;
  updated_at: Date;
};

export async function getProjectSettings(): Promise<ProjectSettings | null> {
  const rows = await dbQuery<ProjectRow[]>(
    `SELECT id, name, env, monthly_cost_cap, metadata
     FROM projects
     WHERE id = ?
     LIMIT 1`,
    [DEFAULT_PROJECT_ID]
  );
  const project = rows[0];
  if (!project) return null;

  const metadata = parseJsonValue(project.metadata);
  const consoleSettings = parseJsonValue(metadata["console_settings"]);

  return {
    projectId: String(project.id),
    projectName: project.name,
    environment: project.env === "prod" ? "production" : project.env === "staging" ? "staging" : "development",
    defaultModel: String(consoleSettings.defaultModel ?? "chat-pro"),
    callbackUrl: typeof consoleSettings.callbackUrl === "string" ? consoleSettings.callbackUrl : undefined,
    monthlyBudgetUsd: Number(consoleSettings.monthlyBudgetUsd ?? project.monthly_cost_cap ?? 0),
    allowedOrigins: Array.isArray(consoleSettings.allowedOrigins) ? consoleSettings.allowedOrigins.map(String) : [],
    tags: Array.isArray(consoleSettings.tags) ? consoleSettings.tags.map(String) : []
  };
}

export async function updateProjectSettings(input: z.infer<typeof projectSettingsSchema>) {
  const currentRows = await dbQuery<ProjectRow[]>("SELECT id, metadata FROM projects WHERE id = ? LIMIT 1", [DEFAULT_PROJECT_ID]);
  const current = currentRows[0];
  if (!current) return null;

  const currentMetadata = parseJsonValue(current.metadata);
  const nextMetadata = {
    ...currentMetadata,
    console_settings: {
      defaultModel: input.defaultModel,
      callbackUrl: input.callbackUrl,
      monthlyBudgetUsd: input.monthlyBudgetUsd,
      allowedOrigins: input.allowedOrigins,
      tags: input.tags
    }
  };

  await dbExecute(
    `UPDATE projects
     SET name = ?, env = ?, monthly_cost_cap = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.projectName, input.environment === "production" ? "prod" : input.environment, input.monthlyBudgetUsd, JSON.stringify(nextMetadata), DEFAULT_PROJECT_ID]
  );

  return getProjectSettings();
}

export async function getSecuritySettings(): Promise<SecuritySettings | null> {
  const rows = await dbQuery<OrgRow[]>(
    `SELECT id, metadata, updated_at
     FROM organizations
     WHERE id = ?
     LIMIT 1`,
    [DEFAULT_ORG_ID]
  );
  const org = rows[0];
  if (!org) return null;

  const metadata = parseJsonValue(org.metadata);
  const security = parseJsonValue(metadata["security_settings"]);

  return {
    organizationId: String(org.id),
    mfaRequired: Boolean(security.mfaRequired ?? false),
    sessionTimeoutMinutes: Number(security.sessionTimeoutMinutes ?? 120),
    ipAllowlist: Array.isArray(security.ipAllowlist) ? security.ipAllowlist.map(String) : [],
    webhookSignatureRequired: Boolean(security.webhookSignatureRequired ?? true),
    keyRotationDays: Number(security.keyRotationDays ?? 90),
    lastSecurityReviewAt: String(security.lastSecurityReviewAt ?? iso(org.updated_at))
  };
}

export async function updateSecuritySettings(input: z.infer<typeof securitySettingsSchema>) {
  const currentRows = await dbQuery<OrgRow[]>("SELECT id, metadata FROM organizations WHERE id = ? LIMIT 1", [DEFAULT_ORG_ID]);
  const current = currentRows[0];
  if (!current) return null;

  const currentMetadata = parseJsonValue(current.metadata);
  const nextMetadata = {
    ...currentMetadata,
    security_settings: {
      ...input,
      lastSecurityReviewAt: iso(new Date())
    }
  };

  await dbExecute(
    `UPDATE organizations
     SET metadata = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [JSON.stringify(nextMetadata), DEFAULT_ORG_ID]
  );

  return getSecuritySettings();
}

type RequestLogRow = RowDataPacket & {
  request_id: string;
  trace_id: string | null;
  external_model_name: string;
  internal_model_profile: string;
  provider_code: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  sale_amount: number;
  started_at: Date;
  finished_at: Date | null;
  project_name: string;
  api_key_name: string;
  edge_status_code: number;
  provider_status_code: number | null;
  latency_ms: number;
  error_code: string | null;
  error_message_masked: string | null;
  route_snapshot_json: string | null;
};

function mapRequestStatus(row: Pick<RequestLogRow, "error_code" | "edge_status_code">): RequestLogRecord["requestStatus"] {
  if (row.error_code) return "failed";
  if (row.edge_status_code === 429) return "rate_limited";
  return "success";
}

function mapRequestLog(row: RequestLogRow): RequestLogRecord {
  return {
    id: row.request_id,
    traceId: row.trace_id ?? row.request_id,
    requestStatus: mapRequestStatus(row),
    retryStatus: "none",
    projectName: row.project_name,
    apiKeyName: row.api_key_name,
    modelName: row.external_model_name,
    providerCode: row.provider_code,
    routeProfileCode: row.internal_model_profile,
    totalTokens: Number(row.input_tokens) + Number(row.output_tokens),
    actualCostUsd: Number(row.sale_amount),
    latencyMs: Number(row.latency_ms),
    cacheHit: Number(row.cache_read_tokens) > 0,
    createdAt: iso(row.started_at)
  };
}

export async function listRequestLogs(traceId?: string) {
  const params: Array<string | number | boolean | null | Date> = [];
  let whereClause = "";

  if (traceId) {
    whereClause = "WHERE ur.trace_id = ? OR ur.request_id = ?";
    params.push(traceId, traceId);
  }

  const rows = await dbQuery<RequestLogRow[]>(
    `SELECT
       ur.request_id,
       ur.trace_id,
       ur.external_model_name,
       ur.internal_model_profile,
       ur.provider_code,
       ur.input_tokens,
       ur.output_tokens,
       ur.cache_read_tokens,
       ur.sale_amount,
       ur.started_at,
       ur.finished_at,
       p.name AS project_name,
       ak.name AS api_key_name,
       rt.edge_status_code,
       rt.provider_status_code,
       rt.latency_ms,
       rt.error_code,
       rt.error_message_masked,
       rt.route_snapshot_json
     FROM usage_records ur
     LEFT JOIN projects p ON p.id = ur.project_id
     LEFT JOIN api_keys ak ON ak.id = ur.api_key_id
     LEFT JOIN request_traces rt ON rt.request_id = ur.request_id
     ${whereClause}
     ORDER BY ur.started_at DESC
     LIMIT 100`,
    params
  );

  return rows.map(mapRequestLog);
}

export async function getRequestLogDetail(traceId: string): Promise<RequestLogDetail | null> {
  const rows = await dbQuery<RequestLogRow[]>(
    `SELECT
       ur.request_id,
       ur.trace_id,
       ur.external_model_name,
       ur.internal_model_profile,
       ur.provider_code,
       ur.input_tokens,
       ur.output_tokens,
       ur.cache_read_tokens,
       ur.sale_amount,
       ur.started_at,
       ur.finished_at,
       p.name AS project_name,
       ak.name AS api_key_name,
       rt.edge_status_code,
       rt.provider_status_code,
       rt.latency_ms,
       rt.error_code,
       rt.error_message_masked,
       rt.route_snapshot_json
     FROM usage_records ur
     LEFT JOIN projects p ON p.id = ur.project_id
     LEFT JOIN api_keys ak ON ak.id = ur.api_key_id
     LEFT JOIN request_traces rt ON rt.request_id = ur.request_id
     WHERE ur.trace_id = ? OR ur.request_id = ?
     LIMIT 1`,
    [traceId, traceId]
  );

  const row = rows[0];
  if (!row) return null;

  const base = mapRequestLog(row);
  const routeSnapshot = parseJsonValue(row.route_snapshot_json);

  return {
    ...base,
    requestId: row.request_id,
    inputTokens: Number(row.input_tokens),
    outputTokens: Number(row.output_tokens),
    estimatedCostUsd: Number(row.sale_amount),
    headers: {
      "x-request-id": row.request_id,
      "x-trace-id": row.trace_id ?? row.request_id
    },
    requestPayload: {
      model: row.external_model_name,
      route_profile: row.internal_model_profile,
      provider: row.provider_code,
      trace_id: row.trace_id,
      request_id: row.request_id,
      route_snapshot: routeSnapshot
    },
    responsePayload: {
      edge_status_code: row.edge_status_code,
      provider_status_code: row.provider_status_code,
      error_code: row.error_code,
      error_message: row.error_message_masked
    },
    retryTimeline: [
      {
        step: "gateway.finalize",
        status: row.error_code ? "failed" : "success",
        time: iso(row.finished_at ?? row.started_at)
      }
    ]
  };
}

type UsageGroupRow = RowDataPacket & {
  month_key: string;
  period_start: Date;
  period_end: Date;
  usage_amount_usd: number;
};

export async function listBills(): Promise<BillRecord[]> {
  const rows = await dbQuery<UsageGroupRow[]>(
    `SELECT
       DATE_FORMAT(started_at, '%Y%m') AS month_key,
       MIN(started_at) AS period_start,
       MAX(started_at) AS period_end,
       SUM(sale_amount) AS usage_amount_usd
     FROM usage_records
     GROUP BY DATE_FORMAT(started_at, '%Y%m')
     ORDER BY month_key DESC
     LIMIT 12`
  );

  return rows.map((row) => ({
    id: `bill_${row.month_key}`,
    billNumber: `BILL-${row.month_key}`,
    status: "open",
    amountUsd: Number(row.usage_amount_usd),
    usageAmountUsd: Number(row.usage_amount_usd),
    subscriptionAmountUsd: 0,
    adjustmentAmountUsd: 0,
    periodStart: iso(row.period_start).slice(0, 10),
    periodEnd: iso(row.period_end).slice(0, 10),
    dueDate: iso(new Date(new Date(row.period_end).getTime() + 7 * 24 * 60 * 60 * 1000)).slice(0, 10)
  }));
}

type BillLineRow = RowDataPacket & {
  external_model_name: string;
  amount_usd: number;
  period_start: Date;
  period_end: Date;
};

export async function getBillDetail(billId: string): Promise<BillDetail | null> {
  const target = decodeBillMonth(billId);
  if (!target) return null;

  const rows = await dbQuery<BillLineRow[]>(
    `SELECT
       external_model_name,
       SUM(sale_amount) AS amount_usd,
       MIN(started_at) AS period_start,
       MAX(started_at) AS period_end
     FROM usage_records
     WHERE YEAR(started_at) = ? AND MONTH(started_at) = ?
     GROUP BY external_model_name
     ORDER BY amount_usd DESC`,
    [target.year, target.month]
  );

  if (!rows.length) return null;

  const usageAmountUsd = rows.reduce((sum, row) => sum + Number(row.amount_usd), 0);
  const periodStart = iso(rows[0].period_start).slice(0, 10);
  const periodEnd = iso(rows[0].period_end).slice(0, 10);

  return {
    id: billId,
    billNumber: `BILL-${target.year}${String(target.month).padStart(2, "0")}`,
    status: "open",
    amountUsd: usageAmountUsd,
    usageAmountUsd,
    subscriptionAmountUsd: 0,
    adjustmentAmountUsd: 0,
    periodStart,
    periodEnd,
    dueDate: iso(new Date(new Date(rows[0].period_end).getTime() + 7 * 24 * 60 * 60 * 1000)).slice(0, 10),
    currency: "USD",
    lineItems: rows.map((row) => ({
      label: `${row.external_model_name} 用量`,
      amountUsd: Number(row.amount_usd),
      category: "usage" as const
    })),
    notes: "当前开发环境账单明细由 usage_records 实时聚合生成。"
  };
}

type SupportTicketRow = RowDataPacket & {
  id: string;
  ticket_number: string;
  subject: string;
  category: SupportTicketRecord["category"];
  priority: SupportTicketRecord["priority"];
  status: SupportTicketRecord["status"];
  requester_name: string;
  description: string;
  project_name: string | null;
  trace_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function listSupportTickets(): Promise<SupportTicketRecord[]> {
  await ensureConsoleTables();
  const rows = await dbQuery<SupportTicketRow[]>(
    `SELECT id, ticket_number, subject, category, priority, status, requester_name, description, project_name, trace_id, created_at, updated_at
     FROM support_tickets
     ORDER BY updated_at DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    ticketNumber: row.ticket_number,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: row.status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    requesterName: row.requester_name
  }));
}

type SupportReplyRow = RowDataPacket & {
  id: string;
  ticket_id: string;
  author_name: string;
  author_role: "customer" | "support" | "system";
  content: string;
  created_at: Date;
};

export async function getSupportTicketDetail(ticketId: string): Promise<SupportTicketDetail | null> {
  await ensureConsoleTables();
  const rows = await dbQuery<SupportTicketRow[]>(
    `SELECT id, ticket_number, subject, category, priority, status, requester_name, description, project_name, trace_id, created_at, updated_at
     FROM support_tickets
     WHERE id = ?
     LIMIT 1`,
    [ticketId]
  );
  const ticket = rows[0];
  if (!ticket) return null;

  const replies = await dbQuery<SupportReplyRow[]>(
    `SELECT id, ticket_id, author_name, author_role, content, created_at
     FROM support_ticket_replies
     WHERE ticket_id = ?
     ORDER BY created_at ASC`,
    [ticketId]
  );

  return {
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: iso(ticket.created_at),
    updatedAt: iso(ticket.updated_at),
    requesterName: ticket.requester_name,
    description: ticket.description,
    projectName: ticket.project_name ?? undefined,
    traceId: ticket.trace_id ?? undefined,
    replies: replies.map((reply) => ({
      id: reply.id,
      authorName: reply.author_name,
      authorRole: reply.author_role,
      content: reply.content,
      createdAt: iso(reply.created_at)
    }))
  };
}

export async function replySupportTicket(ticketId: string, content: string) {
  await ensureConsoleTables();
  await dbExecute(
    `INSERT INTO support_ticket_replies (id, ticket_id, author_name, author_role, content, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [randomUUID(), ticketId, "Support Operator", "support", content]
  );
  await dbExecute(
    `UPDATE support_tickets
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    ["pending", ticketId]
  );

  return getSupportTicketDetail(ticketId);
}

type WebhookDeliveryRow = RowDataPacket & {
  delivery_id: string;
  webhook_id: string;
  webhook_name: string;
  event_name: string;
  status: WebhookDeliveryRecord["status"];
  latency_ms: number;
  attempts: number;
  response_code: number;
  delivered_at: Date;
  trace_id: string | null;
  request_headers_json: string | null;
  request_body_json: string | null;
  response_body_json: string | null;
};

export async function listWebhookDeliveries(): Promise<WebhookDeliveryRecord[]> {
  await ensureConsoleTables();
  const rows = await dbQuery<WebhookDeliveryRow[]>(
    `SELECT delivery_id, webhook_id, webhook_name, event_name, status, latency_ms, attempts, response_code, delivered_at, trace_id,
            request_headers_json, request_body_json, response_body_json
     FROM webhook_deliveries
     ORDER BY delivered_at DESC
     LIMIT 50`
  );

  return rows.map((row) => ({
    deliveryId: row.delivery_id,
    webhookId: row.webhook_id,
    webhookName: row.webhook_name,
    event: row.event_name,
    status: row.status,
    latencyMs: Number(row.latency_ms),
    attempts: Number(row.attempts),
    responseCode: Number(row.response_code),
    deliveredAt: iso(row.delivered_at),
    traceId: row.trace_id ?? undefined
  }));
}

export async function getWebhookDeliveryDetail(deliveryId: string): Promise<WebhookDeliveryDetail | null> {
  await ensureConsoleTables();
  const rows = await dbQuery<WebhookDeliveryRow[]>(
    `SELECT delivery_id, webhook_id, webhook_name, event_name, status, latency_ms, attempts, response_code, delivered_at, trace_id,
            request_headers_json, request_body_json, response_body_json
     FROM webhook_deliveries
     WHERE delivery_id = ?
     LIMIT 1`,
    [deliveryId]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    deliveryId: row.delivery_id,
    webhookId: row.webhook_id,
    event: row.event_name,
    status: row.status,
    latencyMs: Number(row.latency_ms),
    deliveredAt: iso(row.delivered_at),
    responseCode: Number(row.response_code),
    attempts: Number(row.attempts),
    requestHeaders: parseJsonValue(row.request_headers_json),
    requestBody: parseJsonValue(row.request_body_json),
    responseBody: parseJsonValue(row.response_body_json)
  };
}

export { zodFieldErrors };
