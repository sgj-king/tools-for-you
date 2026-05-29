from __future__ import annotations

import base64
import csv
import hmac
import hashlib
import ipaddress
import io
import json
import logging
import os
import re
import time
import uuid
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, AsyncIterator
from urllib.parse import unquote, urlparse

import httpx
import pymysql
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, StreamingResponse
from pymysql.cursors import DictCursor


SERVICE_NAME = os.getenv("SERVICE_NAME", "platform-fastapi")
SERVICE_ROLE = os.getenv("SERVICE_ROLE", "gateway")
APP_ENV = os.getenv("APP_ENV", "development")
APP_VERSION = os.getenv("APP_VERSION", "0.2.0-fastapi")
STARTED_AT = time.time()
REQUEST_COUNT = 0
REQUEST_STATUS_COUNTS: dict[str, int] = {}
RATE_LIMIT_BUCKETS: dict[str, tuple[int, float]] = {}
MAX_JSON_BODY_BYTES = int(os.getenv("MAX_JSON_BODY_BYTES", "1048576"))
MAX_GATEWAY_BODY_BYTES = int(os.getenv("MAX_GATEWAY_BODY_BYTES", "2097152"))

app = FastAPI(title=SERVICE_NAME, version=APP_VERSION)


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def request_id(value: str | None = None) -> str:
    return (value or "").strip() or f"req_dev_{time.time_ns()}"


def trace_id(value: str | None = None) -> str:
    return (value or "").strip() or f"trace_dev_{time.time_ns()}"


def getenv(key: str, fallback: str = "") -> str:
    return os.getenv(key, fallback).strip()


def first_non_empty(*values: Any) -> str:
    for value in values:
        text = str(value or "").strip()
        if text:
            return text
    return ""


def header_text(request: Request, name: str, fallback: str = "") -> str:
    value = request.headers.get(name, fallback)
    try:
        return unquote(value)
    except Exception:
        return value


def inc_requests() -> None:
    global REQUEST_COUNT
    REQUEST_COUNT += 1


def record_status(status_code: int) -> None:
    bucket = "5xx" if status_code >= 500 else "4xx" if status_code >= 400 else "2xx"
    REQUEST_STATUS_COUNTS[bucket] = REQUEST_STATUS_COUNTS.get(bucket, 0) + 1


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if forwarded:
        return forwarded
    return request.client.host if request.client else "unknown"


def header_token(request: Request, name: str) -> str:
    return request.headers.get(name, "").strip()


def token_matches(actual: str, expected: str) -> bool:
    return bool(actual and expected) and hmac.compare_digest(actual, expected)


def session_org_id(request: Request) -> int | None:
    raw = header_text(request, "x-session-org-id", "").strip()
    if not raw and APP_ENV != "production":
        raw = os.getenv("DEV_DEFAULT_ORG_ID", "1001")
    try:
        return int(raw) if raw else None
    except (TypeError, ValueError):
        return None


def session_project_id(request: Request) -> int | None:
    raw = header_text(request, "x-session-project-id", "").strip()
    if not raw and APP_ENV != "production":
        raw = os.getenv("DEV_DEFAULT_PROJECT_ID", "2001")
    try:
        return int(raw) if raw else None
    except (TypeError, ValueError):
        return None


def session_user_id(request: Request) -> str:
    return header_text(request, "x-session-user-id", "").strip()


def session_user_name(request: Request) -> str:
    return header_text(request, "x-session-user-name", "").strip()


def session_org_name(request: Request) -> str:
    return header_text(request, "x-session-org-name", "").strip()


def require_session_user(request: Request) -> JSONResponse | tuple[str, str, str]:
    user_id = session_user_id(request)
    if not user_id and APP_ENV == "production":
        return write_error(401, "session_required", "session user is required")
    return user_id or "anonymous@local", session_user_name(request) or "Anonymous", session_org_name(request) or "default-org"


def check_rate_limit(scope: str, key: str, limit: int, window_seconds: int) -> int | None:
    now = time.time()
    bucket_key = f"{scope}:{key}"
    count, reset_at = RATE_LIMIT_BUCKETS.get(bucket_key, (0, now + window_seconds))
    if reset_at <= now:
        RATE_LIMIT_BUCKETS[bucket_key] = (1, now + window_seconds)
        return None
    count += 1
    RATE_LIMIT_BUCKETS[bucket_key] = (count, reset_at)
    if count <= limit:
        return None
    return max(1, int(reset_at - now))


def request_body_limit(request: Request) -> int:
    if SERVICE_ROLE == "gateway" and request.url.path.startswith("/v1/chat/completions"):
        return MAX_GATEWAY_BODY_BYTES
    return MAX_JSON_BODY_BYTES


def content_length_exceeds(request: Request, limit: int) -> bool:
    try:
        return int(request.headers.get("content-length", "0") or "0") > limit
    except ValueError:
        return False


def mask_dsn(dsn: str) -> str:
    return "***" + dsn[dsn.find("@") :] if "@" in dsn else "***"


def parse_go_mysql_dsn(dsn: str) -> dict[str, Any]:
    match = re.match(r"([^:]+):([^@]*)@tcp\(([^:)]+)(?::(\d+))?\)/([^?]+)", dsn or "")
    if not match:
        raise RuntimeError("MYSQL_DSN is required and must use Go mysql driver format")
    user, password, host, port, database = match.groups()
    return {
        "host": host,
        "port": int(port or "3306"),
        "user": user,
        "password": password,
        "database": database,
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "autocommit": True,
    }


def db_config() -> dict[str, Any]:
    dsn = getenv("MYSQL_DSN")
    if dsn:
        return parse_go_mysql_dsn(dsn)
    return {
        "host": getenv("PLATFORM_DB_HOST", "mysql"),
        "port": int(getenv("PLATFORM_DB_PORT", "3306")),
        "user": getenv("PLATFORM_DB_USER", "platform"),
        "password": getenv("PLATFORM_DB_PASSWORD", "platform_dev_password"),
        "database": getenv("PLATFORM_DB_NAME", "platform"),
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "autocommit": True,
    }


@contextmanager
def db_conn(autocommit: bool = True):
    cfg = db_config()
    cfg["autocommit"] = autocommit
    conn = pymysql.connect(**cfg)
    try:
        yield conn
    finally:
        conn.close()


def query_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())


def query_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    rows = query_all(sql, params)
    return rows[0] if rows else None


def exec_sql(sql: str, params: tuple[Any, ...] = ()) -> int:
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return int(cur.lastrowid or 0)


def identifier_exists(cur: Any, table_name: str, kind: str, identifier: str) -> bool:
    if kind == "column":
        cur.execute(
            """
            SELECT COUNT(1) AS n
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
            """,
            (table_name, identifier),
        )
    elif kind == "index":
        cur.execute(
            """
            SELECT COUNT(1) AS n
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND INDEX_NAME = %s
            """,
            (table_name, identifier),
        )
    elif kind == "constraint":
        cur.execute(
            """
            SELECT COUNT(1) AS n
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND CONSTRAINT_NAME = %s
            """,
            (table_name, identifier),
        )
    else:
        raise ValueError(f"unsupported identifier kind: {kind}")
    row = cur.fetchone() or {"n": 0}
    return int(row.get("n") or 0) > 0


def ensure_column(cur: Any, table_name: str, column_name: str, alter_sql: str) -> None:
    if not identifier_exists(cur, table_name, "column", column_name):
        cur.execute(alter_sql)


def ensure_index(cur: Any, table_name: str, index_name: str, alter_sql: str) -> None:
    if not identifier_exists(cur, table_name, "index", index_name):
        cur.execute(alter_sql)


def ensure_unique_index_if_clean(cur: Any, table_name: str, index_name: str, alter_sql: str, duplicate_sql: str) -> None:
    if identifier_exists(cur, table_name, "index", index_name):
        return
    cur.execute(duplicate_sql)
    row = cur.fetchone() or {"n": 0}
    if int(row.get("n") or 0) == 0:
        cur.execute(alter_sql)


def ensure_constraint(cur: Any, table_name: str, constraint_name: str, alter_sql: str) -> None:
    if not identifier_exists(cur, table_name, "constraint", constraint_name):
        cur.execute(alter_sql)


def json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d %H:%M:%S") if isinstance(value, datetime) else value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def json_response(payload: Any, status_code: int = 200, headers: dict[str, str] | None = None) -> JSONResponse:
    return JSONResponse(json.loads(json.dumps(payload, default=json_default)), status_code=status_code, headers=headers)


def envelope(data: Any = None, meta: dict[str, Any] | None = None, error: dict[str, Any] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {}
    if data is not None:
        payload["data"] = data
    if meta is not None:
        payload["meta"] = meta
    if error is not None:
        payload["error"] = error
    return payload


def write_data(data: Any, meta: dict[str, Any] | None = None, status_code: int = 200) -> JSONResponse:
    return json_response(envelope(data=data, meta=meta), status_code)


def write_error(status_code: int, code: str, message: str, details: dict[str, Any] | None = None) -> JSONResponse:
    return json_response(envelope(error={"code": code, "message": message, "details": details or {}}), status_code)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def parse_json_maybe(value: Any, fallback: Any) -> Any:
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    text = str(value).strip()
    if not text:
        return fallback
    try:
        return json.loads(text)
    except Exception:
        return fallback


def list_from_json(value: Any) -> list[str]:
    parsed = parse_json_maybe(value, [])
    if isinstance(parsed, list):
        return [str(item).strip() for item in parsed if str(item).strip()]
    return []


def amount(value: Any, fallback: str = "0") -> Decimal:
    try:
        return Decimal(str(value if value is not None else fallback))
    except Exception:
        return Decimal(fallback)


def format_amount(value: Any) -> str:
    return f"{amount(value):.6f}"


def positive_int(value: Any, default: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except Exception:
        parsed = default
    return min(max(1, parsed), maximum)


def non_negative_int(value: Any, default: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except Exception:
        parsed = default
    return min(max(0, parsed), maximum)


def non_negative_amount(value: Any, maximum: str = "1000000") -> Decimal | None:
    parsed = amount(value, "-1")
    if parsed < 0 or parsed > Decimal(maximum):
        return None
    return parsed.quantize(Decimal("0.000001"))


def is_valid_email(value: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value or ""))


def bounded_text(value: Any, min_len: int, max_len: int) -> str | None:
    text = str(value or "").strip()
    if len(text) < min_len or len(text) > max_len:
        return None
    return text


def parse_date_value(value: Any) -> date | None:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return date.fromisoformat(text[:10])
    except Exception:
        return None


def is_safe_public_url(value: Any, allow_http_local: bool = APP_ENV != "production") -> bool:
    text = str(value or "").strip()
    if len(text) > 512:
        return False
    parsed = urlparse(text)
    if parsed.scheme not in {"https", "http"} or not parsed.hostname:
        return False
    if parsed.scheme != "https" and not allow_http_local:
        return False
    hostname = parsed.hostname.lower()
    if hostname in {"localhost", "127.0.0.1", "::1"}:
        return allow_http_local
    if hostname.endswith((".local", ".internal", ".localhost")):
        return allow_http_local
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            return allow_http_local
    except ValueError:
        pass
    return True


def estimate_text_tokens(text: str) -> int:
    text = (text or "").strip()
    return max(1, (len(text) + 3) // 4)


def estimate_content_tokens(content: Any) -> int:
    if isinstance(content, str):
        return estimate_text_tokens(content)
    if isinstance(content, list):
        total = 0
        for part in content:
            if isinstance(part, dict) and part.get("type") == "image_url":
                total += 512
            elif isinstance(part, dict):
                total += estimate_text_tokens(str(part.get("text", "")))
            else:
                total += estimate_text_tokens(str(part))
        return max(1, total)
    return estimate_text_tokens(str(content or ""))


def estimate_prompt_tokens(messages: list[dict[str, Any]]) -> int:
    return max(1, sum(estimate_text_tokens(str(m.get("role", ""))) + estimate_content_tokens(m.get("content")) + 4 for m in messages))


def estimate_hold_amount(model: str, max_tokens: int, input_tokens: int) -> Decimal:
    total = Decimal(max(1, max_tokens) + max(1, input_tokens))
    rate = Decimal("0.0009")
    if model == "vision-pro":
        rate = Decimal("0.0012")
    elif model == "embedding-large":
        rate = Decimal("0.0003")
    return (total / Decimal(1000) * rate).quantize(Decimal("0.000001"))


def estimate_actual_amount(model: str, input_tokens: int, output_tokens: int) -> Decimal:
    input_rate = Decimal("0.00015")
    output_rate = Decimal("0.00060")
    if model == "vision-pro":
        input_rate = Decimal("0.00011")
        output_rate = Decimal("0.00034")
    if model == "embedding-large":
        input_rate = Decimal("0.00060")
        output_rate = Decimal("0")
    return ((Decimal(max(0, input_tokens)) / Decimal(1000) * input_rate) + (Decimal(max(0, output_tokens)) / Decimal(1000) * output_rate)).quantize(Decimal("0.000001"))


def provider_cost(model: str, input_tokens: int, output_tokens: int) -> str:
    return format_amount(estimate_actual_amount(model, input_tokens, output_tokens) * Decimal("0.45"))


def extract_bearer(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return ""


def gateway_error(status_code: int, request_id_value: str, trace_id_value: str, code: str, message: str) -> JSONResponse:
    return json_response(
        {
            "error": {"message": message, "type": code, "code": code},
            "request_id": request_id_value,
            "trace_id": trace_id_value,
        },
        status_code,
    )


def add_security_headers(response: Response) -> Response:
    for key, value in {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Cache-Control": "no-store",
    }.items():
        if key not in response.headers:
            response.headers[key] = value
    return response


async def post_json(url: str, payload: dict[str, Any], timeout: float | None = 20.0) -> tuple[int, dict[str, Any]]:
    headers: dict[str, str] = {}
    internal_token = getenv("INTERNAL_SERVICE_TOKEN")
    if internal_token:
        headers["X-Internal-Service-Token"] = internal_token
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, json=payload, headers=headers)
        try:
            data = resp.json()
        except Exception:
            data = {"raw_response": resp.text}
        return resp.status_code, data


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    inc_requests()
    limit = request_body_limit(request)
    if content_length_exceeds(request, limit):
        return add_security_headers(write_error(413, "request_body_too_large", "request body is too large", {"maxBytes": limit}))

    if request.url.path.startswith("/internal/"):
        expected = getenv("INTERNAL_SERVICE_TOKEN")
        if APP_ENV == "production" and not expected:
            return add_security_headers(write_error(503, "internal_token_not_configured", "internal service token is not configured"))
        if expected and not token_matches(header_token(request, "x-internal-service-token"), expected):
            return add_security_headers(write_error(401, "invalid_internal_service_token", "internal service token is missing or invalid"))

    if SERVICE_ROLE == "operations" and request.url.path.startswith("/v1/"):
        expected = getenv("PLATFORM_OPS_SHARED_TOKEN")
        if APP_ENV == "production" and not expected:
            return add_security_headers(write_error(503, "ops_token_not_configured", "platform ops token is not configured"))
        if expected and not token_matches(header_token(request, "x-platform-ops-token"), expected):
            return add_security_headers(write_error(401, "invalid_ops_token", "platform ops token is missing or invalid"))

    if request.url.path.startswith("/v1/chat/completions"):
        retry_after = check_rate_limit("gateway_chat", extract_bearer(request) or client_ip(request), 120, 60)
        if retry_after is not None:
            response = write_error(429, "rate_limited", "too many requests", {"retryAfterSeconds": retry_after})
            response.headers["Retry-After"] = str(retry_after)
            return add_security_headers(response)

    try:
        response = await call_next(request)
    except json.JSONDecodeError:
        record_status(400)
        return add_security_headers(write_error(400, "invalid_json_payload", "request body is not valid JSON"))
    except Exception as exc:
        record_status(500)
        logging.getLogger(SERVICE_NAME).exception("unhandled exception in request pipeline")
        details = {"cause": str(exc)} if APP_ENV != "production" else None
        return add_security_headers(write_error(500, "internal_server_error", "request failed", details))

    record_status(response.status_code)
    return add_security_headers(response)


@app.on_event("startup")
def startup() -> None:
    if SERVICE_ROLE in {"auth", "identity", "billing", "policy", "operations"}:
        with db_conn() as conn:
            conn.ping(reconnect=True)
    if SERVICE_ROLE == "operations":
        ensure_console_tables()
        ensure_platform_database_hardening()


@app.get("/", response_class=HTMLResponse)
def root() -> str:
    return f"<h1>{SERVICE_NAME}</h1><p>FastAPI service role={SERVICE_ROLE} is running.</p>"


@app.get("/healthz")
def healthz() -> JSONResponse:
    if SERVICE_ROLE in {"auth", "identity", "billing", "policy", "operations"}:
        try:
            with db_conn() as conn:
                conn.ping(reconnect=True)
        except Exception as exc:
            return json_response({"success": False, "service": SERVICE_NAME, "status": "db_down", "error": str(exc)}, 503)
    return json_response({"success": True, "service": SERVICE_NAME, "status": "ok", "runtime": "fastapi"})


@app.get("/readyz")
async def readyz() -> JSONResponse:
    if SERVICE_ROLE == "gateway":
        deps = []
        async with httpx.AsyncClient(timeout=4) as client:
            for name, base in {
                "auth": getenv("AUTH_BASE_URL", "http://auth:8080"),
                "policy": getenv("POLICY_BASE_URL", "http://policy:8080"),
                "billing": getenv("BILLING_BASE_URL", "http://billing:8080"),
                "relay": getenv("RELAY_BASE_URL", "http://relay:8080"),
            }.items():
                try:
                    resp = await client.get(base.rstrip("/") + "/readyz")
                    deps.append({"name": name, "url": base, "ready": resp.status_code < 400, "status": f"http_{resp.status_code}"})
                except Exception as exc:
                    deps.append({"name": name, "url": base, "ready": False, "status": str(exc)})
        ok = all(dep["ready"] for dep in deps)
        return json_response({"success": ok, "service": SERVICE_NAME, "status": "ready" if ok else "not_ready", "dependencies": deps}, 200 if ok else 503)
    if SERVICE_ROLE == "relay":
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(getenv("NEW_API_BASE_URL", "http://new-api:3000").rstrip("/") + "/api/status")
            return json_response({"success": resp.status_code < 400, "service": SERVICE_NAME, "status": "ready" if resp.status_code < 400 else "not_ready"})
        except Exception as exc:
            return json_response({"success": False, "service": SERVICE_NAME, "status": "new_api_unreachable", "error": str(exc)}, 503)
    return healthz()


@app.get("/v1/info")
def info() -> JSONResponse:
    deps = {} if APP_ENV == "production" else {
        "mysql_dsn": mask_dsn(getenv("MYSQL_DSN")),
        "redis_addr": getenv("REDIS_ADDR"),
        "nats_url": getenv("NATS_URL"),
        "auth_base_url": getenv("AUTH_BASE_URL"),
        "billing_base_url": getenv("BILLING_BASE_URL"),
        "policy_base_url": getenv("POLICY_BASE_URL"),
        "risk_base_url": getenv("RISK_BASE_URL"),
        "relay_base_url": getenv("RELAY_BASE_URL"),
        "new_api_base_url": getenv("NEW_API_BASE_URL"),
    }
    return json_response({"service": SERVICE_NAME, "role": SERVICE_ROLE, "environment": APP_ENV, "version": APP_VERSION, "uptime": f"{time.time() - STARTED_AT:.0f}s", "now": now_utc(), "dependencies": deps})


@app.api_route("/v1/echo", methods=["GET", "POST", "PUT", "DELETE"])
async def echo(request: Request) -> JSONResponse:
    if APP_ENV == "production":
        return write_error(404, "not_found", "resource not found")
    return json_response({"success": True, "service": SERVICE_NAME, "method": request.method, "path": request.url.path, "query": request.url.query})


@app.get("/metrics")
def metrics() -> PlainTextResponse:
    lines = [
        f'service_info{{service="{SERVICE_NAME}",role="{SERVICE_ROLE}",env="{APP_ENV}"}} 1',
        f"service_uptime_seconds {time.time() - STARTED_AT:.0f}",
        f"service_http_requests_total {REQUEST_COUNT}",
    ]
    for bucket in ("2xx", "4xx", "5xx"):
        count = REQUEST_STATUS_COUNTS.get(bucket, 0)
        lines.append(f'service_http_responses_total{{status="{bucket}"}} {count}')
    return PlainTextResponse("\n".join(lines) + "\n")


@app.post("/internal/auth/validate-key")
def validate_key(payload: dict[str, Any]) -> JSONResponse:
    rid = request_id(payload.get("request_id"))
    tid = trace_id(payload.get("trace_id"))
    api_key = str(payload.get("api_key") or "").strip()
    if not api_key:
        return json_response({"success": False, "valid": False, "request_id": rid, "trace_id": tid, "error_code": "missing_api_key", "message": "api_key is required"}, 400)
    row = query_one(
        """
        SELECT ak.id AS api_key_id, ak.organization_id, ak.project_id, ak.key_prefix,
               ak.status AS key_status, o.status AS organization_status, p.status AS project_status,
               COALESCE(o.owner_user_id, 0) AS user_id, o.slug AS organization_slug, p.name AS project_name,
               COALESCE(CAST(ak.scopes_json AS CHAR), '[]') AS scopes_json, ak.expires_at
        FROM api_keys ak
        INNER JOIN organizations o ON o.id = ak.organization_id
        INNER JOIN projects p ON p.id = ak.project_id
        WHERE ak.key_hash = %s
        LIMIT 1
        """,
        (sha256_hex(api_key),),
    )
    if not row:
        return json_response({"success": False, "valid": False, "request_id": rid, "trace_id": tid, "error_code": "invalid_api_key", "message": "api key not found"}, 401)
    if row["key_status"] != "active" or row["organization_status"] != "active" or row["project_status"] != "active":
        return json_response({"success": False, "valid": False, "request_id": rid, "trace_id": tid, "error_code": "key_or_scope_disabled", "message": "api key or scope is not active"}, 403)
    expires_at = row.get("expires_at")
    if expires_at and expires_at < datetime.now():
        return json_response({"success": False, "valid": False, "request_id": rid, "trace_id": tid, "error_code": "api_key_expired", "message": "api key has expired"}, 401)
    exec_sql("UPDATE api_keys SET last_used_at = NOW() WHERE id = %s", (row["api_key_id"],))
    return json_response(
        {
            "success": True,
            "valid": True,
            "request_id": rid,
            "trace_id": tid,
            "api_key_id": row["api_key_id"],
            "organization_id": row["organization_id"],
            "project_id": row["project_id"],
            "user_id": row["user_id"],
            "api_key_prefix": row["key_prefix"],
            "key_status": row["key_status"],
            "organization_status": row["organization_status"],
            "project_status": row["project_status"],
            "scopes": list_from_json(row["scopes_json"]),
            "metadata": {"organization_slug": row["organization_slug"], "project_name": row["project_name"], "source": "mysql-fastapi"},
        }
    )


@app.post("/internal/policy/check")
def policy_check(payload: dict[str, Any]) -> JSONResponse:
    rid = request_id(payload.get("request_id"))
    tid = trace_id(payload.get("trace_id"))
    org_id = int(payload.get("organization_id") or 0)
    project_id = int(payload.get("project_id") or 0)
    api_key_id = int(payload.get("api_key_id") or 0)
    model = str(payload.get("model") or "").strip()
    region = str(payload.get("region") or "global").strip() or "global"
    if not org_id or not project_id or not api_key_id or not model:
        return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "missing_required_fields", "message": "organization_id, project_id, api_key_id and model are required"}, 400)
    entitlement = query_one(
        """
        SELECT policy_code, rpm_limit, tpm_limit, concurrency_limit, CAST(daily_cost_cap AS CHAR) AS daily_cost_cap
        FROM model_entitlements
        WHERE organization_id = %s AND external_model_name = %s AND is_enabled = 1
          AND (expires_at IS NULL OR expires_at > NOW()) AND (project_id = %s OR project_id IS NULL)
        ORDER BY CASE WHEN project_id = %s THEN 0 ELSE 1 END, id ASC
        LIMIT 1
        """,
        (org_id, model, project_id, project_id),
    )
    if not entitlement:
        return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "model_not_entitled", "message": "model entitlement not found"}, 403)
    route = query_one(
        """
        SELECT internal_model_profile, provider_code, provider_model, region, channel_code
        FROM provider_routes
        WHERE external_model_name = %s AND is_active = 1 AND (region = %s OR region = 'global')
        ORDER BY CASE WHEN region = %s THEN 0 ELSE 1 END, priority ASC, weight DESC, id ASC
        LIMIT 1
        """,
        (model, region, region),
    )
    if not route:
        return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "route_not_found", "message": "active provider route not found"}, 503)
    plan = query_one("SELECT code FROM price_plans WHERE is_active = 1 ORDER BY id ASC LIMIT 1") or {"code": "unknown"}
    return json_response(
        {
            "success": True,
            "allowed": True,
            "request_id": rid,
            "trace_id": tid,
            "policy_code": entitlement["policy_code"],
            "price_plan_code": plan["code"],
            "limits": {"rpm": entitlement["rpm_limit"], "tpm": entitlement["tpm_limit"], "concurrency": entitlement["concurrency_limit"], "daily_cost_cap": entitlement["daily_cost_cap"]},
            "route_hint": {"external_model_name": model, "internal_profile": route["internal_model_profile"], "preferred_provider": route["provider_code"], "provider_model": route["provider_model"], "channel_code": route["channel_code"], "region": route["region"]},
            "decision_context": {"organization_id": org_id, "project_id": project_id, "api_key_id": api_key_id, "region": region, "source": "mysql-fastapi"},
        }
    )


RISK_BASELINE_RULES: list[tuple[str, list[str]]] = [
    ("hate", ["nigger", "kike", "chink", "spic", "faggot"]),
    ("self_harm", ["how to commit suicide", "kill myself", "ways to suicide", "自杀方法"]),
    ("violence", ["how to make a bomb", "build a bomb", "make a pipe bomb", "pipe bomb", "制造炸弹", "制作炸弹", "造炸弹"]),
    ("illegal", ["buy heroin", "buy meth", "buy fentanyl", "购买毒品", "买枪", "child porn", "csam"]),
    ("sexual_minor", ["loli", "underage sex", "minor sex", "child sex"]),
]


def risk_collect_text(payload: dict[str, Any]) -> str:
    chunks: list[str] = []
    text_field = payload.get("text") or payload.get("input")
    if isinstance(text_field, str) and text_field.strip():
        chunks.append(text_field)
    elif isinstance(text_field, list):
        for item in text_field:
            if isinstance(item, str):
                chunks.append(item)
    messages = payload.get("messages")
    if isinstance(messages, list):
        for msg in messages:
            if not isinstance(msg, dict):
                continue
            content = msg.get("content")
            if isinstance(content, str):
                chunks.append(content)
            elif isinstance(content, list):
                for part in content:
                    if isinstance(part, dict):
                        text = part.get("text")
                        if isinstance(text, str):
                            chunks.append(text)
    return "\n".join(chunks).strip()


def risk_match_baseline(text: str) -> tuple[list[str], list[str]]:
    if not text:
        return [], []
    lowered = text.lower()
    matched_categories: list[str] = []
    matched_terms: list[str] = []
    for category, terms in RISK_BASELINE_RULES:
        for term in terms:
            if term.lower() in lowered:
                matched_terms.append(term)
                if category not in matched_categories:
                    matched_categories.append(category)
    return matched_categories, matched_terms


async def risk_call_external(text: str, rid: str, tid: str) -> dict[str, Any] | None:
    url = getenv("RISK_EXTERNAL_MODERATION_URL")
    if not url or not text:
        return None
    headers = {"Content-Type": "application/json"}
    api_key = getenv("RISK_EXTERNAL_MODERATION_KEY")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {"input": text, "request_id": rid, "trace_id": tid}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                return {"plugin_error": f"http {resp.status_code}", "raw": resp.text[:512]}
            return resp.json()
    except Exception as exc:
        return {"plugin_error": str(exc)}


@app.post("/internal/risk/moderate")
async def risk_moderate_internal(payload: dict[str, Any]) -> JSONResponse:
    rid = request_id(payload.get("request_id"))
    tid = trace_id(payload.get("trace_id"))
    text = risk_collect_text(payload)
    if not text:
        return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "missing_input", "message": "text or messages is required"}, 400)
    categories, terms = risk_match_baseline(text)
    plugin = await risk_call_external(text, rid, tid)
    plugin_flagged = False
    plugin_categories: list[str] = []
    if isinstance(plugin, dict):
        flagged = plugin.get("flagged")
        if flagged is True:
            plugin_flagged = True
        cats = plugin.get("categories")
        if isinstance(cats, dict):
            for name, value in cats.items():
                if value:
                    plugin_categories.append(str(name))
                    if not plugin_flagged:
                        plugin_flagged = True
    allowed = not categories and not plugin_flagged
    decision = "allow" if allowed else "block"
    return json_response(
        {
            "success": True,
            "allowed": allowed,
            "decision": decision,
            "request_id": rid,
            "trace_id": tid,
            "categories": list(dict.fromkeys(categories + plugin_categories)),
            "matched_terms": terms,
            "plugin": plugin,
            "source": "platform-risk",
        }
    )


def signed_sum(cur, organization_id: int, account_type: str) -> Decimal:
    cur.execute(
        """
        SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) AS total
        FROM balance_ledger WHERE organization_id = %s AND account_type = %s
        """,
        (organization_id, account_type),
    )
    return amount(cur.fetchone()["total"])


@app.post("/internal/billing/preauthorize")
def billing_preauthorize(payload: dict[str, Any]) -> JSONResponse:
    rid = request_id(payload.get("request_id"))
    tid = trace_id(payload.get("trace_id"))
    org_id = int(payload.get("organization_id") or 0)
    project_id = int(payload.get("project_id") or 0)
    api_key_id = int(payload.get("api_key_id") or 0)
    model = str(payload.get("model") or "").strip()
    idem = str(payload.get("idempotency_key") or f"idem_{rid}").strip()
    if not org_id or not project_id or not api_key_id or not model:
        return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "missing_required_fields", "message": "organization_id, project_id, api_key_id and model are required"}, 400)
    with db_conn(autocommit=False) as conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT reference_id, CAST(amount AS CHAR) AS amount FROM balance_ledger WHERE idempotency_key = %s AND reference_type = 'preauth_hold' LIMIT 1", (idem,))
                existing = cur.fetchone()
                if existing:
                    conn.commit()
                    return json_response({"success": True, "allowed": True, "request_id": rid, "trace_id": tid, "hold_id": existing["reference_id"], "hold_amount": existing["amount"], "currency": "USD", "price_snapshot_code": f"{model}@mysql-dev", "account_mode": "prepaid", "decision_context": {"source": "mysql_fastapi_idempotent_hit"}})
                cur.execute("SELECT COUNT(1) AS n FROM api_keys WHERE id = %s AND organization_id = %s AND project_id = %s AND status = 'active'", (api_key_id, org_id, project_id))
                if int(cur.fetchone()["n"]) == 0:
                    conn.rollback()
                    return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "api_key_scope_invalid", "message": "api key does not belong to the provided scope"}, 403)
                cur.execute("SELECT id FROM organizations WHERE id = %s FOR UPDATE", (org_id,))
                if not cur.fetchone():
                    conn.rollback()
                    return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "organization_not_found", "message": "organization not found"}, 404)
                cash = signed_sum(cur, org_id, "cash")
                hold = signed_sum(cur, org_id, "hold")
                hold_amount = estimate_hold_amount(model, positive_int(payload.get("max_tokens"), 256, 131_072), positive_int(payload.get("input_tokens_estimate"), 1, 1_000_000))
                if cash - hold < hold_amount:
                    conn.rollback()
                    return json_response({"success": False, "allowed": False, "request_id": rid, "trace_id": tid, "error_code": "insufficient_balance", "message": "insufficient available balance for preauthorization"}, 402)
                hold_id = f"hold_{rid}"
                cur.execute(
                    """
                    INSERT INTO balance_ledger (organization_id, project_id, api_key_id, account_type, direction, amount, currency, reference_type, reference_id, request_id, idempotency_key, remark)
                    VALUES (%s, %s, %s, 'hold', 'debit', %s, 'USD', 'preauth_hold', %s, %s, %s, 'FastAPI preauthorization hold')
                    """,
                    (org_id, project_id, api_key_id, hold_amount, hold_id, rid, idem),
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
    return json_response({"success": True, "allowed": True, "request_id": rid, "trace_id": tid, "hold_id": hold_id, "hold_amount": format_amount(hold_amount), "currency": "USD", "price_snapshot_code": f"{model}@mysql-dev", "account_mode": "prepaid", "decision_context": {"source": "mysql-fastapi", "cash_balance": format_amount(cash), "open_hold": format_amount(hold)}})


@app.post("/internal/billing/finalize")
def billing_finalize(payload: dict[str, Any]) -> JSONResponse:
    rid = request_id(payload.get("request_id"))
    tid = trace_id(payload.get("trace_id"))
    org_id = int(payload.get("organization_id") or 0)
    project_id = int(payload.get("project_id") or 0)
    api_key_id = int(payload.get("api_key_id") or 0)
    model = str(payload.get("model") or "").strip()
    hold_id = str(payload.get("hold_id") or "").strip()
    if not org_id or not project_id or not api_key_id or not model or not hold_id:
        return json_response({"success": False, "settled": False, "request_id": rid, "trace_id": tid, "error_code": "missing_required_fields", "message": "organization_id, project_id, api_key_id, model and hold_id are required"}, 400)
    with db_conn(autocommit=False) as conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, CAST(sale_amount AS CHAR) AS sale_amount FROM usage_records WHERE request_id = %s LIMIT 1", (rid,))
                existing = cur.fetchone()
                if existing:
                    conn.commit()
                    return json_response({"success": True, "settled": True, "request_id": rid, "trace_id": tid, "hold_id": hold_id, "captured_amount": existing["sale_amount"], "released_amount": "0.000000", "currency": "USD", "settlement_status": "settled", "usage_record_id": str(existing["id"]), "ledger_entry_ids": [], "decision_context": {"source": "mysql_fastapi_idempotent_hit"}})
                cur.execute("SELECT CAST(amount AS CHAR) AS amount FROM balance_ledger WHERE organization_id = %s AND project_id = %s AND api_key_id = %s AND reference_type = 'preauth_hold' AND reference_id = %s LIMIT 1", (org_id, project_id, api_key_id, hold_id))
                hold = cur.fetchone()
                if not hold:
                    conn.rollback()
                    return json_response({"success": False, "settled": False, "request_id": rid, "trace_id": tid, "error_code": "hold_not_found", "message": "matching preauthorization hold not found"}, 404)
                cur.execute("SELECT id FROM organizations WHERE id = %s FOR UPDATE", (org_id,))
                if not cur.fetchone():
                    conn.rollback()
                    return json_response({"success": False, "settled": False, "request_id": rid, "trace_id": tid, "error_code": "organization_not_found", "message": "organization not found"}, 404)
                input_tokens = non_negative_int(payload.get("input_tokens"), 0, 10_000_000)
                output_tokens = non_negative_int(payload.get("output_tokens"), 0, 10_000_000)
                actual = estimate_actual_amount(model, input_tokens, output_tokens)
                release = max(Decimal("0"), amount(hold["amount"]) - actual)
                route = query_one("SELECT internal_model_profile, provider_code, provider_model FROM provider_routes WHERE external_model_name = %s AND is_active = 1 ORDER BY priority ASC, weight DESC, id ASC LIMIT 1", (model,)) or {"internal_model_profile": "unknown_profile", "provider_code": "unknown_provider", "provider_model": "unknown_model"}
                cur.execute(
                    """
                    INSERT INTO usage_records (request_id, organization_id, project_id, api_key_id, external_model_name, internal_model_profile, provider_code, provider_model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, billable_units, provider_cost, sale_amount, settlement_status, started_at, finished_at, trace_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 0, %s, %s, %s, %s, NOW(), NOW(), %s)
                    """,
                    (rid, org_id, project_id, api_key_id, model, route["internal_model_profile"], route["provider_code"], route["provider_model"], input_tokens, output_tokens, Decimal(input_tokens + output_tokens) / Decimal(1000), amount(payload.get("provider_cost")), actual, "settled" if payload.get("stream_status") != "errored" else "failed", tid),
                )
                usage_id = cur.lastrowid
                cur.execute("INSERT INTO balance_ledger (organization_id, project_id, api_key_id, account_type, direction, amount, currency, reference_type, reference_id, request_id, idempotency_key, remark) VALUES (%s, %s, %s, 'cash', 'debit', %s, 'USD', 'settlement_capture', %s, %s, %s, 'Settlement capture')", (org_id, project_id, api_key_id, actual, rid, rid, f"{payload.get('idempotency_key') or rid}_capture"))
                capture_id = cur.lastrowid
                cur.execute("INSERT INTO balance_ledger (organization_id, project_id, api_key_id, account_type, direction, amount, currency, reference_type, reference_id, request_id, idempotency_key, remark) VALUES (%s, %s, %s, 'hold', 'credit', %s, 'USD', 'hold_release', %s, %s, %s, 'Release hold')", (org_id, project_id, api_key_id, amount(hold["amount"]), hold_id, rid, f"{payload.get('idempotency_key') or rid}_release"))
                release_id = cur.lastrowid
                cur.execute("INSERT INTO request_traces (request_id, trace_id, organization_id, project_id, api_key_id, edge_status_code, provider_status_code, route_snapshot_json, latency_ms, stream_duration_ms, error_code, error_message_masked) VALUES (%s, %s, %s, %s, %s, 200, 200, %s, 0, 0, NULL, NULL)", (rid, tid, org_id, project_id, api_key_id, json.dumps(route, default=json_default)))
            conn.commit()
        except Exception:
            conn.rollback()
            raise
    return json_response({"success": True, "settled": True, "request_id": rid, "trace_id": tid, "hold_id": hold_id, "captured_amount": format_amount(actual), "released_amount": format_amount(release), "currency": "USD", "settlement_status": "settled" if payload.get("stream_status") != "errored" else "failed", "usage_record_id": str(usage_id), "ledger_entry_ids": [str(capture_id), str(release_id)], "decision_context": {"source": "mysql-fastapi"}})


@app.post("/internal/relay/chat-completions")
async def relay_chat(payload: dict[str, Any]) -> JSONResponse:
    rid = request_id(payload.get("request_id"))
    tid = trace_id(payload.get("trace_id"))
    token = getenv("NEW_API_INTERNAL_TOKEN")
    if not token:
        return json_response({"success": False, "request_id": rid, "trace_id": tid, "error_code": "missing_new_api_internal_token", "message": "NEW_API_INTERNAL_TOKEN is required"}, 503)
    openai_payload = payload.get("openai_request") or {}
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(getenv("NEW_API_BASE_URL", "http://new-api:3000").rstrip("/") + "/v1/chat/completions", json=openai_payload, headers={"Authorization": f"Bearer {token}", "X-Request-Id": rid, "X-Trace-Id": tid})
    try:
        data = resp.json()
    except Exception:
        data = {"raw_response": resp.text}
    if resp.status_code >= 400:
        err = data.get("error") if isinstance(data.get("error"), dict) else {}
        return json_response({"success": False, "request_id": rid, "trace_id": tid, "upstream_status_code": resp.status_code, "response_json": data, "error_code": err.get("code") or "upstream_error", "message": err.get("message") or "upstream request failed", "metadata": {"source": "new-api"}}, resp.status_code)
    usage = data.get("usage") or {}
    return json_response({"success": True, "request_id": rid, "trace_id": tid, "upstream_status_code": resp.status_code, "response_json": data, "usage": usage, "metadata": {"source": "new-api", "route_hint": payload.get("route_hint")}})


@app.post("/internal/relay/chat-completions/stream")
async def relay_chat_stream(payload: dict[str, Any]) -> Response:
    rid = request_id(payload.get("request_id"))
    tid = trace_id(payload.get("trace_id"))
    token = getenv("NEW_API_INTERNAL_TOKEN")
    if not token:
        return json_response({"success": False, "request_id": rid, "trace_id": tid, "error_code": "missing_new_api_internal_token", "message": "NEW_API_INTERNAL_TOKEN is required"}, 503)
    openai_payload = dict(payload.get("openai_request") or {})
    openai_payload["stream"] = True

    async def iterator() -> AsyncIterator[bytes]:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST",
                getenv("NEW_API_BASE_URL", "http://new-api:3000").rstrip("/") + "/v1/chat/completions",
                json=openai_payload,
                headers={"Authorization": f"Bearer {token}", "Accept": "text/event-stream", "Cache-Control": "no-cache", "X-Request-Id": rid, "X-Trace-Id": tid},
            ) as resp:
                async for chunk in resp.aiter_bytes():
                    yield chunk

    return StreamingResponse(iterator(), media_type="text/event-stream", headers={"X-Request-Id": rid, "X-Trace-Id": tid, "Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


async def gateway_chain_setup(request: Request, body: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], str, str, str] | JSONResponse:
    rid = request_id(request.headers.get("x-request-id"))
    tid = trace_id(request.headers.get("x-trace-id"))
    idem = first_non_empty(request.headers.get("idempotency-key"), f"idem_{rid}")
    api_key = extract_bearer(request)
    if not api_key:
        return gateway_error(401, rid, tid, "missing_bearer_token", "Authorization: Bearer <api_key> is required")
    model = str(body.get("model") or "").strip()
    messages = body.get("messages") or []
    if not model or not isinstance(messages, list) or not messages:
        return gateway_error(400, rid, tid, "missing_required_fields", "model and messages are required")
    status, auth = await post_json(getenv("AUTH_BASE_URL", "http://auth:8080").rstrip("/") + "/internal/auth/validate-key", {"api_key": api_key, "request_id": rid, "trace_id": tid})
    if status >= 400 or not auth.get("success") or not auth.get("valid"):
        return gateway_error(401 if status < 500 else 502, rid, tid, auth.get("error_code") or "auth_rejected", auth.get("message") or "api key validation failed")
    status, policy = await post_json(getenv("POLICY_BASE_URL", "http://policy:8080").rstrip("/") + "/internal/policy/check", {"request_id": rid, "trace_id": tid, "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "model": model, "region": request.headers.get("x-region") or "global"})
    if status >= 400 or not policy.get("success") or not policy.get("allowed"):
        return gateway_error(403 if status < 500 else 502, rid, tid, policy.get("error_code") or "policy_rejected", policy.get("message") or "policy check failed")
    max_tokens = positive_int(body.get("max_tokens"), 256, 131_072)
    prompt_tokens = estimate_prompt_tokens(messages)
    status, preauth = await post_json(getenv("BILLING_BASE_URL", "http://billing:8080").rstrip("/") + "/internal/billing/preauthorize", {"request_id": rid, "trace_id": tid, "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "model": model, "max_tokens": max_tokens, "input_tokens_estimate": prompt_tokens, "idempotency_key": idem})
    if status >= 400 or not preauth.get("success") or not preauth.get("allowed"):
        return gateway_error(402 if status < 500 else 502, rid, tid, preauth.get("error_code") or "preauthorize_rejected", preauth.get("message") or "preauthorization failed")
    return auth, policy, preauth, rid, tid, idem


@app.post("/v1/moderate")
async def gateway_moderate(request: Request) -> Response:
    if SERVICE_ROLE != "gateway":
        return write_error(404, "not_found", "resource not found")
    try:
        body = await request.json()
    except Exception:
        return gateway_error(400, request_id(request.headers.get("x-request-id")), trace_id(request.headers.get("x-trace-id")), "invalid_request_body", "request body must be JSON")
    if not isinstance(body, dict):
        return gateway_error(400, request_id(request.headers.get("x-request-id")), trace_id(request.headers.get("x-trace-id")), "invalid_request_body", "request body must be a JSON object")
    rid = request_id(request.headers.get("x-request-id"))
    tid = trace_id(request.headers.get("x-trace-id"))
    api_key = extract_bearer(request)
    if not api_key:
        return gateway_error(401, rid, tid, "missing_bearer_token", "Authorization: Bearer <api_key> is required")
    status, auth = await post_json(getenv("AUTH_BASE_URL", "http://auth:8080").rstrip("/") + "/internal/auth/validate-key", {"api_key": api_key, "request_id": rid, "trace_id": tid})
    if status >= 400 or not auth.get("success") or not auth.get("valid"):
        return gateway_error(401 if status < 500 else 502, rid, tid, auth.get("error_code") or "auth_rejected", auth.get("message") or "api key validation failed")
    risk_payload = {"request_id": rid, "trace_id": tid, "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "text": body.get("text") or body.get("input"), "messages": body.get("messages")}
    status, risk = await post_json(getenv("RISK_BASE_URL", "http://risk:8080").rstrip("/") + "/internal/risk/moderate", risk_payload, timeout=10)
    if status >= 400 or not risk.get("success"):
        return gateway_error(502, rid, tid, risk.get("error_code") or "risk_upstream_error", risk.get("message") or "moderation request failed")
    headers = {"X-Request-Id": rid, "X-Trace-Id": tid}
    return json_response({"success": True, "allowed": risk.get("allowed"), "decision": risk.get("decision"), "categories": risk.get("categories") or [], "matched_terms": risk.get("matched_terms") or [], "request_id": rid, "trace_id": tid}, 200, headers=headers)


@app.post("/v1/chat/completions")
async def gateway_chat_completions(request: Request) -> Response:
    body = await request.json()
    if not isinstance(body, dict):
        return gateway_error(400, request_id(request.headers.get("x-request-id")), trace_id(request.headers.get("x-trace-id")), "invalid_request_body", "request body must be a JSON object")
    setup = await gateway_chain_setup(request, body)
    if isinstance(setup, JSONResponse):
        return setup
    auth, policy, preauth, rid, tid, idem = setup
    model = str(body.get("model")).strip()
    messages = body.get("messages") or []
    max_tokens = positive_int(body.get("max_tokens"), 256, 131_072)
    if body.get("stream") is True:
        return await gateway_stream(body, auth, policy, preauth, rid, tid, idem)
    relay_payload = {"request_id": rid, "trace_id": tid, "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "external_model_name": model, "policy_code": policy.get("policy_code"), "route_hint": policy.get("route_hint"), "openai_request": {"model": model, "messages": messages, "max_tokens": max_tokens, "stream": False, "user": body.get("user", "")}}
    status, relay = await post_json(getenv("RELAY_BASE_URL", "http://relay:8080").rstrip("/") + "/internal/relay/chat-completions", relay_payload, timeout=120)
    if status >= 400 or not relay.get("success"):
        await compensate_hold(rid, tid, preauth.get("hold_id"), auth, model, preauth.get("hold_amount"), idem)
        return gateway_error(502, rid, tid, relay.get("error_code") or "relay_upstream_error", relay.get("message") or "relay request failed")
    upstream = dict(relay.get("response_json") or {})
    usage = relay.get("usage") or upstream.get("usage") or {}
    input_tokens = int(usage.get("prompt_tokens") or estimate_prompt_tokens(messages))
    output_tokens = int(usage.get("completion_tokens") or 0)
    status, final = await post_json(getenv("BILLING_BASE_URL", "http://billing:8080").rstrip("/") + "/internal/billing/finalize", {"request_id": rid, "trace_id": tid, "hold_id": preauth.get("hold_id"), "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "model": model, "input_tokens": input_tokens, "output_tokens": output_tokens, "provider_cost": provider_cost(model, input_tokens, output_tokens), "authorized_amount": preauth.get("hold_amount"), "stream_status": "completed", "idempotency_key": idem})
    if status >= 400 or not final.get("success"):
        return gateway_error(502, rid, tid, final.get("error_code") or "finalize_failed", final.get("message") or "final settlement failed")
    upstream.update({"request_id": rid, "trace_id": tid})
    headers = {"X-Request-Id": rid, "X-Trace-Id": tid, "X-Hold-Id": str(preauth.get("hold_id", "")), "X-Usage-Record-Id": str(final.get("usage_record_id", "")), "X-Gateway-Mode": "fastapi-chain-v1-relay"}
    return json_response(upstream, 200, headers=headers)


async def compensate_hold(rid: str, tid: str, hold_id: str | None, auth: dict[str, Any], model: str, hold_amount: str | None, idem: str) -> None:
    if not hold_id:
        return
    try:
        await post_json(getenv("BILLING_BASE_URL", "http://billing:8080").rstrip("/") + "/internal/billing/finalize", {"request_id": rid, "trace_id": tid, "hold_id": hold_id, "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "model": model, "input_tokens": 0, "output_tokens": 0, "provider_cost": "0.000000", "authorized_amount": hold_amount or "0.000000", "stream_status": "errored", "idempotency_key": idem}, timeout=8)
    except Exception:
        pass


async def gateway_stream(body: dict[str, Any], auth: dict[str, Any], policy: dict[str, Any], preauth: dict[str, Any], rid: str, tid: str, idem: str) -> StreamingResponse:
    model = str(body.get("model")).strip()
    messages = body.get("messages") or []
    prompt_tokens = estimate_prompt_tokens(messages)
    relay_payload = {"request_id": rid, "trace_id": tid, "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "external_model_name": model, "policy_code": policy.get("policy_code"), "route_hint": policy.get("route_hint"), "openai_request": {"model": model, "messages": messages, "max_tokens": positive_int(body.get("max_tokens"), 256, 131_072), "stream": True, "stream_options": {"include_usage": True}, "user": body.get("user", "")}}

    async def iterator() -> AsyncIterator[bytes]:
        assistant_text = ""
        usage: dict[str, Any] = {}
        stream_status = "completed"
        try:
            relay_headers = {"Accept": "text/event-stream", "Cache-Control": "no-cache"}
            internal_token = getenv("INTERNAL_SERVICE_TOKEN")
            if internal_token:
                relay_headers["X-Internal-Service-Token"] = internal_token
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", getenv("RELAY_BASE_URL", "http://relay:8080").rstrip("/") + "/internal/relay/chat-completions/stream", json=relay_payload, headers=relay_headers) as resp:
                    async for chunk in resp.aiter_bytes():
                        text = chunk.decode("utf-8", errors="ignore")
                        assistant_text += extract_sse_delta(text)
                        found_usage = extract_sse_usage(text)
                        if found_usage:
                            usage = found_usage
                        yield chunk
        except Exception as exc:
            stream_status = "errored"
            yield f'data: {json.dumps({"error": {"message": str(exc), "code": "relay_unreachable"}})}\n\n'.encode()
        finally:
            input_tokens = int(usage.get("prompt_tokens") or prompt_tokens)
            output_tokens = int(usage.get("completion_tokens") or estimate_text_tokens(assistant_text))
            await post_json(getenv("BILLING_BASE_URL", "http://billing:8080").rstrip("/") + "/internal/billing/finalize", {"request_id": rid, "trace_id": tid, "hold_id": preauth.get("hold_id"), "organization_id": auth["organization_id"], "project_id": auth["project_id"], "api_key_id": auth["api_key_id"], "model": model, "input_tokens": input_tokens, "output_tokens": output_tokens, "provider_cost": provider_cost(model, input_tokens, output_tokens), "authorized_amount": preauth.get("hold_amount"), "stream_status": stream_status, "idempotency_key": idem}, timeout=15)

    return StreamingResponse(iterator(), media_type="text/event-stream", headers={"X-Request-Id": rid, "X-Trace-Id": tid, "X-Hold-Id": str(preauth.get("hold_id", "")), "X-Gateway-Mode": "fastapi-chain-v1-relay-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


def extract_sse_delta(text: str) -> str:
    out = []
    for line in text.replace("\r\n", "\n").split("\n"):
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if not data or data == "[DONE]":
            continue
        try:
            payload = json.loads(data)
            delta = ((payload.get("choices") or [{}])[0].get("delta") or {})
            out.append(delta.get("content") or delta.get("reasoning_content") or delta.get("reasoning") or "")
        except Exception:
            pass
    return "".join(out)


def extract_sse_usage(text: str) -> dict[str, Any]:
    for line in text.replace("\r\n", "\n").split("\n"):
        if line.startswith("data:"):
            try:
                usage = json.loads(line[5:].strip()).get("usage")
                if isinstance(usage, dict):
                    return usage
            except Exception:
                pass
    return {}


def ensure_console_tables() -> None:
    statements = [
        "CREATE TABLE IF NOT EXISTS team_members (id VARCHAR(64) NOT NULL, display_name VARCHAR(128) NOT NULL, email VARCHAR(255) NOT NULL, role VARCHAR(32) NOT NULL, project_scope_json LONGTEXT NOT NULL, status VARCHAR(16) NOT NULL, last_active_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uk_team_members_email (email), KEY idx_team_members_role_status (role, status), KEY idx_team_members_status_updated (status, updated_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS webhook_configs (id VARCHAR(64) NOT NULL, name VARCHAR(128) NOT NULL, endpoint VARCHAR(512) NOT NULL, events_json LONGTEXT NOT NULL, status VARCHAR(16) NOT NULL, retry_policy VARCHAR(255) NOT NULL, signing_secret VARCHAR(128) NOT NULL, last_delivery_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_webhook_configs_status_updated (status, updated_at), KEY idx_webhook_configs_last_delivery (last_delivery_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS webhook_deliveries (delivery_id VARCHAR(96) NOT NULL, webhook_id VARCHAR(64) NOT NULL, webhook_name VARCHAR(128) NOT NULL, event_name VARCHAR(128) NOT NULL, status VARCHAR(16) NOT NULL, latency_ms INT NOT NULL DEFAULT 0, attempts INT NOT NULL DEFAULT 1, response_code INT NOT NULL DEFAULT 200, delivered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, trace_id VARCHAR(64) NULL, request_headers_json LONGTEXT NULL, request_body_json LONGTEXT NULL, response_body_json LONGTEXT NULL, PRIMARY KEY (delivery_id), KEY idx_webhook_deliveries_webhook_at (webhook_id, delivered_at), KEY idx_webhook_deliveries_status_at (status, delivered_at), KEY idx_webhook_deliveries_trace_id (trace_id), KEY idx_webhook_deliveries_delivered_at (delivered_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS invoice_records (id VARCHAR(64) NOT NULL, bill_id VARCHAR(64) NOT NULL, invoice_number VARCHAR(64) NOT NULL, status VARCHAR(16) NOT NULL, amount_usd DECIMAL(18,6) NOT NULL DEFAULT 0, period_start DATE NOT NULL, period_end DATE NOT NULL, due_date DATE NOT NULL, issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, billing_entity_name VARCHAR(255) NOT NULL, tax_id VARCHAR(64) NULL, currency CHAR(3) NOT NULL DEFAULT 'USD', notes TEXT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uk_invoice_records_bill_id (bill_id), KEY idx_invoice_records_status_due (status, due_date), KEY idx_invoice_records_period (period_start, period_end)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS bill_overrides (bill_id VARCHAR(64) NOT NULL, status VARCHAR(16) NOT NULL, notes TEXT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (bill_id), KEY idx_bill_overrides_status_updated (status, updated_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS support_tickets (id VARCHAR(64) NOT NULL, ticket_number VARCHAR(64) NOT NULL, subject VARCHAR(255) NOT NULL, category VARCHAR(32) NOT NULL, priority VARCHAR(16) NOT NULL, status VARCHAR(16) NOT NULL, requester_name VARCHAR(128) NOT NULL, description TEXT NOT NULL, project_name VARCHAR(128) NULL, trace_id VARCHAR(64) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uk_support_ticket_number (ticket_number), KEY idx_support_tickets_status_updated (status, updated_at), KEY idx_support_tickets_priority_updated (priority, updated_at), KEY idx_support_tickets_trace_id (trace_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS support_ticket_replies (id VARCHAR(64) NOT NULL, ticket_id VARCHAR(64) NOT NULL, author_name VARCHAR(128) NOT NULL, author_role VARCHAR(16) NOT NULL, content TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_support_ticket_replies_ticket_created (ticket_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS filter_presets (id VARCHAR(96) NOT NULL, scope VARCHAR(128) NOT NULL, name VARCHAR(128) NOT NULL, values_json LONGTEXT NOT NULL, group_name VARCHAR(128) NULL, tags_json LONGTEXT NULL, visibility VARCHAR(16) NOT NULL DEFAULT 'private', is_default TINYINT(1) NOT NULL DEFAULT 0, is_pinned TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0, owner_user_id VARCHAR(96) NOT NULL, owner_email VARCHAR(255) NULL, owner_display_name VARCHAR(128) NULL, org_name VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, last_used_at DATETIME NULL, PRIMARY KEY (id), KEY idx_filter_presets_scope_visibility (scope, visibility), KEY idx_filter_presets_owner_scope (owner_user_id, scope), KEY idx_filter_presets_org_scope (org_name, scope), KEY idx_filter_presets_scope_recent (scope, last_used_at), KEY idx_filter_presets_scope_pinned (scope, is_pinned), KEY idx_filter_presets_scope_sort (scope, sort_order), KEY idx_filter_presets_scope_default (scope, is_default)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ]
    with db_conn() as conn:
        with conn.cursor() as cur:
            for statement in statements:
                cur.execute(statement)
            ensure_column(cur, "filter_presets", "is_pinned", "ALTER TABLE filter_presets ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0")
            ensure_column(cur, "filter_presets", "last_used_at", "ALTER TABLE filter_presets ADD COLUMN last_used_at DATETIME NULL")
            ensure_column(cur, "filter_presets", "sort_order", "ALTER TABLE filter_presets ADD COLUMN sort_order INT NOT NULL DEFAULT 0")
            ensure_column(cur, "filter_presets", "group_name", "ALTER TABLE filter_presets ADD COLUMN group_name VARCHAR(128) NULL")
            ensure_column(cur, "filter_presets", "tags_json", "ALTER TABLE filter_presets ADD COLUMN tags_json LONGTEXT NULL")
            ensure_column(cur, "filter_presets", "owner_email", "ALTER TABLE filter_presets ADD COLUMN owner_email VARCHAR(255) NULL")
            ensure_unique_index_if_clean(cur, "team_members", "uk_team_members_email", "ALTER TABLE team_members ADD UNIQUE KEY uk_team_members_email (email)", "SELECT COALESCE(SUM(cnt - 1), 0) AS n FROM (SELECT email, COUNT(*) AS cnt FROM team_members GROUP BY email HAVING COUNT(*) > 1) d")
            ensure_unique_index_if_clean(cur, "invoice_records", "uk_invoice_records_bill_id", "ALTER TABLE invoice_records ADD UNIQUE KEY uk_invoice_records_bill_id (bill_id)", "SELECT COALESCE(SUM(cnt - 1), 0) AS n FROM (SELECT bill_id, COUNT(*) AS cnt FROM invoice_records GROUP BY bill_id HAVING COUNT(*) > 1) d")
            ensure_unique_index_if_clean(cur, "support_tickets", "uk_support_ticket_number", "ALTER TABLE support_tickets ADD UNIQUE KEY uk_support_ticket_number (ticket_number)", "SELECT COALESCE(SUM(cnt - 1), 0) AS n FROM (SELECT ticket_number, COUNT(*) AS cnt FROM support_tickets GROUP BY ticket_number HAVING COUNT(*) > 1) d")
            ensure_index(cur, "team_members", "idx_team_members_role_status", "ALTER TABLE team_members ADD KEY idx_team_members_role_status (role, status)")
            ensure_index(cur, "team_members", "idx_team_members_status_updated", "ALTER TABLE team_members ADD KEY idx_team_members_status_updated (status, updated_at)")
            ensure_index(cur, "webhook_configs", "idx_webhook_configs_status_updated", "ALTER TABLE webhook_configs ADD KEY idx_webhook_configs_status_updated (status, updated_at)")
            ensure_index(cur, "webhook_configs", "idx_webhook_configs_last_delivery", "ALTER TABLE webhook_configs ADD KEY idx_webhook_configs_last_delivery (last_delivery_at)")
            ensure_index(cur, "webhook_deliveries", "idx_webhook_deliveries_webhook_at", "ALTER TABLE webhook_deliveries ADD KEY idx_webhook_deliveries_webhook_at (webhook_id, delivered_at)")
            ensure_index(cur, "webhook_deliveries", "idx_webhook_deliveries_status_at", "ALTER TABLE webhook_deliveries ADD KEY idx_webhook_deliveries_status_at (status, delivered_at)")
            ensure_index(cur, "webhook_deliveries", "idx_webhook_deliveries_trace_id", "ALTER TABLE webhook_deliveries ADD KEY idx_webhook_deliveries_trace_id (trace_id)")
            ensure_index(cur, "webhook_deliveries", "idx_webhook_deliveries_delivered_at", "ALTER TABLE webhook_deliveries ADD KEY idx_webhook_deliveries_delivered_at (delivered_at)")
            ensure_index(cur, "invoice_records", "idx_invoice_records_status_due", "ALTER TABLE invoice_records ADD KEY idx_invoice_records_status_due (status, due_date)")
            ensure_index(cur, "invoice_records", "idx_invoice_records_period", "ALTER TABLE invoice_records ADD KEY idx_invoice_records_period (period_start, period_end)")
            ensure_index(cur, "bill_overrides", "idx_bill_overrides_status_updated", "ALTER TABLE bill_overrides ADD KEY idx_bill_overrides_status_updated (status, updated_at)")
            ensure_index(cur, "support_tickets", "idx_support_tickets_status_updated", "ALTER TABLE support_tickets ADD KEY idx_support_tickets_status_updated (status, updated_at)")
            ensure_index(cur, "support_tickets", "idx_support_tickets_priority_updated", "ALTER TABLE support_tickets ADD KEY idx_support_tickets_priority_updated (priority, updated_at)")
            ensure_index(cur, "support_tickets", "idx_support_tickets_trace_id", "ALTER TABLE support_tickets ADD KEY idx_support_tickets_trace_id (trace_id)")
            ensure_index(cur, "support_ticket_replies", "idx_support_ticket_replies_ticket_created", "ALTER TABLE support_ticket_replies ADD KEY idx_support_ticket_replies_ticket_created (ticket_id, created_at)")
            ensure_index(cur, "filter_presets", "idx_filter_presets_scope_visibility", "ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_visibility (scope, visibility)")
            ensure_index(cur, "filter_presets", "idx_filter_presets_owner_scope", "ALTER TABLE filter_presets ADD KEY idx_filter_presets_owner_scope (owner_user_id, scope)")
            ensure_index(cur, "filter_presets", "idx_filter_presets_org_scope", "ALTER TABLE filter_presets ADD KEY idx_filter_presets_org_scope (org_name, scope)")
            ensure_index(cur, "filter_presets", "idx_filter_presets_scope_recent", "ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_recent (scope, last_used_at)")
            ensure_index(cur, "filter_presets", "idx_filter_presets_scope_pinned", "ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_pinned (scope, is_pinned)")
            ensure_index(cur, "filter_presets", "idx_filter_presets_scope_sort", "ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_sort (scope, sort_order)")
            ensure_index(cur, "filter_presets", "idx_filter_presets_scope_default", "ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_default (scope, is_default)")
            cur.execute("SELECT COUNT(1) AS n FROM team_members")
            if int(cur.fetchone()["n"]) == 0:
                cur.execute("INSERT INTO team_members (id, display_name, email, role, project_scope_json, status, last_active_at) VALUES ('tm_owner', 'Demo Owner', 'owner@example.com', 'org_admin', '[\"all\"]', 'active', NOW())")


def ensure_platform_database_hardening() -> None:
    with db_conn() as conn:
        with conn.cursor() as cur:
            ensure_index(cur, "api_keys", "idx_api_keys_project_status", "ALTER TABLE api_keys ADD KEY idx_api_keys_project_status (project_id, status)")
            ensure_index(cur, "api_keys", "idx_api_keys_prefix_status", "ALTER TABLE api_keys ADD KEY idx_api_keys_prefix_status (key_prefix, status)")
            ensure_index(cur, "balance_ledger", "idx_balance_ledger_reference", "ALTER TABLE balance_ledger ADD KEY idx_balance_ledger_reference (reference_type, reference_id)")
            ensure_index(cur, "balance_ledger", "idx_balance_ledger_api_key_created", "ALTER TABLE balance_ledger ADD KEY idx_balance_ledger_api_key_created (api_key_id, created_at)")
            ensure_index(cur, "balance_ledger", "idx_balance_ledger_project_created", "ALTER TABLE balance_ledger ADD KEY idx_balance_ledger_project_created (project_id, created_at)")
            ensure_index(cur, "model_entitlements", "idx_model_entitlements_model_enabled", "ALTER TABLE model_entitlements ADD KEY idx_model_entitlements_model_enabled (external_model_name, is_enabled)")
            ensure_index(cur, "provider_routes", "idx_provider_routes_active_priority", "ALTER TABLE provider_routes ADD KEY idx_provider_routes_active_priority (external_model_name, is_active, priority, weight)")
            ensure_index(cur, "provider_routes", "idx_provider_routes_provider_model", "ALTER TABLE provider_routes ADD KEY idx_provider_routes_provider_model (provider_code, provider_model, is_active)")
            ensure_index(cur, "provider_routes", "idx_provider_routes_tenant_active", "ALTER TABLE provider_routes ADD KEY idx_provider_routes_tenant_active (tenant_scope, is_active, priority)")
            ensure_index(cur, "request_traces", "idx_request_traces_created_at", "ALTER TABLE request_traces ADD KEY idx_request_traces_created_at (created_at)")
            ensure_index(cur, "request_traces", "idx_request_traces_project_created_at", "ALTER TABLE request_traces ADD KEY idx_request_traces_project_created_at (project_id, created_at)")
            ensure_index(cur, "request_traces", "idx_request_traces_api_key_created_at", "ALTER TABLE request_traces ADD KEY idx_request_traces_api_key_created_at (api_key_id, created_at)")
            ensure_index(cur, "usage_records", "idx_usage_records_finished_at", "ALTER TABLE usage_records ADD KEY idx_usage_records_finished_at (finished_at)")
            ensure_index(cur, "usage_records", "idx_usage_records_project_finished", "ALTER TABLE usage_records ADD KEY idx_usage_records_project_finished (project_id, finished_at)")
            ensure_index(cur, "usage_records", "idx_usage_records_api_key_finished", "ALTER TABLE usage_records ADD KEY idx_usage_records_api_key_finished (api_key_id, finished_at)")
            ensure_index(cur, "usage_records", "idx_usage_records_status_finished", "ALTER TABLE usage_records ADD KEY idx_usage_records_status_finished (settlement_status, finished_at)")
            ensure_index(cur, "usage_records", "idx_usage_records_model_finished", "ALTER TABLE usage_records ADD KEY idx_usage_records_model_finished (external_model_name, finished_at)")
            ensure_constraint(cur, "balance_ledger", "chk_balance_ledger_non_negative_amount", "ALTER TABLE balance_ledger ADD CONSTRAINT chk_balance_ledger_non_negative_amount CHECK (amount >= 0)")
            ensure_constraint(cur, "usage_records", "chk_usage_records_non_negative_amounts", "ALTER TABLE usage_records ADD CONSTRAINT chk_usage_records_non_negative_amounts CHECK (provider_cost >= 0 AND sale_amount >= 0 AND billable_units >= 0)")
            ensure_constraint(cur, "provider_routes", "chk_provider_routes_positive_routing", "ALTER TABLE provider_routes ADD CONSTRAINT chk_provider_routes_positive_routing CHECK (priority >= 0 AND weight >= 0 AND cost_per_input_1k >= 0 AND cost_per_output_1k >= 0 AND latency_slo_ms >= 0)")


def parse_page(request: Request) -> tuple[int, int]:
    try:
        page = max(1, int(request.query_params.get("page", "1") or "1"))
    except ValueError:
        page = 1
    try:
        page_size = min(200, max(1, int(request.query_params.get("page_size", request.query_params.get("pageSize", "20")) or "20")))
    except ValueError:
        page_size = 20
    return page, page_size


def paginate(items: list[dict[str, Any]], request: Request) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    page, page_size = parse_page(request)
    start = (page - 1) * page_size
    return items[start : start + page_size], {"page": page, "pageSize": page_size, "total": len(items)}


def csv_response(filename: str, headers: list[str], rows: list[list[Any]]) -> Response:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows([[csv_cell(cell) for cell in row] for row in rows])
    return Response(buffer.getvalue(), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


def csv_cell(value: Any) -> Any:
    normalized = json_default(value)
    if not isinstance(normalized, str):
        return normalized
    return "'" + normalized if normalized.startswith(("=", "+", "-", "@")) else normalized


@app.get("/v1/projects/current/settings")
def project_settings_get(request: Request) -> JSONResponse:
    project_id = session_project_id(request)
    if project_id is None:
        return write_error(401, "session_required", "project context is required")
    row = query_one("SELECT id, name, env, monthly_cost_cap, metadata FROM projects WHERE id = %s LIMIT 1", (project_id,))
    if not row:
        return write_error(404, "project_not_found", "project not found")
    meta = parse_json_maybe(row.get("metadata"), {})
    settings = meta.get("console_settings") if isinstance(meta, dict) else {}
    settings = settings if isinstance(settings, dict) else {}
    env = {"prod": "production", "staging": "staging"}.get(row["env"], "development")
    return write_data({"projectId": str(row["id"]), "projectName": row["name"], "environment": env, "defaultModel": settings.get("defaultModel", "chat-pro"), "callbackUrl": settings.get("callbackUrl", ""), "monthlyBudgetUsd": float(settings.get("monthlyBudgetUsd", row["monthly_cost_cap"] or 0)), "allowedOrigins": settings.get("allowedOrigins", []), "tags": settings.get("tags", [])})


@app.put("/v1/projects/current/settings")
async def project_settings_put(request: Request) -> JSONResponse:
    project_id = session_project_id(request)
    if project_id is None:
        return write_error(401, "session_required", "project context is required")
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    errors: dict[str, str] = {}
    if len(str(payload.get("projectName", "")).strip()) < 2:
        errors["projectName"] = "projectName must contain at least 2 characters"
    if payload.get("environment") not in {"production", "staging", "development"}:
        errors["environment"] = "environment must be production, staging or development"
    allowed_origins = payload.get("allowedOrigins", [])
    if not isinstance(allowed_origins, list) or len(allowed_origins) > 50 or any(not is_safe_public_url(origin, allow_http_local=True) for origin in allowed_origins):
        errors["allowedOrigins"] = "allowed origins must be http(s) URLs"
    callback_url = str(payload.get("callbackUrl", "") or "").strip()
    if callback_url and not is_safe_public_url(callback_url, allow_http_local=True):
        errors["callbackUrl"] = "callbackUrl must be a safe http(s) URL"
    if errors:
        return write_error(422, "validation_failed", "project settings validation failed", {"fieldErrors": errors})
    meta = {"console_settings": {"defaultModel": payload.get("defaultModel", "chat-pro"), "callbackUrl": payload.get("callbackUrl", ""), "monthlyBudgetUsd": payload.get("monthlyBudgetUsd", 0), "allowedOrigins": payload.get("allowedOrigins", []), "tags": payload.get("tags", [])}}
    db_env = "prod" if payload["environment"] == "production" else payload["environment"]
    exec_sql("UPDATE projects SET name = %s, env = %s, monthly_cost_cap = %s, metadata = %s, updated_at = NOW() WHERE id = %s", (payload["projectName"], db_env, payload.get("monthlyBudgetUsd", 0), json.dumps(meta), project_id))
    return project_settings_get(request)


@app.get("/v1/security/settings")
def security_settings_get(request: Request) -> JSONResponse:
    org_id = session_org_id(request)
    if org_id is None:
        return write_error(401, "session_required", "organization context is required")
    row = query_one("SELECT id, metadata, updated_at FROM organizations WHERE id = %s LIMIT 1", (org_id,))
    if not row:
        return write_error(404, "organization_not_found", "organization not found")
    meta = parse_json_maybe(row.get("metadata"), {})
    sec = meta.get("security_settings") if isinstance(meta, dict) else {}
    sec = sec if isinstance(sec, dict) else {}
    return write_data({"organizationId": str(row["id"]), "mfaRequired": bool(sec.get("mfaRequired", False)), "sessionTimeoutMinutes": int(sec.get("sessionTimeoutMinutes", 120)), "ipAllowlist": sec.get("ipAllowlist", []), "webhookSignatureRequired": bool(sec.get("webhookSignatureRequired", True)), "keyRotationDays": int(sec.get("keyRotationDays", 90)), "lastSecurityReviewAt": sec.get("lastSecurityReviewAt", json_default(row["updated_at"]))})


@app.put("/v1/security/settings")
async def security_settings_put(request: Request) -> JSONResponse:
    org_id = session_org_id(request)
    if org_id is None:
        return write_error(401, "session_required", "organization context is required")
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    errors: dict[str, str] = {}
    timeout = positive_int(payload.get("sessionTimeoutMinutes"), 120, 1440)
    if timeout < 15 or timeout > 1440:
        errors["sessionTimeoutMinutes"] = "session timeout must be between 15 and 1440 minutes"
    ip_allowlist = payload.get("ipAllowlist", [])
    if not isinstance(ip_allowlist, list) or len(ip_allowlist) > 200:
        errors["ipAllowlist"] = "ipAllowlist must be a list with at most 200 entries"
    else:
        for item in ip_allowlist:
            try:
                ipaddress.ip_network(str(item).strip(), strict=False)
            except ValueError:
                errors["ipAllowlist"] = "ipAllowlist entries must be valid IP addresses or CIDR ranges"
                break
    if errors:
        return write_error(422, "validation_failed", "security settings validation failed", {"fieldErrors": errors})
    meta = {"security_settings": {**payload, "lastSecurityReviewAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}}
    exec_sql("UPDATE organizations SET metadata = %s, updated_at = NOW() WHERE id = %s", (json.dumps(meta), org_id))
    return security_settings_get(request)


MODEL_DEFAULTS: dict[str, dict[str, Any]] = {
    "chat-basic": {"summary": "Low-cost conversational model.", "contextWindow": "128K", "modalities": ["text"], "maxOutputTokens": 4096, "latencyTier": "standard", "bestFor": ["FAQ", "support"], "limitations": ["Limited reasoning"], "defaultTemperature": 0.6, "streamingSupported": True},
    "chat-pro": {"summary": "High-quality general conversation model.", "contextWindow": "128K", "modalities": ["text"], "maxOutputTokens": 8192, "latencyTier": "standard", "bestFor": ["chat", "content generation"], "limitations": ["Use workflows for complex tools"], "defaultTemperature": 0.4, "streamingSupported": True},
    "reasoning-pro": {"summary": "Reasoning model for planning and analysis.", "contextWindow": "128K", "modalities": ["text"], "maxOutputTokens": 8192, "latencyTier": "priority", "bestFor": ["reasoning", "debugging"], "limitations": ["Higher latency"], "defaultTemperature": 0.2, "streamingSupported": True},
    "vision-pro": {"summary": "Multimodal model for image understanding.", "contextWindow": "64K", "modalities": ["text", "image"], "maxOutputTokens": 4096, "latencyTier": "priority", "bestFor": ["vision QA"], "limitations": ["Requires image URL or data URL"], "defaultTemperature": 0.3, "streamingSupported": True},
    "embedding-large": {"summary": "Embedding model for retrieval.", "contextWindow": "32K", "modalities": ["text"], "maxOutputTokens": 0, "latencyTier": "batch", "bestFor": ["RAG", "semantic search"], "limitations": ["No text generation"], "defaultTemperature": 0, "streamingSupported": False},
}


def provider_model_id(provider: str, model: str) -> str:
    return "provider__" + provider + "__" + base64.urlsafe_b64encode(model.encode()).decode().rstrip("=")


def parse_provider_model_id(model_id: str) -> tuple[str, str] | None:
    if not model_id.startswith("provider__"):
        return None
    parts = model_id.removeprefix("provider__").split("__", 1)
    if len(parts) != 2:
        return None
    padding = "=" * (-len(parts[1]) % 4)
    return parts[0], base64.urlsafe_b64decode(parts[1] + padding).decode()


def pricing_text(input_cost: Any, output_cost: Any, active: int) -> str:
    if active <= 0:
        return "No active upstream route."
    return f"${float(input_cost):.4f} / 1K input - ${float(output_cost):.4f} / 1K output"


@app.get("/v1/models")
def models() -> JSONResponse:
    rows = query_all(
        """
        SELECT external_model_name, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_routes,
               COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_input_1k END), 0) AS min_input_cost,
               COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_output_1k END), 0) AS min_output_cost,
               COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN is_active = 1 THEN provider_code END ORDER BY priority SEPARATOR ','), '') AS providers
        FROM provider_routes GROUP BY external_model_name ORDER BY external_model_name ASC
        """
    )
    entitlements = {row["external_model_name"]: bool(row["enabled"]) for row in query_all("SELECT external_model_name, MAX(is_enabled) AS enabled FROM model_entitlements GROUP BY external_model_name")}
    items = []
    for row in rows:
        model = row["external_model_name"]
        defaults = MODEL_DEFAULTS.get(model, MODEL_DEFAULTS["chat-pro"])
        providers = [p for p in str(row["providers"] or "").split(",") if p]
        active = int(row["active_routes"] or 0)
        items.append({"id": model, "publicName": model, "summary": defaults["summary"] + (f" Providers: {' / '.join(providers)}" if providers else ""), "contextWindow": defaults["contextWindow"], "modalities": defaults["modalities"], "pricingText": pricing_text(row["min_input_cost"], row["min_output_cost"], active), "available": active > 0 and entitlements.get(model, True)})
    provider_rows = query_all(
        """
        SELECT provider_code, provider_model, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_routes,
               COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_input_1k END), 0) AS min_input_cost,
               COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_output_1k END), 0) AS min_output_cost,
               COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN is_active = 1 THEN external_model_name END ORDER BY external_model_name SEPARATOR ','), '') AS logical_models
        FROM provider_routes WHERE provider_code LIKE 'nvidia%%' GROUP BY provider_code, provider_model ORDER BY provider_code ASC, provider_model ASC
        """
    )
    for row in provider_rows:
        logical = [m for m in str(row["logical_models"] or "").split(",") if m]
        active = int(row["active_routes"] or 0)
        items.append({"id": provider_model_id(row["provider_code"], row["provider_model"]), "publicName": f"NVIDIA · {row['provider_code']} · {row['provider_model']}", "summary": f"NVIDIA provider card. Mapped logical models: {' / '.join(logical)}.", "contextWindow": "Inherited from logical model", "modalities": ["text"], "pricingText": pricing_text(row["min_input_cost"], row["min_output_cost"], active), "available": active > 0})
    return write_data(items)


@app.get("/v1/models/{model_id:path}")
def model_detail(model_id: str) -> JSONResponse:
    parsed = parse_provider_model_id(model_id)
    if parsed:
        provider, provider_model = parsed
        rows = query_all("SELECT external_model_name, internal_model_profile, cost_per_input_1k, cost_per_output_1k, latency_slo_ms, is_active FROM provider_routes WHERE provider_code = %s AND provider_model = %s ORDER BY is_active DESC, priority ASC, id ASC", (provider, provider_model))
        if not rows:
            return write_error(404, "model_not_found", "model not found")
        logical = sorted({row["external_model_name"] for row in rows})
        return write_data({"id": model_id, "publicName": f"NVIDIA · {provider} · {provider_model}", "summary": f"NVIDIA provider card. Covers logical models: {' / '.join(logical)}", "contextWindow": "Inherited from logical model", "modalities": ["text"], "pricingText": pricing_text(rows[0]["cost_per_input_1k"], rows[0]["cost_per_output_1k"], sum(1 for r in rows if r["is_active"])), "available": any(r["is_active"] for r in rows), "maxOutputTokens": 8192, "latencyTier": "standard", "routeProfiles": sorted({r["internal_model_profile"] for r in rows}), "backingProviders": [f"{provider} ({provider_model})"], "bestFor": ["provider validation", "fallback routing"], "limitations": ["Provider cards are not public API model names."], "defaultTemperature": 0.3, "streamingSupported": True})
    rows = query_all("SELECT provider_code, provider_model, internal_model_profile, cost_per_input_1k, cost_per_output_1k, latency_slo_ms, is_active FROM provider_routes WHERE external_model_name = %s ORDER BY is_active DESC, priority ASC, id ASC", (model_id,))
    if not rows:
        return write_error(404, "model_not_found", "model not found")
    defaults = MODEL_DEFAULTS.get(model_id, MODEL_DEFAULTS["chat-pro"])
    return write_data({"id": model_id, "publicName": model_id, "summary": defaults["summary"], "contextWindow": defaults["contextWindow"], "modalities": defaults["modalities"], "pricingText": pricing_text(rows[0]["cost_per_input_1k"], rows[0]["cost_per_output_1k"], sum(1 for r in rows if r["is_active"])), "available": any(r["is_active"] for r in rows), "maxOutputTokens": defaults["maxOutputTokens"], "latencyTier": defaults["latencyTier"], "routeProfiles": sorted({r["internal_model_profile"] for r in rows}), "backingProviders": sorted({f"{r['provider_code']} ({r['provider_model']})" for r in rows}), "bestFor": defaults["bestFor"], "limitations": defaults["limitations"], "defaultTemperature": defaults["defaultTemperature"], "streamingSupported": defaults["streamingSupported"]})


@app.get("/v1/request-logs")
def request_logs(request: Request) -> JSONResponse:
    trace = request.query_params.get("trace_id", "").strip()
    sql = """
        SELECT ur.request_id AS id, ur.trace_id AS traceId, ur.external_model_name AS modelName, p.name AS projectName,
               ak.name AS apiKeyName, ur.provider_code AS providerCode, ur.input_tokens AS inputTokens,
               ur.output_tokens AS outputTokens, ur.sale_amount AS costUsd, ur.settlement_status AS requestStatus,
               ur.finished_at AS createdAt
        FROM usage_records ur
        LEFT JOIN projects p ON p.id = ur.project_id
        LEFT JOIN api_keys ak ON ak.id = ur.api_key_id
    """
    params: tuple[Any, ...] = ()
    if trace:
        sql += " WHERE ur.trace_id = %s"
        params = (trace,)
    sql += " ORDER BY ur.finished_at DESC LIMIT 200"
    items = query_all(sql, params)
    page_items, meta = paginate(items, request)
    if trace:
        meta["traceId"] = trace
    return write_data(page_items, meta)


@app.get("/v1/request-logs/{trace:path}")
def request_log_detail(trace: str) -> JSONResponse:
    rows = query_all("SELECT * FROM request_traces WHERE trace_id = %s OR request_id = %s ORDER BY id DESC LIMIT 1", (trace, trace))
    if not rows:
        return write_error(404, "request_log_not_found", "request log not found")
    row = rows[0]
    usage = query_one("SELECT * FROM usage_records WHERE trace_id = %s OR request_id = %s ORDER BY id DESC LIMIT 1", (trace, trace)) or {}
    return write_data({"id": row.get("request_id"), "traceId": row.get("trace_id"), "statusCode": row.get("edge_status_code"), "providerStatusCode": row.get("provider_status_code"), "latencyMs": row.get("latency_ms"), "streamDurationMs": row.get("stream_duration_ms"), "errorCode": row.get("error_code"), "errorMessageMasked": row.get("error_message_masked"), "routeSnapshot": parse_json_maybe(row.get("route_snapshot_json"), {}), "usage": usage})


@app.get("/v1/team/members")
def team_members(request: Request) -> JSONResponse:
    items = query_all("SELECT id, display_name AS displayName, email, role, project_scope_json AS projectScope, status, last_active_at AS lastActiveAt FROM team_members ORDER BY created_at ASC")
    for item in items:
        item["projectScope"] = list_from_json(item.get("projectScope"))
    page_items, meta = paginate(items, request)
    return write_data(page_items, meta)


@app.get("/v1/team/members/export")
def team_members_export() -> Response:
    rows = query_all("SELECT display_name, email, role, status, last_active_at FROM team_members ORDER BY created_at ASC")
    return csv_response("team-members.csv", ["display_name", "email", "role", "status", "last_active_at"], [[r["display_name"], r["email"], r["role"], r["status"], json_default(r["last_active_at"])] for r in rows])


@app.post("/v1/team/invitations")
async def team_invite(request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    member_id = f"tm_{time.time_ns()}"
    email = str(payload.get("email", "")).strip()
    role = str(payload.get("role", "member")).strip()
    allowed_roles = {"member", "project_admin", "org_admin", "finance", "ops_admin"}
    if not is_valid_email(email):
        return write_error(422, "validation_failed", "team invitation validation failed", {"fieldErrors": {"email": "email is invalid"}})
    if role not in allowed_roles:
        return write_error(422, "validation_failed", "team invitation validation failed", {"fieldErrors": {"role": "role is invalid"}})
    existing = query_one("SELECT id FROM team_members WHERE email = %s AND status IN ('active','invited') LIMIT 1", (email,))
    if existing:
        return write_error(409, "team_member_exists", "team member already exists")
    scope = payload.get("projectScope") if isinstance(payload.get("projectScope"), list) else ["all"]
    exec_sql("INSERT INTO team_members (id, display_name, email, role, project_scope_json, status, last_active_at) VALUES (%s, %s, %s, %s, %s, 'invited', NULL)", (member_id, email.split("@")[0] or email, email, role, json.dumps(scope)))
    return write_data({"id": member_id, "email": email, "role": role, "status": "invited"})


@app.put("/v1/team/members/{member_id}")
async def team_update(member_id: str, request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    role = str(payload.get("role", "member")).strip()
    status = str(payload.get("status", "active")).strip()
    if role not in {"member", "project_admin", "org_admin", "finance", "ops_admin"}:
        return write_error(422, "validation_failed", "team member validation failed", {"fieldErrors": {"role": "role is invalid"}})
    if status not in {"active", "invited", "disabled"}:
        return write_error(422, "validation_failed", "team member validation failed", {"fieldErrors": {"status": "status is invalid"}})
    scope = payload.get("projectScope") if isinstance(payload.get("projectScope"), list) else ["all"]
    exec_sql("UPDATE team_members SET role = %s, project_scope_json = %s, status = %s, updated_at = NOW() WHERE id = %s", (role, json.dumps(scope), status, member_id))
    return write_data({"id": member_id, "role": role, "projectScope": scope, "status": status})


@app.get("/v1/webhooks")
def webhooks(request: Request) -> JSONResponse:
    items = query_all("SELECT id, name, endpoint, events_json AS events, status, retry_policy AS retryPolicy, last_delivery_at AS lastDeliveryAt FROM webhook_configs ORDER BY created_at DESC")
    for item in items:
        item["events"] = list_from_json(item["events"])
    page_items, meta = paginate(items, request)
    return write_data(page_items, meta)


@app.post("/v1/webhooks")
async def webhook_create(request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    name = bounded_text(payload.get("name"), 2, 128)
    endpoint = str(payload.get("endpoint", "")).strip()
    events = payload.get("events", [])
    if not name or not is_safe_public_url(endpoint) or not isinstance(events, list) or len(events) > 50:
        return write_error(422, "validation_failed", "webhook validation failed", {"fieldErrors": {"name": "name is required", "endpoint": "endpoint must be a safe http(s) URL", "events": "events must be a list"}})
    webhook_id = f"wh_{time.time_ns()}"
    secret = f"whsec_{uuid.uuid4().hex}"
    exec_sql("INSERT INTO webhook_configs (id, name, endpoint, events_json, status, retry_policy, signing_secret) VALUES (%s, %s, %s, %s, 'active', %s, %s)", (webhook_id, name, endpoint, json.dumps([str(event)[:128] for event in events]), payload.get("retryPolicy", "3 retries"), secret))
    return write_data({"id": webhook_id, "name": name, "endpoint": endpoint, "events": events, "signingSecret": secret, "status": "active"})


@app.put("/v1/webhooks/{webhook_id}")
async def webhook_update(webhook_id: str, request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    name = bounded_text(payload.get("name"), 2, 128)
    endpoint = str(payload.get("endpoint", "")).strip()
    events = payload.get("events", [])
    status = str(payload.get("status", "active")).strip()
    if not name or not is_safe_public_url(endpoint) or not isinstance(events, list) or len(events) > 50 or status not in {"active", "paused", "disabled"}:
        return write_error(422, "validation_failed", "webhook validation failed")
    exec_sql("UPDATE webhook_configs SET name=%s, endpoint=%s, events_json=%s, retry_policy=%s, status=%s, updated_at=NOW() WHERE id=%s", (name, endpoint, json.dumps([str(event)[:128] for event in events]), payload.get("retryPolicy", "3 retries"), status, webhook_id))
    return write_data({"id": webhook_id, **payload, "name": name, "endpoint": endpoint, "events": events, "status": status})


@app.get("/v1/webhooks/export")
def webhooks_export() -> Response:
    rows = query_all("SELECT name, endpoint, status, last_delivery_at FROM webhook_configs ORDER BY created_at DESC")
    return csv_response("webhooks.csv", ["name", "endpoint", "status", "last_delivery_at"], [[r["name"], r["endpoint"], r["status"], json_default(r["last_delivery_at"])] for r in rows])


@app.post("/v1/webhooks/test")
async def webhook_test(request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    delivery_id = f"del_test_{time.time_ns()}"
    exec_sql("INSERT INTO webhook_deliveries (delivery_id, webhook_id, webhook_name, event_name, status, latency_ms, attempts, response_code, delivered_at, trace_id, request_headers_json, request_body_json, response_body_json) VALUES (%s, %s, 'Manual Test Delivery', %s, 'delivered', 42, 1, 200, NOW(), %s, %s, %s, %s)", (delivery_id, payload.get("webhookId", ""), payload.get("event", "test.event"), f"trace_test_{time.time_ns()}", json.dumps({"content-type": "application/json"}), json.dumps({"event": payload.get("event", "test.event")}), json.dumps({"accepted": True})))
    return write_data({"deliveryId": delivery_id, "webhookId": payload.get("webhookId"), "event": payload.get("event"), "status": "delivered", "latencyMs": 42})


@app.get("/v1/webhooks/deliveries")
def webhook_deliveries() -> JSONResponse:
    rows = query_all("SELECT delivery_id AS deliveryId, webhook_id AS webhookId, webhook_name AS webhookName, event_name AS event, status, latency_ms AS latencyMs, attempts, response_code AS responseCode, delivered_at AS deliveredAt, trace_id AS traceId FROM webhook_deliveries ORDER BY delivered_at DESC LIMIT 100")
    return write_data(rows)


@app.get("/v1/webhooks/deliveries/{delivery_id}")
def webhook_delivery_detail(delivery_id: str) -> JSONResponse:
    row = query_one("SELECT delivery_id AS deliveryId, webhook_id AS webhookId, event_name AS event, status, latency_ms AS latencyMs, attempts, response_code AS responseCode, delivered_at AS deliveredAt, request_headers_json, request_body_json, response_body_json FROM webhook_deliveries WHERE delivery_id = %s LIMIT 1", (delivery_id,))
    if not row:
        return write_error(404, "webhook_delivery_not_found", "webhook delivery not found")
    return write_data({"deliveryId": row["deliveryId"], "webhookId": row["webhookId"], "event": row["event"], "status": row["status"], "latencyMs": row["latencyMs"], "attempts": row["attempts"], "responseCode": row["responseCode"], "deliveredAt": row["deliveredAt"], "requestHeaders": parse_json_maybe(row["request_headers_json"], {}), "requestBody": parse_json_maybe(row["request_body_json"], {}), "responseBody": parse_json_maybe(row["response_body_json"], {})})


@app.get("/v1/webhooks/{webhook_id}/deliveries/latest")
def webhook_latest_delivery(webhook_id: str) -> JSONResponse:
    row = query_one("SELECT delivery_id FROM webhook_deliveries WHERE webhook_id = %s ORDER BY delivered_at DESC LIMIT 1", (webhook_id,))
    if not row:
        return write_error(404, "webhook_delivery_not_found", "latest webhook delivery not found")
    return webhook_delivery_detail(row["delivery_id"])


def bill_month_key(bill_id: str) -> str | None:
    raw = str(bill_id or "").strip()
    for prefix in ("bill_", "BILL-", "BILL_", "bill-"):
        if raw.startswith(prefix):
            raw = raw[len(prefix) :]
            break
    normalized = raw.replace("_", "").replace("-", "")
    return normalized if len(normalized) == 6 and normalized.isdigit() else None


def bill_record_query() -> str:
    return """
        SELECT
          CONCAT('bill_', month_key) AS id,
          CONCAT('BILL-', month_key) AS billNumber,
          periodStart,
          periodEnd,
          DATE_ADD(periodEnd, INTERVAL 7 DAY) AS dueDate,
          amountUsd,
          amountUsd AS usageAmountUsd,
          0 AS subscriptionAmountUsd,
          0 AS adjustmentAmountUsd,
          COALESCE(bo.status, 'open') AS status,
          COALESCE(bo.notes, '') AS notes
        FROM (
          SELECT
            DATE_FORMAT(started_at, '%%Y%%m') AS month_key,
            MIN(DATE(started_at)) AS periodStart,
            MAX(DATE(started_at)) AS periodEnd,
            SUM(sale_amount) AS amountUsd
          FROM usage_records
          GROUP BY DATE_FORMAT(started_at, '%%Y%%m')
        ) bill_periods
        LEFT JOIN bill_overrides bo ON bo.bill_id = CONCAT('bill_', month_key)
    """


def filter_and_sort_bills(rows: list[dict[str, Any]], request: Request) -> list[dict[str, Any]]:
    query = request.query_params
    search = str(query.get("search", "") or "").strip().lower()
    statuses = {item.strip() for item in str(query.get("status", "") or "").split(",") if item.strip()}
    date_from = parse_date_value(query.get("date_from"))
    date_to = parse_date_value(query.get("date_to"))
    amount_min = non_negative_amount(query.get("amount_min")) if query.get("amount_min") is not None else None
    amount_max = non_negative_amount(query.get("amount_max")) if query.get("amount_max") is not None else None
    result = []
    for row in rows:
        haystack = " ".join(str(row.get(key, "")) for key in ("id", "billNumber", "status", "notes")).lower()
        if search and search not in haystack:
            continue
        if statuses and str(row.get("status")) not in statuses:
            continue
        period_start = parse_date_value(row.get("periodStart"))
        period_end = parse_date_value(row.get("periodEnd"))
        if date_from and period_end and period_end < date_from:
            continue
        if date_to and period_start and period_start > date_to:
            continue
        amount_usd = amount(row.get("amountUsd"))
        if amount_min is not None and amount_usd < amount_min:
            continue
        if amount_max is not None and amount_usd > amount_max:
            continue
        result.append(row)
    sort_by = str(query.get("sort_by", "periodStart") or "periodStart")
    reverse = str(query.get("sort_dir", "desc") or "desc").lower() != "asc"
    sort_keys = {
        "billNumber": lambda item: str(item.get("billNumber", "")),
        "periodStart": lambda item: str(json_default(item.get("periodStart")) or ""),
        "periodEnd": lambda item: str(json_default(item.get("periodEnd")) or ""),
        "dueDate": lambda item: str(json_default(item.get("dueDate")) or ""),
        "amountUsd": lambda item: float(item.get("amountUsd") or 0),
        "status": lambda item: str(item.get("status", "")),
    }
    result.sort(key=sort_keys.get(sort_by, sort_keys["periodStart"]), reverse=reverse)
    return result


@app.get("/v1/billing/bills")
def bills(request: Request) -> JSONResponse:
    rows = filter_and_sort_bills(query_all(bill_record_query()), request)
    page_items, meta = paginate(rows, request)
    return write_data(page_items, meta)


@app.get("/v1/billing/bills/export")
def bills_export(request: Request) -> Response:
    rows = filter_and_sort_bills(query_all(bill_record_query()), request)
    return csv_response("bills.csv", ["bill_number", "status", "amount_usd", "period_start", "period_end", "due_date"], [[r["billNumber"], r["status"], r["amountUsd"], r["periodStart"], r["periodEnd"], r["dueDate"]] for r in rows])


@app.get("/v1/billing/bills/{bill_id}")
def bill_detail(bill_id: str) -> JSONResponse:
    month_key = bill_month_key(bill_id)
    if not month_key:
        return write_error(404, "bill_not_found", "bill not found")
    rows = query_all(
        """
        SELECT
          external_model_name AS modelName,
          SUM(input_tokens) AS inputTokens,
          SUM(output_tokens) AS outputTokens,
          SUM(provider_cost) AS providerCostUsd,
          SUM(sale_amount) AS saleAmountUsd,
          MIN(DATE(started_at)) AS periodStart,
          MAX(DATE(started_at)) AS periodEnd
        FROM usage_records
        WHERE DATE_FORMAT(started_at, '%%Y%%m') = %s
        GROUP BY external_model_name
        ORDER BY saleAmountUsd DESC
        """,
        (month_key,),
    )
    if not rows:
        return write_error(404, "bill_not_found", "bill not found")
    canonical_id = f"bill_{month_key}"
    override = query_one("SELECT COALESCE(status, 'open') AS status, COALESCE(notes, '') AS notes FROM bill_overrides WHERE bill_id = %s LIMIT 1", (canonical_id,)) or {"status": "open", "notes": ""}
    total = sum(float(r["saleAmountUsd"] or 0) for r in rows)
    period_start = min((parse_date_value(r.get("periodStart")) for r in rows if r.get("periodStart")), default=None)
    period_end = max((parse_date_value(r.get("periodEnd")) for r in rows if r.get("periodEnd")), default=None)
    due_date = period_end + timedelta(days=7) if period_end else None
    line_items = [{"label": f"{row['modelName']} usage", "amountUsd": float(row["saleAmountUsd"] or 0), "category": "usage", "inputTokens": row["inputTokens"], "outputTokens": row["outputTokens"], "providerCostUsd": row["providerCostUsd"]} for row in rows]
    return write_data({"id": canonical_id, "billNumber": f"BILL-{month_key}", "status": override["status"], "amountUsd": total, "usageAmountUsd": total, "subscriptionAmountUsd": 0, "adjustmentAmountUsd": 0, "periodStart": period_start, "periodEnd": period_end, "dueDate": due_date, "currency": "USD", "lineItems": line_items, "notes": override["notes"]})


@app.put("/v1/billing/bills/{bill_id}")
async def bill_update(bill_id: str, request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    month_key = bill_month_key(bill_id)
    if not month_key:
        return write_error(404, "bill_not_found", "bill not found")
    status = {"paid": "settled"}.get(str(payload.get("status", "open")).strip(), str(payload.get("status", "open")).strip())
    if status not in {"open", "settled", "partial", "overdue"}:
        return write_error(422, "validation_failed", "bill validation failed", {"fieldErrors": {"status": "status must be open, settled, partial or overdue"}})
    if not query_one("SELECT 1 AS ok FROM usage_records WHERE DATE_FORMAT(started_at, '%%Y%%m') = %s LIMIT 1", (month_key,)):
        return write_error(404, "bill_not_found", "bill not found")
    notes = str(payload.get("notes", ""))[:2000]
    canonical_id = f"bill_{month_key}"
    exec_sql("INSERT INTO bill_overrides (bill_id, status, notes, updated_at) VALUES (%s, %s, %s, NOW()) ON DUPLICATE KEY UPDATE status=VALUES(status), notes=VALUES(notes), updated_at=NOW()", (canonical_id, status, notes))
    return bill_detail(canonical_id)


@app.get("/v1/billing/invoices")
def invoices(request: Request) -> JSONResponse:
    rows = query_all("SELECT id, bill_id AS billId, invoice_number AS invoiceNumber, status, amount_usd AS amountUsd, period_start AS periodStart, period_end AS periodEnd, due_date AS dueDate, issued_at AS issuedAt, billing_entity_name AS billingEntityName, COALESCE(tax_id,'') AS taxId, currency, COALESCE(notes,'') AS notes FROM invoice_records ORDER BY issued_at DESC")
    page_items, meta = paginate(rows, request)
    return write_data(page_items, meta)


@app.post("/v1/billing/invoices")
async def invoice_create(request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    amount_usd = non_negative_amount(payload.get("amountUsd"))
    due_date = parse_date_value(payload.get("dueDate")) or date.today() + timedelta(days=7)
    billing_entity_name = bounded_text(payload.get("billingEntityName", "Demo Organization"), 2, 255)
    if amount_usd is None or not billing_entity_name:
        return write_error(422, "validation_failed", "invoice validation failed", {"fieldErrors": {"amountUsd": "amount must be non-negative", "billingEntityName": "billing entity name is required"}})
    bill_id = payload.get("billId") or f"bill_{datetime.now().strftime('%Y_%m')}"
    invoice_id = f"inv_{time.time_ns()}"
    today = date.today()
    exec_sql("INSERT INTO invoice_records (id, bill_id, invoice_number, status, amount_usd, period_start, period_end, due_date, issued_at, billing_entity_name, tax_id, currency, notes) VALUES (%s, %s, %s, 'issued', %s, %s, %s, %s, NOW(), %s, %s, 'USD', %s)", (invoice_id, bill_id, f"INV-{time.time_ns()}", amount_usd, today.replace(day=1), today, due_date, billing_entity_name, str(payload.get("taxId", ""))[:128], str(payload.get("notes", ""))[:2000]))
    return invoice_detail(invoice_id)


@app.get("/v1/billing/invoices/export")
def invoices_export() -> Response:
    rows = query_all("SELECT invoice_number, status, amount_usd, period_start, period_end, due_date FROM invoice_records ORDER BY issued_at DESC")
    return csv_response("invoices.csv", ["invoice_number", "status", "amount_usd", "period_start", "period_end", "due_date"], [[r["invoice_number"], r["status"], r["amount_usd"], r["period_start"], r["period_end"], r["due_date"]] for r in rows])


@app.get("/v1/billing/invoices/{invoice_id}")
def invoice_detail(invoice_id: str) -> JSONResponse:
    row = query_one("SELECT id, bill_id AS billId, invoice_number AS invoiceNumber, status, amount_usd AS amountUsd, period_start AS periodStart, period_end AS periodEnd, due_date AS dueDate, issued_at AS issuedAt, billing_entity_name AS billingEntityName, COALESCE(tax_id,'') AS taxId, currency, COALESCE(notes,'') AS notes FROM invoice_records WHERE id = %s LIMIT 1", (invoice_id,))
    if not row:
        return write_error(404, "invoice_not_found", "invoice not found")
    return write_data(row)


@app.put("/v1/billing/invoices/{invoice_id}")
async def invoice_update(invoice_id: str, request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    status = str(payload.get("status", "issued")).strip()
    if status not in {"draft", "issued", "paid", "void", "overdue"}:
        return write_error(422, "validation_failed", "invoice validation failed", {"fieldErrors": {"status": "status is invalid"}})
    exec_sql("UPDATE invoice_records SET status=%s, billing_entity_name=COALESCE(NULLIF(%s,''), billing_entity_name), tax_id=%s, notes=%s, updated_at=NOW() WHERE id=%s", (status, str(payload.get("billingEntityName", ""))[:255], str(payload.get("taxId", ""))[:128], str(payload.get("notes", ""))[:2000], invoice_id))
    return invoice_detail(invoice_id)


@app.get("/v1/support/tickets")
def support_tickets() -> JSONResponse:
    rows = query_all("SELECT id, ticket_number AS ticketNumber, subject, category, priority, status, requester_name AS requesterName, created_at AS createdAt, updated_at AS updatedAt FROM support_tickets ORDER BY updated_at DESC")
    return write_data(rows)


@app.get("/v1/support/tickets/{ticket_id}")
def support_ticket_detail(ticket_id: str) -> JSONResponse:
    row = query_one("SELECT id, ticket_number AS ticketNumber, subject, category, priority, status, requester_name AS requesterName, description, COALESCE(project_name,'') AS projectName, trace_id AS traceId, created_at AS createdAt, updated_at AS updatedAt FROM support_tickets WHERE id = %s LIMIT 1", (ticket_id,))
    if not row:
        return write_error(404, "support_ticket_not_found", "support ticket not found")
    row["replies"] = query_all("SELECT id, author_name AS authorName, author_role AS authorRole, content, created_at AS createdAt FROM support_ticket_replies WHERE ticket_id = %s ORDER BY created_at ASC", (ticket_id,))
    return write_data(row)


@app.post("/v1/support/tickets/{ticket_id}/replies")
async def support_ticket_reply(ticket_id: str, request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    content = str(payload.get("content", "")).strip()
    if len(content) < 2 or len(content) > 5000:
        return write_error(422, "validation_failed", "reply validation failed", {"fieldErrors": {"content": "content must contain at least 2 characters"}})
    exec_sql("INSERT INTO support_ticket_replies (id, ticket_id, author_name, author_role, content, created_at) VALUES (%s, %s, 'Support Operator', 'support', %s, NOW())", (f"reply_{time.time_ns()}", ticket_id, content))
    exec_sql("UPDATE support_tickets SET status='pending', updated_at=NOW() WHERE id=%s", (ticket_id,))
    return support_ticket_detail(ticket_id)


@app.get("/v1/filter-presets")
def filter_presets(request: Request) -> JSONResponse:
    scope = request.query_params.get("scope", "")
    rows = query_all("SELECT id, scope, name, values_json AS valueJson, group_name AS groupName, tags_json AS tags, visibility, is_default AS isDefault, is_pinned AS isPinned, sort_order AS sortOrder, owner_user_id AS ownerUserId, owner_display_name AS ownerDisplayName, org_name AS orgName, created_at AS createdAt, updated_at AS updatedAt, last_used_at AS lastUsedAt FROM filter_presets WHERE scope=%s ORDER BY is_pinned DESC, is_default DESC, updated_at DESC", (scope,))
    for row in rows:
        row["values"] = parse_json_maybe(row.pop("valueJson", None), {})
        row["tags"] = list_from_json(row["tags"])
    return write_data(rows)


@app.post("/v1/filter-presets")
async def filter_preset_create(request: Request) -> JSONResponse:
    session = require_session_user(request)
    if isinstance(session, JSONResponse):
        return session
    owner_id, owner_name, org_name = session
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    name = bounded_text(payload.get("name"), 1, 128)
    scope = bounded_text(payload.get("scope"), 1, 96)
    values = payload.get("values", {})
    if not name or not scope or not isinstance(values, dict):
        return write_error(422, "validation_failed", "filter preset validation failed")
    preset_id = f"preset_{time.time_ns()}"
    exec_sql("INSERT INTO filter_presets (id, scope, name, values_json, group_name, tags_json, visibility, is_default, is_pinned, sort_order, owner_user_id, owner_display_name, org_name) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (preset_id, scope, name, json.dumps(values), str(payload.get("groupName", ""))[:128], json.dumps(payload.get("tags", []) if isinstance(payload.get("tags", []), list) else []), payload.get("visibility", "private"), bool(payload.get("isDefault", False)), bool(payload.get("isPinned", False)), non_negative_int(payload.get("sortOrder"), 0, 10_000), owner_id, owner_name, org_name))
    return write_data({"id": preset_id, **payload})


@app.put("/v1/filter-presets/{preset_id}")
async def filter_preset_update(preset_id: str, request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    name = bounded_text(payload.get("name"), 1, 128)
    values = payload.get("values", {})
    if not name or not isinstance(values, dict):
        return write_error(422, "validation_failed", "filter preset validation failed")
    exec_sql("UPDATE filter_presets SET name=%s, values_json=%s, group_name=%s, tags_json=%s, visibility=%s, is_default=%s, is_pinned=%s, sort_order=%s, updated_at=NOW() WHERE id=%s", (name, json.dumps(values), str(payload.get("groupName", ""))[:128], json.dumps(payload.get("tags", []) if isinstance(payload.get("tags", []), list) else []), payload.get("visibility", "private"), bool(payload.get("isDefault", False)), bool(payload.get("isPinned", False)), non_negative_int(payload.get("sortOrder"), 0, 10_000), preset_id))
    return write_data({"id": preset_id, **payload})


@app.delete("/v1/filter-presets/{preset_id}")
def filter_preset_delete(preset_id: str) -> JSONResponse:
    exec_sql("DELETE FROM filter_presets WHERE id=%s", (preset_id,))
    return write_data({"id": preset_id, "deleted": True})


@app.get("/v1/filter-presets/export")
def filter_presets_export(request: Request) -> JSONResponse:
    scope = request.query_params.get("scope", "")
    rows = query_all("SELECT name, values_json AS valueJson, group_name AS groupName, tags_json AS tags, visibility, is_default AS isDefault, is_pinned AS isPinned, sort_order AS sortOrder FROM filter_presets WHERE scope=%s", (scope,))
    for row in rows:
        row["values"] = parse_json_maybe(row.pop("valueJson", None), {})
        row["tags"] = list_from_json(row["tags"])
    return json_response({"version": "1.0", "exportedAt": now_utc(), "scope": scope, "presets": rows}, headers={"Content-Disposition": f'attachment; filename="filter-presets-{scope}.json"'})


@app.post("/v1/filter-presets/import")
async def filter_presets_import(request: Request) -> JSONResponse:
    payload = await request.json()
    if not isinstance(payload, dict):
        return write_error(400, "invalid_payload", "request body must be a JSON object")
    presets = payload.get("presets", [])
    if not isinstance(presets, list) or len(presets) > 100:
        return write_error(422, "validation_failed", "filter preset import validation failed")
    imported = 0
    for item in presets:
        if not isinstance(item, dict):
            continue
        item["scope"] = payload.get("scope", item.get("scope", "default"))
        await filter_preset_create_with_payload(request, item)
        imported += 1
    return write_data({"imported": imported})


async def filter_preset_create_with_payload(request: Request, payload: dict[str, Any]) -> None:
    session = require_session_user(request)
    if isinstance(session, JSONResponse):
        owner_id, owner_name, org_name = "anonymous@local", "Anonymous", "default-org"
    else:
        owner_id, owner_name, org_name = session
    preset_id = f"preset_{time.time_ns()}_{import_random_suffix()}"
    scope = bounded_text(payload.get("scope"), 1, 96) or "default"
    name = bounded_text(payload.get("name"), 1, 128) or "Imported preset"
    values = payload.get("values", {}) if isinstance(payload.get("values", {}), dict) else {}
    tags = payload.get("tags", []) if isinstance(payload.get("tags", []), list) else []
    exec_sql("INSERT INTO filter_presets (id, scope, name, values_json, group_name, tags_json, visibility, is_default, is_pinned, sort_order, owner_user_id, owner_display_name, org_name) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (preset_id, scope, name, json.dumps(values), str(payload.get("groupName", ""))[:128], json.dumps(tags), payload.get("visibility", "private"), bool(payload.get("isDefault", False)), bool(payload.get("isPinned", False)), non_negative_int(payload.get("sortOrder"), 0, 10_000), owner_id, owner_name, org_name))


def import_random_suffix() -> str:
    return uuid.uuid4().hex[:8]
