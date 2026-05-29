from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict, deque
from datetime import datetime
from threading import Lock
from urllib.parse import quote

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.app.config import (
    ADMIN_CONSOLE_PUBLIC_URL,
    ALLOW_CREDENTIALS,
    ALLOWED_ORIGINS,
    APP_NAME,
    CUSTOMER_CONSOLE_PUBLIC_URL,
    DIGITAL_LIFE_PUBLIC_URL,
    DOCS_ENABLED,
    FREETTS_BASE_URL,
    FRONTEND_DIR,
    IS_PRODUCTION,
    IT_TOOLS_PUBLIC_URL,
    NEW_API_URL,
    NEW_API_PUBLIC_URL,
    OPENCLAW_BASE_URL,
    OPENCLAW_MODEL,
    PLATFORM_CONSOLE_URL,
    PLATFORM_CONSOLE_PUBLIC_URL,
    PLATFORM_GATEWAY_URL,
    PLATFORM_GATEWAY_PUBLIC_URL,
    PLATFORM_OPS_URL,
    RATE_LIMIT_CHAT_PER_WINDOW,
    RATE_LIMIT_MEMORY_PER_WINDOW,
    RATE_LIMIT_TTS_PER_WINDOW,
    RATE_LIMIT_WINDOW_SECONDS,
    TTS_BASE_URL,
)
from backend.app.services.emotion import EmotionEngine
from backend.app.services.llm import LLMClient
from backend.app.services.memory import MemoryStore
from backend.app.services.session import SessionUser, session_from_cookies
from backend.app.services.tts import TTSClient


_fastapi_kwargs: dict = {"title": APP_NAME}
if not DOCS_ENABLED:
    _fastapi_kwargs.update(docs_url=None, redoc_url=None, openapi_url=None)

app = FastAPI(**_fastapi_kwargs)

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=None,
        allow_credentials=ALLOW_CREDENTIALS,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    )


_rate_buckets: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_rate_lock = Lock()
_logger = logging.getLogger("digital_life")

_RATE_LIMITS: dict[str, tuple[int, int]] = {
    "chat": (RATE_LIMIT_CHAT_PER_WINDOW, RATE_LIMIT_WINDOW_SECONDS),
    "tts": (RATE_LIMIT_TTS_PER_WINDOW, RATE_LIMIT_WINDOW_SECONDS),
    "memory": (RATE_LIMIT_MEMORY_PER_WINDOW, RATE_LIMIT_WINDOW_SECONDS),
}


def _rate_key(request: Request) -> str:
    user = _session_from_request(request)
    if user is not None:
        return f"user:{user.id}"
    auth = request.headers.get("authorization", "").strip()
    if auth.lower().startswith("bearer "):
        return f"key:{auth[7:].strip()[:64]}"
    fwd = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if fwd:
        return f"ip:{fwd}"
    if request.client and request.client.host:
        return f"ip:{request.client.host}"
    return "ip:unknown"


def _session_from_request(request: Request) -> SessionUser | None:
    cached = getattr(request.state, "session_user", "__unset__")
    if cached != "__unset__":
        return cached  # type: ignore[return-value]
    user = session_from_cookies(request.cookies)
    request.state.session_user = user
    return user


def _require_user(request: Request) -> SessionUser:
    user = _session_from_request(request)
    if user is None and IS_PRODUCTION:
        raise HTTPException(status_code=401, detail={"error": "session_required", "message": "login required"})
    return user  # type: ignore[return-value]


_user_memory_cache: dict[str, MemoryStore] = {}
_user_emotion_cache: dict[str, EmotionEngine] = {}
_user_cache_lock = Lock()


def memory_for(user: SessionUser | None) -> MemoryStore:
    key = user.id if user else "_anonymous"
    with _user_cache_lock:
        store = _user_memory_cache.get(key)
        if store is None:
            store = MemoryStore(key)
            _user_memory_cache[key] = store
        return store


def emotion_for(user: SessionUser | None) -> EmotionEngine:
    key = user.id if user else "_anonymous"
    with _user_cache_lock:
        engine = _user_emotion_cache.get(key)
        if engine is None:
            engine = EmotionEngine(key)
            _user_emotion_cache[key] = engine
        return engine


def enforce_rate_limit(request: Request, bucket: str) -> None:
    limit, window = _RATE_LIMITS.get(bucket, (0, 0))
    if limit <= 0 or window <= 0:
        return
    key = (bucket, _rate_key(request))
    now = time.monotonic()
    with _rate_lock:
        queue = _rate_buckets[key]
        cutoff = now - window
        while queue and queue[0] <= cutoff:
            queue.popleft()
        if len(queue) >= limit:
            retry_after = max(1, int(window - (now - queue[0])))
            raise HTTPException(
                status_code=429,
                detail={"error": "rate_limited", "retry_after_seconds": retry_after, "bucket": bucket},
                headers={"Retry-After": str(retry_after)},
            )
        queue.append(now)


@app.exception_handler(HTTPException)
async def _http_exception_handler(_: Request, exc: HTTPException) -> Response:
    payload: dict = {"error": "http_error", "status": exc.status_code}
    if isinstance(exc.detail, dict):
        payload.update(exc.detail)
    elif exc.detail is not None:
        text = str(exc.detail)
        if IS_PRODUCTION and exc.status_code >= 500:
            text = "internal error"
        payload["message"] = text
    return JSONResponse(status_code=exc.status_code, content=payload, headers=exc.headers or None)


memory_store = MemoryStore()
emotion_engine = EmotionEngine()
llm_client = LLMClient()
tts_client = TTSClient()
_user_memory_cache["_anonymous"] = memory_store
_user_emotion_cache["_anonymous"] = emotion_engine


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=6000)
    input_mode: str = "text"
    output_mode: str = "text"
    voice: str = "nova"
    tts_speed: float = Field(default=1.0, ge=0.25, le=4.0)


class MemoryRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SearchRequest(BaseModel):
    query: str = Field(default="", max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    voice: str = "nova"
    speed: float = Field(default=1.0, ge=0.25, le=4.0)
    response_format: str = "mp3"


@app.on_event("startup")
async def startup() -> None:
    memory_store.ensure()
    emotion_engine.ensure()


@app.get("/api/health")
async def health() -> dict:
    payload = {
        "ok": True,
        "name": APP_NAME,
        "time": datetime.now().isoformat(timespec="seconds"),
    }
    if not IS_PRODUCTION:
        payload.update({
            "openclaw_base_url": OPENCLAW_BASE_URL,
            "openclaw_model": OPENCLAW_MODEL,
            "tts_base_url": TTS_BASE_URL,
            "freetts_base_url": FREETTS_BASE_URL,
        })
    return payload


@app.get("/api/session")
async def session_info(http_request: Request) -> dict:
    user = _session_from_request(http_request)
    if user is None:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "orgName": user.org_name,
            "role": user.role,
            "tier": user.tier,
            "avatarUrl": user.avatar_url,
        },
    }


@app.get("/api/state")
async def state(http_request: Request) -> dict:
    user = _require_user(http_request)
    return {
        "emotion": emotion_for(user).current(),
        "memory": memory_for(user).stats(),
        "environment": environment_payload(),
    }


@app.post("/api/chat")
async def chat(request: ChatRequest, http_request: Request) -> dict:
    enforce_rate_limit(http_request, "chat")
    user = _require_user(http_request)
    mem = memory_for(user)
    emotion = emotion_for(user)
    hits = mem.search(request.message, top_k=5)
    emotion_before = emotion.current()
    moderation = await llm_client.moderate(request.message)
    if not moderation.allowed:
        refusal = "这个话题我不太能聊呢，要不我们换一件让你开心的小事说说嘛~"
        emotion_after = emotion.update(request.message, refusal)
        return {
            "reply": refusal,
            "provider": "moderation-block",
            "moderation": {
                "blocked": True,
                "categories": moderation.categories,
                "matched_terms": moderation.matched_terms,
            },
            "emotion": emotion_after,
            "memory_hits": [],
            "memory": mem.stats(),
            "environment": environment_payload(),
        }
    reply, provider = await llm_client.complete(
        request.message,
        memory_hits=hits,
        emotion=emotion_before,
        recent_context=mem.recent_context(),
        tier=user.tier if user else "free",
    )
    emotion_after = emotion.update(request.message, reply)
    mem.capture_turn(request.message, reply)
    return {
        "reply": reply,
        "provider": provider,
        "moderation": {"blocked": False, "categories": [], "matched_terms": []},
        "emotion": emotion_after,
        "memory_hits": [hit.__dict__ for hit in hits],
        "memory": mem.stats(),
        "environment": environment_payload(),
    }


@app.post("/api/tts")
async def tts(request: TTSRequest, http_request: Request) -> Response:
    enforce_rate_limit(http_request, "tts")
    _require_user(http_request)
    try:
        audio = await tts_client.synthesize(
            request.text,
            voice=request.voice,
            speed=request.speed,
            fmt=request.response_format,
        )
    except Exception as exc:
        _logger.exception("tts synthesis failed")
        detail = "TTS service unavailable" if IS_PRODUCTION else f"TTS service failed: {exc}"
        raise HTTPException(status_code=502, detail=detail) from exc
    media_type = "audio/wav" if request.response_format == "wav" else "audio/mpeg"
    return Response(content=audio, media_type=media_type)


@app.post("/api/memory")
async def remember(request: MemoryRequest, http_request: Request) -> dict:
    enforce_rate_limit(http_request, "memory")
    user = _require_user(http_request)
    mem = memory_for(user)
    entry = mem.remember(request.text, source="user")
    return {"ok": True, "entry": entry, "memory": mem.stats()}


@app.post("/api/memory/search")
async def memory_search(request: SearchRequest, http_request: Request) -> dict:
    enforce_rate_limit(http_request, "memory")
    user = _require_user(http_request)
    mem = memory_for(user)
    hits = mem.search(request.query, top_k=request.top_k)
    return {"hits": [hit.__dict__ for hit in hits], "memory": mem.stats()}


@app.get("/api/environment")
async def environment() -> dict:
    return environment_payload()


def environment_payload() -> dict:
    minute = datetime.now().minute
    signal = 92 + (minute % 7)
    gravity = round(0.008 + (minute % 5) * 0.001, 3)
    return {
        "temperature": "-270.3°C",
        "star_region": "M78 星云",
        "signal": f"{signal}%",
        "gravity": f"{gravity}G",
        "trend": [22, 28, 31, 25, 36, 23, 29, 38, 27, 35, 41, 33],
    }


PLATFORM_HOME_DATA = {
    "overview": {
        "todayRequests": 128433,
        "successRate": 99.18,
        "activeKeys": 18,
        "balanceUsd": 3812.42,
        "estimatedTodayCostUsd": 128.24,
        "frozenAmountUsd": 73.48,
        "monthlyRevenueUsd": 18124.48,
        "monthlyCostUsd": 11621.19,
        "cacheHitRate": 28.4,
    },
    "trends": [
        {"date": "04-15", "requests": 81234, "costUsd": 91.3, "revenueUsd": 136.1, "errors": 112},
        {"date": "04-16", "requests": 93512, "costUsd": 102.4, "revenueUsd": 150.6, "errors": 124},
        {"date": "04-17", "requests": 102034, "costUsd": 111.9, "revenueUsd": 163.2, "errors": 145},
        {"date": "04-18", "requests": 118234, "costUsd": 123.6, "revenueUsd": 176.5, "errors": 129},
        {"date": "04-19", "requests": 110284, "costUsd": 117.1, "revenueUsd": 170.4, "errors": 153},
        {"date": "04-20", "requests": 124005, "costUsd": 126.9, "revenueUsd": 182.8, "errors": 167},
        {"date": "04-21", "requests": 128433, "costUsd": 128.2, "revenueUsd": 186.4, "errors": 141},
    ],
    "costs": [
        {"label": "chat-pro", "value": 41.5, "fill": "#54d6b2"},
        {"label": "reasoning-pro", "value": 23.4, "fill": "#7aa2ff"},
        {"label": "vision-pro", "value": 14.2, "fill": "#f4b76d"},
        {"label": "embedding-large", "value": 8.1, "fill": "#ba8cff"},
        {"label": "缓存账单", "value": 4.8, "fill": "#8ea0bf"},
    ],
    "billing": {
        "balanceUsd": 3812.42,
        "frozenAmountUsd": 73.48,
        "estimatedTodayCostUsd": 128.24,
        "currentPlanName": "Growth 500K",
        "includedQuotaText": "含 500,000 美元等值月度额度，超额按用量计费",
        "nextInvoiceDate": "2026-05-01",
    },
    "providers": [
        {"providerCode": "groq-primary-dev", "successRate": 99.12, "p95LatencyMs": 1220, "status": "healthy", "avgCostUsdPer1k": 0.0028},
        {"providerCode": "nvidia-router", "successRate": 98.43, "p95LatencyMs": 1480, "status": "healthy", "avgCostUsdPer1k": 0.0031},
        {"providerCode": "new-api-internal", "successRate": 97.86, "p95LatencyMs": 1660, "status": "degraded", "avgCostUsdPer1k": 0.0024},
    ],
    "presets": {
        "defaults": [
            {"title": "Usage 运营视图", "description": "按项目、模型与供应商筛选调用趋势。", "href": "/console/usage", "sourceLabel": "团队默认"},
            {"title": "账单待处理", "description": "定位未结算账单、发票与对账异常。", "href": "/console/bills", "sourceLabel": "财务默认"},
            {"title": "Webhook 失败重试", "description": "追踪交付失败、重放与响应详情。", "href": "/console/webhook-deliveries", "sourceLabel": "运维默认"},
        ],
        "recent": [
            {"title": "请求日志", "description": "查看 trace、成本、延迟与重试时间线。", "href": "/console/request-logs", "sourceLabel": "最近使用"},
            {"title": "模型目录", "description": "确认可售模型、上下文窗口与上游路由。", "href": "/console/models", "sourceLabel": "最近使用"},
        ],
        "favorites": [
            {"title": "API Keys", "description": "创建密钥、限制模型并配置调用配额。", "href": "/console/api-keys", "sourceLabel": "我的收藏"},
            {"title": "Playground", "description": "用真实网关验证聊天链路和流式响应。", "href": "/console/playground", "sourceLabel": "我的收藏"},
        ],
        "recommended": [
            {"title": "团队成员", "description": "邀请成员并调整项目级权限。", "href": "/console/team", "sourceLabel": "团队推荐"},
            {"title": "安全设置", "description": "检查 MFA、IP allowlist 和密钥轮换策略。", "href": "/console/security", "sourceLabel": "团队推荐"},
        ],
    },
}


async def probe_service(client: httpx.AsyncClient, name: str, base_url: str, path: str) -> dict:
    target = f"{base_url}{path}"
    try:
        response = await client.get(target)
        payload = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
        ok = response.status_code < 400
        if isinstance(payload, dict):
            ok = ok and bool(payload.get("success", payload.get("ok", True)))
        return {
            "name": name,
            "url": target,
            "ok": ok,
            "statusCode": response.status_code,
            "summary": payload.get("status") if isinstance(payload, dict) else "",
        }
    except Exception as exc:
        return {"name": name, "url": target, "ok": False, "statusCode": 0, "summary": exc.__class__.__name__}


@app.get("/api/platform/home")
async def platform_home() -> dict:
    return_to = quote(f"{DIGITAL_LIFE_PUBLIC_URL}/", safe="")
    checks = [
        ("Gateway", PLATFORM_GATEWAY_URL, "/readyz"),
        ("Ops BFF", PLATFORM_OPS_URL, "/readyz"),
        ("Platform Console", PLATFORM_CONSOLE_URL, "/api/healthz"),
        ("New API", NEW_API_URL, "/api/status"),
    ]
    timeout = httpx.Timeout(1.8, connect=0.4)
    async with httpx.AsyncClient(timeout=timeout, trust_env=False) as client:
        services = await asyncio.gather(*(probe_service(client, name, url, path) for name, url, path in checks))
    return {
        "links": {
            "login": f"{PLATFORM_CONSOLE_PUBLIC_URL}/login?returnTo={return_to}",
            "register": f"{PLATFORM_CONSOLE_PUBLIC_URL}/register?returnTo={return_to}",
            "sessionState": f"{PLATFORM_CONSOLE_PUBLIC_URL}/api/platform/auth/session-state",
            "console": f"{PLATFORM_CONSOLE_PUBLIC_URL}/console",
            "docs": f"{PLATFORM_CONSOLE_PUBLIC_URL}/docs",
            "newApi": NEW_API_PUBLIC_URL,
            "gateway": PLATFORM_GATEWAY_PUBLIC_URL,
            "customerConsole": CUSTOMER_CONSOLE_PUBLIC_URL,
            "adminConsole": ADMIN_CONSOLE_PUBLIC_URL,
            "itTools": IT_TOOLS_PUBLIC_URL,
        },
        "services": services,
        **PLATFORM_HOME_DATA,
    }


if (FRONTEND_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")
if (FRONTEND_DIR / "src").exists():
    app.mount("/src", StaticFiles(directory=FRONTEND_DIR / "src"), name="src")


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/{path:path}")
async def spa_fallback(path: str) -> FileResponse:
    target = FRONTEND_DIR / path
    if target.exists() and target.is_file():
        return FileResponse(target)
    return FileResponse(FRONTEND_DIR / "index.html")
