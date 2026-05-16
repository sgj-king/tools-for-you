export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, options?: { status?: number; code?: string; details?: Record<string, unknown> }) {
    super(message);
    this.name = "ApiClientError";
    this.status = options?.status ?? 500;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiClientError)) {
    return {};
  }

  const fieldErrors = error.details?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0)
  );
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError && error.message) {
    return error.message;
  }
  return fallback;
}
