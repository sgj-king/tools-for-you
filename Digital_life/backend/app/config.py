from __future__ import annotations

import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
DATA_DIR = BACKEND_DIR / "data"
WORKSPACE_DIR = DATA_DIR / "agent_workspace"

OPENCLAW_BASE_URL = os.getenv("OPENCLAW_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/")
OPENCLAW_API_KEY = os.getenv("OPENCLAW_API_KEY", "openclaw-local")
OPENCLAW_MODEL = os.getenv("OPENCLAW_MODEL", "openclaw")

# Platform-gateway routing (Sprint 2). When base URL + API key are set, chat
# requests go through the SaaS gateway with tier-based model selection. Without
# them, the LLM client falls back to OPENCLAW_* (local Ollama).
PLATFORM_GATEWAY_BASE_URL = os.getenv("PLATFORM_GATEWAY_BASE_URL", "").rstrip("/")
PLATFORM_API_KEY = os.getenv("PLATFORM_API_KEY", "").strip()
MODEL_FREE = os.getenv("MODEL_FREE", "chat-basic").strip() or "chat-basic"
MODEL_PAID = os.getenv("MODEL_PAID", "chat-pro").strip() or "chat-pro"

TTS_BASE_URL = os.getenv("TTS_BASE_URL", "http://ttsapi.site").rstrip("/")
FREETTS_BASE_URL = os.getenv("FREETTS_BASE_URL", "https://freetts.org/api").rstrip("/")
TTS_DEFAULT_VOICE = os.getenv("TTS_DEFAULT_VOICE", "zh-CN-XiaoxiaoNeural")
TTS_TIMEOUT_SECONDS = float(os.getenv("TTS_TIMEOUT_SECONDS", "45"))

PLATFORM_GATEWAY_URL = os.getenv("PLATFORM_GATEWAY_URL", "http://127.0.0.1:8088").rstrip("/")
PLATFORM_OPS_URL = os.getenv("PLATFORM_OPS_URL", "http://127.0.0.1:8086").rstrip("/")
PLATFORM_CONSOLE_URL = os.getenv("PLATFORM_CONSOLE_URL", "http://127.0.0.1:3200").rstrip("/")
CUSTOMER_CONSOLE_URL = os.getenv("CUSTOMER_CONSOLE_URL", "http://127.0.0.1:3101").rstrip("/")
ADMIN_CONSOLE_URL = os.getenv("ADMIN_CONSOLE_URL", "http://127.0.0.1:3102").rstrip("/")
NEW_API_URL = os.getenv("NEW_API_URL", "http://127.0.0.1:3005").rstrip("/")

PLATFORM_GATEWAY_PUBLIC_URL = os.getenv("PLATFORM_GATEWAY_PUBLIC_URL", PLATFORM_GATEWAY_URL).rstrip("/")
PLATFORM_CONSOLE_PUBLIC_URL = os.getenv("PLATFORM_CONSOLE_PUBLIC_URL", PLATFORM_CONSOLE_URL).rstrip("/")
DIGITAL_LIFE_PUBLIC_URL = os.getenv("DIGITAL_LIFE_PUBLIC_URL", "http://127.0.0.1:8008").rstrip("/")
CUSTOMER_CONSOLE_PUBLIC_URL = os.getenv("CUSTOMER_CONSOLE_PUBLIC_URL", CUSTOMER_CONSOLE_URL).rstrip("/")
ADMIN_CONSOLE_PUBLIC_URL = os.getenv("ADMIN_CONSOLE_PUBLIC_URL", ADMIN_CONSOLE_URL).rstrip("/")
NEW_API_PUBLIC_URL = os.getenv("NEW_API_PUBLIC_URL", NEW_API_URL).rstrip("/")
IT_TOOLS_PUBLIC_URL = os.getenv("IT_TOOLS_PUBLIC_URL", "").rstrip("/")

APP_NAME = "StarryChat Digital Life"

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV in {"production", "prod"}

_default_origins = "" if IS_PRODUCTION else "*"
_origins_raw = os.getenv("ALLOWED_ORIGINS", _default_origins).strip()
if _origins_raw == "*":
    ALLOWED_ORIGINS: list[str] = ["*"]
elif _origins_raw:
    ALLOWED_ORIGINS = [item.strip() for item in _origins_raw.split(",") if item.strip()]
else:
    ALLOWED_ORIGINS = []

ALLOW_CREDENTIALS = ALLOWED_ORIGINS != ["*"]

DOCS_ENABLED = os.getenv("DOCS_ENABLED", "0" if IS_PRODUCTION else "1").strip() not in {"0", "false", "no", ""}


def _positive_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return value if value > 0 else default


RATE_LIMIT_WINDOW_SECONDS = _positive_int("RATE_LIMIT_WINDOW_SECONDS", 60)
RATE_LIMIT_CHAT_PER_WINDOW = _positive_int("RATE_LIMIT_CHAT_PER_WINDOW", 30)
RATE_LIMIT_TTS_PER_WINDOW = _positive_int("RATE_LIMIT_TTS_PER_WINDOW", 10)
RATE_LIMIT_MEMORY_PER_WINDOW = _positive_int("RATE_LIMIT_MEMORY_PER_WINDOW", 20)
