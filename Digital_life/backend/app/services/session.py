"""Platform console session cookie verification.

Mirrors the protocol in `platform/apps/platform-console/lib/server/session-auth.ts`:

  cookie = base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, secret))

Payload shape:
  {"userId": "...", "email": "...", "displayName": "...",
   "orgName": "...", "role": "...", "avatarUrl"?: "...", "exp": <unix-seconds>}

Verification is signature-only — no DB lookup. Digital_life trusts the platform
to revoke a cookie by rotating PLATFORM_SESSION_SECRET when needed.
"""

from __future__ import annotations

import base64
import hmac
import json
import os
import time
from dataclasses import dataclass
from hashlib import sha256
from typing import Optional

SESSION_COOKIE_NAME = "platform_console_session"


@dataclass(frozen=True)
class SessionUser:
    id: str
    email: str
    display_name: str
    org_name: str
    role: str
    tier: str = "free"
    avatar_url: Optional[str] = None
    exp: int = 0


class SessionConfigError(RuntimeError):
    """Raised when the session secret is missing in a production environment."""


def _resolve_secret() -> str:
    secret = (os.getenv("PLATFORM_SESSION_SECRET") or "").strip()
    if secret and "CHANGE_ME" not in secret:
        return secret
    app_env = (os.getenv("APP_ENV") or "development").strip().lower()
    if app_env in {"production", "prod"}:
        raise SessionConfigError("PLATFORM_SESSION_SECRET must be configured in production.")
    return "platform-console-dev-session-secret"


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _verify_signature(encoded: str, signature: str, secret: str) -> bool:
    expected = base64.urlsafe_b64encode(
        hmac.new(secret.encode("utf-8"), encoded.encode("utf-8"), sha256).digest()
    ).rstrip(b"=").decode("ascii")
    return hmac.compare_digest(expected, signature)


def decode_session(raw: Optional[str]) -> Optional[SessionUser]:
    """Return a SessionUser if `raw` is a valid, unexpired platform session cookie."""
    if not raw:
        return None
    parts = raw.split(".")
    if len(parts) != 2:
        return None
    encoded, signature = parts
    try:
        secret = _resolve_secret()
    except SessionConfigError:
        return None
    if not _verify_signature(encoded, signature, secret):
        return None
    try:
        payload = json.loads(_b64url_decode(encoded).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None
    user_id = payload.get("userId")
    email = payload.get("email")
    role = payload.get("role")
    if not (isinstance(user_id, str) and isinstance(email, str) and isinstance(role, str)):
        return None
    exp = payload.get("exp")
    if not isinstance(exp, (int, float)) or exp < time.time():
        return None
    avatar = payload.get("avatarUrl")
    tier = payload.get("tier")
    return SessionUser(
        id=user_id,
        email=email,
        display_name=str(payload.get("displayName") or ""),
        org_name=str(payload.get("orgName") or ""),
        role=role,
        tier="pro" if tier == "pro" else "free",
        avatar_url=str(avatar) if isinstance(avatar, str) else None,
        exp=int(exp),
    )


def session_from_cookies(cookies) -> Optional[SessionUser]:
    """Convenience wrapper for FastAPI `request.cookies`."""
    raw = cookies.get(SESSION_COOKIE_NAME) if hasattr(cookies, "get") else None
    return decode_session(raw)
