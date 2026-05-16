export type RequestMeta = {
  requestId: string;
  traceId?: string;
  page?: number;
  pageSize?: number;
  total?: number;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: RequestMeta;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type UserRole =
  | "guest"
  | "member"
  | "project_admin"
  | "org_admin"
  | "finance"
  | "platform_super_admin"
  | "ops_admin";

export type StatusTone = "default" | "success" | "warning" | "danger" | "info" | "muted";
