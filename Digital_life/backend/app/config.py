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

TTS_BASE_URL = os.getenv("TTS_BASE_URL", "http://ttsapi.site").rstrip("/")
FREETTS_BASE_URL = os.getenv("FREETTS_BASE_URL", "https://freetts.org/api").rstrip("/")
TTS_DEFAULT_VOICE = os.getenv("TTS_DEFAULT_VOICE", "nova")
TTS_TIMEOUT_SECONDS = float(os.getenv("TTS_TIMEOUT_SECONDS", "45"))

PLATFORM_GATEWAY_URL = os.getenv("PLATFORM_GATEWAY_URL", "http://127.0.0.1:8088").rstrip("/")
PLATFORM_OPS_URL = os.getenv("PLATFORM_OPS_URL", "http://127.0.0.1:8086").rstrip("/")
PLATFORM_CONSOLE_URL = os.getenv("PLATFORM_CONSOLE_URL", "http://127.0.0.1:3200").rstrip("/")
CUSTOMER_CONSOLE_URL = os.getenv("CUSTOMER_CONSOLE_URL", "http://127.0.0.1:3101").rstrip("/")
ADMIN_CONSOLE_URL = os.getenv("ADMIN_CONSOLE_URL", "http://127.0.0.1:3102").rstrip("/")
NEW_API_URL = os.getenv("NEW_API_URL", "http://127.0.0.1:3005").rstrip("/")

PLATFORM_GATEWAY_PUBLIC_URL = os.getenv("PLATFORM_GATEWAY_PUBLIC_URL", PLATFORM_GATEWAY_URL).rstrip("/")
PLATFORM_CONSOLE_PUBLIC_URL = os.getenv("PLATFORM_CONSOLE_PUBLIC_URL", PLATFORM_CONSOLE_URL).rstrip("/")
CUSTOMER_CONSOLE_PUBLIC_URL = os.getenv("CUSTOMER_CONSOLE_PUBLIC_URL", CUSTOMER_CONSOLE_URL).rstrip("/")
ADMIN_CONSOLE_PUBLIC_URL = os.getenv("ADMIN_CONSOLE_PUBLIC_URL", ADMIN_CONSOLE_URL).rstrip("/")
NEW_API_PUBLIC_URL = os.getenv("NEW_API_PUBLIC_URL", NEW_API_URL).rstrip("/")

APP_NAME = "StarryChat Digital Life"
