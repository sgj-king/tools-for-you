#!/usr/bin/env bash
set -euo pipefail

# 使用宿主机 conda 环境运行当前 FastAPI 服务。
# 需要你本机 shell 中可用 conda，并且 py311 环境已安装 requirements.txt 中的依赖。
if ! command -v conda >/dev/null 2>&1; then
  echo "错误：当前 shell 找不到 conda，请先初始化 conda 或使用 Docker 开发环境。" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${SERVICE_DIR}"
exec conda run -n py311 python -m uvicorn app.main:app --host 0.0.0.0 --port "${SERVICE_PORT:-8080}"
