import { siteConfig } from "@/config/site";
import type { UserRole } from "@/types/shared";

const adminRoles: ReadonlySet<UserRole> = new Set(["platform_super_admin", "ops_admin"]);

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveBaseUrl(role: UserRole) {
  if (adminRoles.has(role)) {
    return trimTrailingSlash(siteConfig.adminConsoleUrl || "");
  }
  return trimTrailingSlash(siteConfig.customerConsoleUrl || "");
}

export function resolvePostLoginDestination(role: UserRole) {
  const path = adminRoles.has(role) ? siteConfig.adminBasePath : siteConfig.consoleBasePath;
  const baseUrl = resolveBaseUrl(role);
  return baseUrl ? `${baseUrl}${path}` : path;
}

