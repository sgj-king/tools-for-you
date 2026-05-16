import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { dbExecute, dbQuery, dbTransaction } from "@/lib/server/db";
import type { SessionUser } from "@/types/domain";
import type { UserRole } from "@/types/shared";

const SESSION_COOKIE_NAME = "platform_console_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEV_PLACEHOLDER_PASSWORD = process.env.PLATFORM_DEV_LOGIN_PASSWORD ?? "dev-password";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  display_name: string;
  password_hash: string;
  status: string;
  organization_id: number | null;
  org_name: string | null;
  owner_user_id: number | null;
};

type TeamMemberRoleRow = RowDataPacket & {
  role: string;
  status: string;
};

type UserProfileRow = RowDataPacket & {
  user_id: number;
  avatar_url: string | null;
};

type SessionPayload = {
  userId: string;
  email: string;
  displayName: string;
  orgName: string;
  role: UserRole;
  avatarUrl?: string;
  exp: number;
};

let authTablesEnsured = false;

export async function ensureAuthTables() {
  if (authTablesEnsured) return;
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS console_user_profiles (
      user_id BIGINT UNSIGNED NOT NULL,
      avatar_url LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS team_members (
      id VARCHAR(64) NOT NULL,
      display_name VARCHAR(128) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      project_scope_json LONGTEXT NOT NULL,
      status VARCHAR(16) NOT NULL,
      last_active_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_team_members_email (email),
      KEY idx_team_members_role_status (role, status),
      KEY idx_team_members_status_updated (status, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  authTablesEnsured = true;
}

export function sessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge
  };
}

export async function authenticateUser(email: string, password: string) {
  await ensureAuthTables();

  const normalizedEmail = email.trim().toLowerCase();
  const rows = await dbQuery<UserRow[]>(
    `SELECT
       u.id,
       u.email,
       u.display_name,
       u.password_hash,
       u.status,
       u.organization_id,
       o.name AS org_name,
       o.owner_user_id
     FROM users u
     LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.email = ?
     LIMIT 1`,
    [normalizedEmail]
  );
  const user = rows[0];
  if (!user || user.status !== "active") {
    return null;
  }

  const passwordMatched = verifyPassword(password, user.password_hash);
  if (!passwordMatched) {
    return null;
  }

  await dbExecute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);
  return buildSessionUser(user);
}

export async function registerUser(input: {
  adminName: string;
  email: string;
  organizationName: string;
  password: string;
}) {
  await ensureAuthTables();

  const email = input.email.trim().toLowerCase();
  const adminName = input.adminName.trim();
  const organizationName = input.organizationName.trim();

  const existing = await dbQuery<Array<RowDataPacket & { id: number }>>("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (existing[0]) {
    throw new Error("email_already_exists");
  }

  const passwordHash = hashPassword(input.password);
  const orgSlug = await buildUniqueOrganizationSlug(organizationName);

  return dbTransaction(async (connection) => {
    const [orgInsert] = await connection.execute<ResultSetHeader>(
      `INSERT INTO organizations (name, slug, status, owner_user_id, billing_type, credit_limit, currency, metadata)
       VALUES (?, ?, 'active', NULL, 'prepaid', 0, 'USD', JSON_OBJECT())`,
      [organizationName, orgSlug]
    );
    const organizationId = Number(orgInsert.insertId);

    const [userInsert] = await connection.execute<ResultSetHeader>(
      `INSERT INTO users (organization_id, email, password_hash, status, display_name, mfa_enabled)
       VALUES (?, ?, ?, 'active', ?, 0)`,
      [organizationId, email, passwordHash, adminName]
    );
    const userId = Number(userInsert.insertId);

    await connection.execute("UPDATE organizations SET owner_user_id = ? WHERE id = ?", [userId, organizationId]);
    await connection.execute(
      `INSERT INTO team_members (id, display_name, email, role, project_scope_json, status, last_active_at, created_at, updated_at)
       VALUES (?, ?, ?, 'org_admin', '[]', 'active', NOW(), NOW(), NOW())`,
      [`tm_${randomUUID()}`, adminName, email]
    );

    return {
      organizationId: String(organizationId),
      organizationName
    };
  });
}

export async function getSessionUserFromRequest(request: NextRequest): Promise<SessionUser | null> {
  await ensureAuthTables();

  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = decodeSession(raw);
  if (!payload) {
    return null;
  }

  const rows = await dbQuery<UserRow[]>(
    `SELECT
       u.id,
       u.email,
       u.display_name,
       u.password_hash,
       u.status,
       u.organization_id,
       o.name AS org_name,
       o.owner_user_id
     FROM users u
     LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = ?
     LIMIT 1`,
    [Number(payload.userId)]
  );
  const user = rows[0];
  if (!user || user.status !== "active") {
    return null;
  }

  const legacyAvatarUrl = payload.avatarUrl && payload.avatarUrl.length < 2048 ? payload.avatarUrl : undefined;
  return buildSessionUser(user, legacyAvatarUrl);
}

export async function updateSessionUserProfile(
  request: NextRequest,
  payload: { displayName?: string; avatarUrl?: string | null }
) {
  await ensureAuthTables();
  const session = await getSessionUserFromRequest(request);
  if (!session) {
    return null;
  }

  const nextName = payload.displayName?.trim();
  if (nextName) {
    await dbExecute("UPDATE users SET display_name = ? WHERE id = ?", [nextName, Number(session.id)]);
    session.displayName = nextName;
  }

  if (payload.avatarUrl !== undefined) {
    await dbExecute(
      `INSERT INTO console_user_profiles (user_id, avatar_url)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE avatar_url = VALUES(avatar_url), updated_at = CURRENT_TIMESTAMP`,
      [Number(session.id), payload.avatarUrl]
    );
    session.avatarUrl = payload.avatarUrl ?? undefined;
  }

  return session;
}

export function encodeSession(user: SessionUser) {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    orgName: user.orgName,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  return signPayload(payload);
}

export function sessionHeadersFromUser(user: SessionUser) {
  return {
    "x-session-user-id": encodeSessionHeaderValue(user.id),
    "x-session-user-email": encodeSessionHeaderValue(user.email),
    "x-session-user-name": encodeSessionHeaderValue(user.displayName),
    "x-session-org-name": encodeSessionHeaderValue(user.orgName),
    "x-session-user-role": encodeSessionHeaderValue(user.role)
  };
}

function encodeSessionHeaderValue(value: string) {
  return encodeURIComponent(value);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password: string, stored: string) {
  const normalized = stored.trim();
  if (!normalized) return false;

  if (normalized.startsWith("scrypt$")) {
    const parts = normalized.split("$");
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    const actual = scryptSync(password, salt, 32);
    const expected = Buffer.from(hash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  if (normalized.includes("demo.hash.placeholder")) {
    if (isProductionLike()) {
      return false;
    }
    return password.trim() === DEV_PLACEHOLDER_PASSWORD;
  }

  return false;
}

async function buildSessionUser(user: UserRow, avatarOverride?: string) {
  const role = await resolveRoleForUser(user.id, user.email, user.organization_id, user.owner_user_id);
  const persistedAvatarUrl = await loadAvatarUrl(user.id);
  const avatarUrl = persistedAvatarUrl ?? avatarOverride ?? buildDicebearAvatar(user.display_name);

  return {
    id: String(user.id),
    email: user.email,
    displayName: user.display_name,
    orgName: user.org_name?.trim() || "Default Organization",
    role,
    avatarUrl
  };
}

async function resolveRoleForUser(userId: number, email: string, organizationId: number | null, ownerUserId: number | null): Promise<UserRole> {
  const localPart = email.split("@")[0]?.trim().toLowerCase() ?? "";
  if (["platform-superadmin", "platform.superadmin", "superadmin"].includes(localPart)) {
    return "platform_super_admin";
  }
  if (["ops", "ops-admin", "platform-ops"].includes(localPart)) {
    return "ops_admin";
  }

  const teamRows = await dbQuery<TeamMemberRoleRow[]>(
    "SELECT role, status FROM team_members WHERE email = ? ORDER BY updated_at DESC LIMIT 1",
    [email]
  );
  const teamRole = teamRows[0];
  if (teamRole?.status === "active") {
    return normalizeRole(teamRole.role);
  }

  if (organizationId && ownerUserId && Number(ownerUserId) === Number(userId)) {
    return "org_admin";
  }

  return "member";
}

async function loadAvatarUrl(userId: number) {
  const rows = await dbQuery<UserProfileRow[]>("SELECT user_id, avatar_url FROM console_user_profiles WHERE user_id = ? LIMIT 1", [userId]);
  return rows[0]?.avatar_url ?? null;
}

function normalizeRole(role: string): UserRole {
  switch (role) {
    case "project_admin":
    case "org_admin":
    case "finance":
    case "ops_admin":
    case "platform_super_admin":
      return role;
    default:
      return "member";
  }
}

function buildDicebearAvatar(displayName: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1e8b77`;
}

async function buildUniqueOrganizationSlug(name: string) {
  const base = slugify(name);
  let candidate = base;
  let index = 1;
  while (true) {
    const rows = await dbQuery<Array<RowDataPacket & { id: number }>>("SELECT id FROM organizations WHERE slug = ? LIMIT 1", [candidate]);
    if (!rows[0]) {
      return candidate;
    }
    index += 1;
    candidate = `${base}-${index}`;
  }
}

function slugify(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `org-${Date.now()}`;
}

function getSessionSecret() {
  const secret = process.env.PLATFORM_SESSION_SECRET?.trim();
  if (secret && !secret.includes("CHANGE_ME")) {
    return secret;
  }
  if (isProductionLike()) {
    throw new Error("PLATFORM_SESSION_SECRET must be configured in production.");
  }
  return "platform-console-dev-session-secret";
}

function signPayload(payload: SessionPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function decodeSession(raw?: string) {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  if (!safeEqual(signature, expected)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.userId !== "string" || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function shouldUseSecureCookies() {
  if (process.env.PLATFORM_CONSOLE_COOKIE_SECURE === "true") {
    return true;
  }
  return (process.env.PLATFORM_CONSOLE_PUBLIC_URL ?? "").startsWith("https://");
}

function isProductionLike() {
  const appEnv = process.env.APP_ENV ?? process.env.PLATFORM_CONSOLE_APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  return appEnv === "production";
}
