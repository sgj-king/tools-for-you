#!/usr/bin/env bash
set -euo pipefail

# 首次部署初始化脚本
# 作用:
# 1. 创建目录结构
# 2. 校验 .env 是否存在
# 3. 设置较稳妥的权限
# 4. 预检查 docker compose 配置是否能解析

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="${BASE_DIR}/compose"
ENV_FILE="${COMPOSE_DIR}/.env"
EXAMPLE_ENV_FILE="${COMPOSE_DIR}/.env.example"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

if [[ "${EUID}" -ne 0 ]]; then
  fail "请使用 root 或 sudo 运行本脚本，因为默认部署目录位于 /opt/new-api。"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${EXAMPLE_ENV_FILE}" ]]; then
    cp "${EXAMPLE_ENV_FILE}" "${ENV_FILE}"
    chmod 640 "${ENV_FILE}"
    echo "[WARN] 未找到 ${ENV_FILE}，已从 .env.example 复制。请先编辑真实配置后再继续。"
    echo "[INFO] 建议优先替换以下字段:"
    echo "       APP_DOMAIN, APP_PUBLIC_URL, ADMIN_ALLOW_CIDR"
    echo "       SESSION_SECRET, CRYPTO_SECRET"
    echo "       INITIAL_ROOT_TOKEN, INITIAL_ROOT_ACCESS_TOKEN"
    echo "       MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, REDIS_PASSWORD"
    exit 0
  fi
  fail "未找到 ${ENV_FILE} 且不存在 .env.example，无法继续。"
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

mkdir -p \
  "${APP_BASE_DIR}/compose" \
  "${APP_BASE_DIR}/data/new-api" \
  "${APP_BASE_DIR}/data/mysql" \
  "${APP_BASE_DIR}/data/redis" \
  "${APP_BASE_DIR}/logs/new-api" \
  "${APP_BASE_DIR}/backups/mysql" \
  "${APP_BASE_DIR}/backups/config" \
  "${APP_BASE_DIR}/backups/manifests" \
  "${BACKUP_TMP_DIR}" \
  "${APP_BASE_DIR}/releases" \
  "${CERTBOT_WEBROOT}"

chmod 750 \
  "${APP_BASE_DIR}" \
  "${APP_BASE_DIR}/data" \
  "${APP_BASE_DIR}/logs" \
  "${APP_BASE_DIR}/backups" \
  "${APP_BASE_DIR}/releases"

chmod 700 "${BASE_DIR}/scripts"
chmod 640 "${ENV_FILE}"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_DIR}/docker-compose.yml" config >/dev/null \
  || fail "docker compose 配置校验失败，请先检查 .env 和 docker-compose.yml。"

echo "[OK] 目录与权限初始化完成。"
echo "[OK] docker compose 配置校验通过。"
echo "[NEXT] 接下来请将 compose、nginx、systemd 文件复制到目标宿主机对应路径。"
