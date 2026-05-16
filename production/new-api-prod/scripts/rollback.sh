#!/usr/bin/env bash
set -euo pipefail

# 回滚脚本
# 作用:
# 1. 回滚 new-api 到指定镜像版本
# 2. 若不传参，则优先回滚到上一次升级前记录的镜像
# 3. 回滚后执行健康检查
#
# 注意:
# - 如果目标版本与当前数据库结构不兼容，仍可能需要人工介入
# - 这也是为什么生产环境升级前必须先做数据库备份

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="${BASE_DIR}/compose"
ENV_FILE="${COMPOSE_DIR}/.env"
HEALTHCHECK_SCRIPT="${BASE_DIR}/scripts/healthcheck.sh"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

[[ -f "${ENV_FILE}" ]] || fail "未找到 ${ENV_FILE}"
[[ -x "${HEALTHCHECK_SCRIPT}" ]] || fail "未找到健康检查脚本 ${HEALTHCHECK_SCRIPT}"

# shellcheck disable=SC1090
source "${ENV_FILE}"

STATE_DIR="${APP_BASE_DIR}/releases"
TARGET_IMAGE="${1:-}"
if [[ -z "${TARGET_IMAGE}" && -f "${STATE_DIR}/previous_new_api_image" ]]; then
  TARGET_IMAGE="$(cat "${STATE_DIR}/previous_new_api_image")"
fi

[[ -n "${TARGET_IMAGE}" ]] || fail "未指定回滚镜像，且未找到 ${STATE_DIR}/previous_new_api_image"

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_DIR}/docker-compose.yml")

echo "[1/4] 拉取回滚目标镜像 ${TARGET_IMAGE} ..."
docker pull "${TARGET_IMAGE}"

echo "[2/4] 更新 .env 中的 NEW_API_IMAGE ..."
sed -i "s#^NEW_API_IMAGE=.*#NEW_API_IMAGE=${TARGET_IMAGE}#g" "${ENV_FILE}"

echo "[3/4] 重建 new-api 服务 ..."
"${COMPOSE[@]}" up -d --no-deps new-api

echo "[4/4] 执行健康检查 ..."
"${HEALTHCHECK_SCRIPT}" || fail "回滚后健康检查失败，请立即检查应用、数据库和日志。"

echo "${TARGET_IMAGE}" > "${STATE_DIR}/current_new_api_image"
echo "[OK] 回滚完成，当前镜像为 ${TARGET_IMAGE}"
