#!/usr/bin/env bash
set -euo pipefail

# 停止开发环境

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
COMPOSE_FILE="${ROOT_DIR}/infra/dev/docker-compose.yml"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

[[ -f "${ENV_FILE}" ]] || fail "未找到 ${ENV_FILE}"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down
echo "[OK] 开发环境已停止。"
