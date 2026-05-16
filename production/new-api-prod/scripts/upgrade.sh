#!/usr/bin/env bash
set -euo pipefail

# 升级脚本
# 作用:
# 1. 手动指定目标 new-api 镜像版本
# 2. 升级前先做健康检查和备份
# 3. 更新 .env 中的 NEW_API_IMAGE
# 4. 仅滚动更新 new-api 容器
# 5. 失败时自动回退到升级前镜像

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="${BASE_DIR}/compose"
ENV_FILE="${COMPOSE_DIR}/.env"
BACKUP_SCRIPT="${BASE_DIR}/scripts/backup.sh"
HEALTHCHECK_SCRIPT="${BASE_DIR}/scripts/healthcheck.sh"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

[[ -f "${ENV_FILE}" ]] || fail "未找到 ${ENV_FILE}"
[[ -x "${BACKUP_SCRIPT}" ]] || fail "未找到可执行备份脚本 ${BACKUP_SCRIPT}"
[[ -x "${HEALTHCHECK_SCRIPT}" ]] || fail "未找到可执行健康检查脚本 ${HEALTHCHECK_SCRIPT}"

TARGET_IMAGE="${1:-}"
[[ -n "${TARGET_IMAGE}" ]] || fail "用法: ./upgrade.sh calciumion/new-api:v0.12.15"

# shellcheck disable=SC1090
source "${ENV_FILE}"

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_DIR}/docker-compose.yml")
STATE_DIR="${APP_BASE_DIR}/releases"
TIMESTAMP="$(date +%F_%H%M%S)"
CURRENT_IMAGE="$(grep '^NEW_API_IMAGE=' "${ENV_FILE}" | cut -d= -f2-)"
ENV_BACKUP_FILE="${STATE_DIR}/.env.before-upgrade.${TIMESTAMP}"

mkdir -p "${STATE_DIR}"
cp "${ENV_FILE}" "${ENV_BACKUP_FILE}"

echo "[1/6] 升级前健康检查 ..."
"${HEALTHCHECK_SCRIPT}"

echo "[2/6] 执行升级前备份 ..."
"${BACKUP_SCRIPT}"

echo "[3/6] 拉取目标镜像 ${TARGET_IMAGE} ..."
docker pull "${TARGET_IMAGE}"

echo "[4/6] 更新 .env 中的 NEW_API_IMAGE ..."
sed -i "s#^NEW_API_IMAGE=.*#NEW_API_IMAGE=${TARGET_IMAGE}#g" "${ENV_FILE}"

echo "[5/6] 仅重建 new-api 服务 ..."
"${COMPOSE[@]}" up -d --no-deps new-api

echo "[6/6] 升级后健康检查 ..."
if "${HEALTHCHECK_SCRIPT}"; then
  echo "${CURRENT_IMAGE}" > "${STATE_DIR}/previous_new_api_image"
  echo "${TARGET_IMAGE}" > "${STATE_DIR}/current_new_api_image"
  echo "[OK] 升级成功: ${CURRENT_IMAGE} -> ${TARGET_IMAGE}"
  exit 0
fi

echo "[WARN] 升级后健康检查失败，开始自动回滚 ..."
cp "${ENV_BACKUP_FILE}" "${ENV_FILE}"
"${COMPOSE[@]}" up -d --no-deps new-api
"${HEALTHCHECK_SCRIPT}" || fail "自动回滚后仍未恢复，请立刻检查日志。"

echo "[OK] 已自动回滚到升级前镜像: ${CURRENT_IMAGE}"
