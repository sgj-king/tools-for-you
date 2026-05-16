from __future__ import annotations

import asyncio
from datetime import datetime

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.app.config import (
    ADMIN_CONSOLE_PUBLIC_URL,
    APP_NAME,
    CUSTOMER_CONSOLE_PUBLIC_URL,
    FREETTS_BASE_URL,
    FRONTEND_DIR,
    NEW_API_URL,
    NEW_API_PUBLIC_URL,
    OPENCLAW_BASE_URL,
    OPENCLAW_MODEL,
    PLATFORM_CONSOLE_URL,
    PLATFORM_CONSOLE_PUBLIC_URL,
    PLATFORM_GATEWAY_URL,
    PLATFORM_GATEWAY_PUBLIC_URL,
    PLATFORM_OPS_URL,
    TTS_BASE_URL,
)
from backend.app.services.emotion import EmotionEngine
from backend.app.services.llm import LLMClient
from backend.app.services.memory import MemoryStore
from backend.app.services.tts import TTSClient


app = FastAPI(title=APP_NAME)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory_store = MemoryStore()
emotion_engine = EmotionEngine()
llm_client = LLMClient()
tts_client = TTSClient()


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
    return {
        "ok": True,
        "name": APP_NAME,
        "time": datetime.now().isoformat(timespec="seconds"),
        "openclaw_base_url": OPENCLAW_BASE_URL,
        "openclaw_model": OPENCLAW_MODEL,
        "tts_base_url": TTS_BASE_URL,
        "freetts_base_url": FREETTS_BASE_URL,
    }


@app.get("/api/state")
async def state() -> dict:
    return {
        "emotion": emotion_engine.current(),
        "memory": memory_store.stats(),
        "environment": environment_payload(),
    }


@app.post("/api/chat")
async def chat(request: ChatRequest) -> dict:
    hits = memory_store.search(request.message, top_k=5)
    emotion_before = emotion_engine.current()
    reply, provider = await llm_client.complete(
        request.message,
        memory_hits=hits,
        emotion=emotion_before,
        recent_context=memory_store.recent_context(),
    )
    emotion_after = emotion_engine.update(request.message, reply)
    memory_store.capture_turn(request.message, reply)
    return {
        "reply": reply,
        "provider": provider,
        "emotion": emotion_after,
        "memory_hits": [hit.__dict__ for hit in hits],
        "memory": memory_store.stats(),
        "environment": environment_payload(),
    }


@app.post("/api/tts")
async def tts(request: TTSRequest) -> Response:
    try:
        audio = await tts_client.synthesize(
            request.text,
            voice=request.voice,
            speed=request.speed,
            fmt=request.response_format,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"TTS service failed: {exc}") from exc
    media_type = "audio/wav" if request.response_format == "wav" else "audio/mpeg"
    return Response(content=audio, media_type=media_type)


@app.post("/api/memory")
async def remember(request: MemoryRequest) -> dict:
    entry = memory_store.remember(request.text, source="user")
    return {"ok": True, "entry": entry, "memory": memory_store.stats()}


@app.post("/api/memory/search")
async def memory_search(request: SearchRequest) -> dict:
    hits = memory_store.search(request.query, top_k=request.top_k)
    return {"hits": [hit.__dict__ for hit in hits], "memory": memory_store.stats()}


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
            "login": f"{PLATFORM_CONSOLE_PUBLIC_URL}/login",
            "console": f"{PLATFORM_CONSOLE_PUBLIC_URL}/console",
            "docs": f"{PLATFORM_CONSOLE_PUBLIC_URL}/docs",
            "newApi": NEW_API_PUBLIC_URL,
            "gateway": PLATFORM_GATEWAY_PUBLIC_URL,
            "customerConsole": CUSTOMER_CONSOLE_PUBLIC_URL,
            "adminConsole": ADMIN_CONSOLE_PUBLIC_URL,
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
