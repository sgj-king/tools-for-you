#!/usr/bin/env bash
set -euo pipefail

# 备份脚本
# 作用:
# 1. 导出 MySQL 全量逻辑备份
# 2. 备份部署配置、当前 .env、Nginx 与 systemd 实际运行文件
# 3. 生成版本快照清单
# 4. 清理过期备份

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="${BASE_DIR}/compose"
ENV_FILE="${COMPOSE_DIR}/.env"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

[[ -f "${ENV_FILE}" ]] || fail "未找到 ${ENV_FILE}"

# shellcheck disable=SC1090
source "${ENV_FILE}"

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_DIR}/docker-compose.yml")
TIMESTAMP="$(date +%F_%H%M%S)"
MYSQL_BACKUP_DIR="${BACKUP_DIR}/mysql"
CONFIG_BACKUP_DIR="${BACKUP_DIR}/config"
MANIFEST_DIR="${BACKUP_DIR}/manifests"
TMP_WORK_DIR="${BACKUP_TMP_DIR}/${TIMESTAMP}"
MYSQL_DUMP_FILE="${MYSQL_BACKUP_DIR}/new-api_${TIMESTAMP}.sql.gz"
CONFIG_FILE="${CONFIG_BACKUP_DIR}/new-api-config_${TIMESTAMP}.tar.gz"
RUNTIME_FILE="${CONFIG_BACKUP_DIR}/new-api-runtime_${TIMESTAMP}.tar.gz"
MANIFEST_FILE="${MANIFEST_DIR}/release_${TIMESTAMP}.txt"

mkdir -p "${MYSQL_BACKUP_DIR}" "${CONFIG_BACKUP_DIR}" "${MANIFEST_DIR}" "${TMP_WORK_DIR}"
trap 'rm -rf "${TMP_WORK_DIR}"' EXIT

echo "[1/4] 检查容器状态 ..."
"${COMPOSE[@]}" ps >/dev/null || fail "docker compose 不可用，请先确认栈已部署。"

echo "[2/4] 导出 MySQL 逻辑备份 ..."
"${COMPOSE[@]}" exec -T mysql sh -c \
  'exec mysqldump --single-transaction --quick --routines --triggers --events -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip -9 > "${MYSQL_DUMP_FILE}"
chmod 600 "${MYSQL_DUMP_FILE}"

echo "[3/4] 打包配置文件 ..."
tar -czf "${CONFIG_FILE}" -C "${BASE_DIR}" compose nginx systemd scripts docs

cp "${ENV_FILE}" "${TMP_WORK_DIR}/.env"
if [[ -f "${NGINX_SITE_PATH}" ]]; then
  cp "${NGINX_SITE_PATH}" "${TMP_WORK_DIR}/nginx-live.conf"
fi
if [[ -f "${SYSTEMD_UNIT_PATH}" ]]; then
  cp "${SYSTEMD_UNIT_PATH}" "${TMP_WORK_DIR}/new-api-stack.service"
fi
tar -czf "${RUNTIME_FILE}" -C "${TMP_WORK_DIR}" .
chmod 600 "${RUNTIME_FILE}"

echo "[4/4] 记录版本清单 ..."
{
  echo "timestamp=${TIMESTAMP}"
  echo "app_domain=${APP_DOMAIN}"
  echo "new_api_image=${NEW_API_IMAGE}"
  echo "mysql_image=${MYSQL_IMAGE}"
  echo "redis_image=${REDIS_IMAGE}"
  echo "compose_project_name=${COMPOSE_PROJECT_NAME}"
  echo
  "${COMPOSE[@]}" ps
} > "${MANIFEST_FILE}"
chmod 600 "${MANIFEST_FILE}"

find "${BACKUP_DIR}" -type f -mtime +"${BACKUP_RETENTION_DAYS}" -delete

echo "[OK] 备份完成。"
echo "     MySQL 备份: ${MYSQL_DUMP_FILE}"
echo "     配置备份:   ${CONFIG_FILE}"
echo "     运行时备份: ${RUNTIME_FILE}"
echo "     清单文件:   ${MANIFEST_FILE}"
