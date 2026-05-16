import type { UserRole } from "@/types/shared";

const roleGrants: Record<UserRole, ReadonlySet<UserRole>> = {
  guest: new Set(["guest"]),
  member: new Set(["guest", "member"]),
  project_admin: new Set(["guest", "member", "project_admin"]),
  org_admin: new Set(["guest", "member", "project_admin", "org_admin"]),
  finance: new Set(["guest", "member", "finance"]),
  ops_admin: new Set(["guest", "member", "project_admin", "org_admin", "finance", "ops_admin"]),
  platform_super_admin: new Set(["guest", "member", "project_admin", "org_admin", "finance", "ops_admin", "platform_super_admin"])
};

export function hasRole(currentRole: UserRole, required: UserRole) {
  return roleGrants[currentRole]?.has(required) ?? false;
}
