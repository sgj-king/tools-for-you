#!/usr/bin/env bash
set -euo pipefail

# 启动开发环境

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
ENV_EXAMPLE="${ROOT_DIR}/.env.example"
COMPOSE_FILE="${ROOT_DIR}/infra/dev/docker-compose.yml"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

if [[ ! -f "${ENV_FILE}" ]]; then
  [[ -f "${ENV_EXAMPLE}" ]] || fail "未找到 ${ENV_EXAMPLE}"
  cp "${ENV_EXAMPLE}" "${ENV_FILE}"
  echo "[WARN] 未找到 ${ENV_FILE}，已从 .env.example 复制。请按需修改默认值。"
fi

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build
bash "${ROOT_DIR}/scripts/init-new-api-dev.sh"
echo "[OK] 开发环境已启动。"
