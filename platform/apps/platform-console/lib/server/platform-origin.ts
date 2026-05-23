import type { NextRequest } from "next/server";

const DEFAULT_TRUSTED_ORIGINS = [
  "http://127.0.0.1:3200",
  "http://localhost:3200",
  "http://127.0.0.1:8008",
  "http://localhost:8008"
];

export function resolveTrustedReturnTo(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 2048) {
    return null;
  }

  let target: URL;
  try {
    target = new URL(trimmed);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return null;
  }
  if (target.username || target.password) {
    return null;
  }
  if (!getTrustedOrigins().has(target.origin)) {
    return null;
  }

  return target.toString();
}

export function isTrustedDigitalLifeOrigin(value?: string | null) {
  const origin = normalizeOrigin(value);
  return Boolean(origin && getTrustedOrigins().has(origin));
}

export function credentialCorsHeadersForRequest(request: NextRequest, methods = "GET, OPTIONS") {
  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600"
  });
  const origin = normalizeOrigin(request.headers.get("origin"));
  if (origin && getTrustedOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return headers;
}

export function isTrustedRequestOrigin(request: NextRequest) {
  const origin = normalizeOrigin(request.headers.get("origin"));
  return !origin || getTrustedOrigins().has(origin);
}

function getTrustedOrigins() {
  const origins = new Set<string>();
  for (const value of DEFAULT_TRUSTED_ORIGINS) {
    addOrigin(origins, value);
  }
  addOrigin(origins, process.env.PLATFORM_CONSOLE_PUBLIC_URL);
  addOrigin(origins, process.env.DIGITAL_LIFE_PUBLIC_URL);
  addOrigin(origins, process.env.NEXT_PUBLIC_DIGITAL_LIFE_PUBLIC_URL);
  addOriginList(origins, process.env.PLATFORM_CONSOLE_ALLOWED_ORIGINS);
  addOriginList(origins, process.env.PLATFORM_CONSOLE_TRUSTED_RETURN_ORIGINS);
  return origins;
}

function addOriginList(origins: Set<string>, value?: string) {
  for (const item of (value ?? "").split(",")) {
    addOrigin(origins, item);
  }
}

function addOrigin(origins: Set<string>, value?: string) {
  const origin = normalizeOrigin(value);
  if (origin) {
    origins.add(origin);
  }
}

function normalizeOrigin(value?: string | null) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}
