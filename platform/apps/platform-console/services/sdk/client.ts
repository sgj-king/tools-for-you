import { ApiClientError } from "@/lib/api-client-error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8088";
const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, API_BASE_URL);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function readJsonPayload<T>(response: Response, path: string, label: string): Promise<T & ErrorEnvelope> {
  const text = await response.text();
  if (!text) {
    return {} as T & ErrorEnvelope;
  }

  try {
    return JSON.parse(text) as T & ErrorEnvelope;
  } catch {
    const preview = text.slice(0, 180);
    throw new ApiClientError(`${label} returned a non-JSON response for ${path}: ${preview}`, {
      status: response.status,
      code: "invalid_json_response",
      details: { preview }
    });
  }
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (ENABLE_MOCK) {
    throw new Error("mock mode should use mockApi directly");
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    credentials: "include",
    cache: "no-store"
  });

  const payload = await readJsonPayload<T>(response, path, "API");
  if (!response.ok) {
    throw new ApiClientError(payload.error?.message ?? `API request failed for ${path}`, {
      status: response.status,
      code: payload.error?.code,
      details: payload.error?.details
    });
  }

  return payload;
}

export async function apiFileClient(path: string, options: RequestOptions = {}) {
  if (ENABLE_MOCK) {
    throw new Error("mock mode should use mockApi directly");
  }
  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers: {
      ...(options.headers ?? {})
    },
    credentials: "include",
    cache: "no-store"
  });
  if (!response.ok) {
    let message = `API file request failed for ${path}`;
    try {
      const payload = (await response.json()) as { error?: { message?: string; code?: string; details?: Record<string, unknown> } };
      message = payload.error?.message ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiClientError(message, { status: response.status });
  }
  return response;
}

function buildPlatformPath(path: string, query?: RequestOptions["query"]) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function platformClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildPlatformPath(path, options.query), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    credentials: "include",
    cache: "no-store"
  });

  const payload = await readJsonPayload<T>(response, path, "Platform API");

  if (!response.ok) {
    throw new ApiClientError(payload.error?.message ?? `Platform API request failed for ${path}`, {
      status: response.status,
      code: payload.error?.code,
      details: payload.error?.details
    });
  }

  return payload;
}

export async function platformFileClient(path: string, options: RequestOptions = {}) {
  const response = await fetch(buildPlatformPath(path, options.query), {
    ...options,
    headers: {
      ...(options.headers ?? {})
    },
    credentials: "include",
    cache: "no-store"
  });
  if (!response.ok) {
    let message = `Platform API file request failed for ${path}`;
    try {
      const payload = (await response.json()) as { error?: { message?: string; code?: string; details?: Record<string, unknown> } };
      message = payload.error?.message ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiClientError(message, { status: response.status });
  }
  return response;
}
