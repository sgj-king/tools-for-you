#!/usr/bin/env bash
set -euo pipefail

# 运维巡检脚本
# 作用:
# 1. 汇总容器状态、磁盘使用率、备份新鲜度、证书有效期、Nginx 配置
# 2. 适合作为每周/每月人工巡检入口

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

echo "========== New API 运维巡检 =========="
echo "[1] docker compose 状态"
"${COMPOSE[@]}" ps
echo

echo "[2] 宿主机磁盘使用"
df -h "${APP_BASE_DIR}" /
echo

echo "[3] Docker 磁盘使用"
docker system df
echo

echo "[4] 数据与日志目录体积"
du -sh \
  "${APP_BASE_DIR}/data/new-api" \
  "${APP_BASE_DIR}/data/mysql" \
  "${APP_BASE_DIR}/data/redis" \
  "${APP_BASE_DIR}/logs/new-api" 2>/dev/null || true
echo

echo "[5] 最近备份文件"
find "${BACKUP_DIR}" -maxdepth 2 -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n' 2>/dev/null | sort | tail -n 10 || true
echo

if [[ -d "/etc/letsencrypt/live/${APP_DOMAIN}" ]]; then
  echo "[6] TLS 证书到期时间"
  openssl x509 -enddate -noout -in "/etc/letsencrypt/live/${APP_DOMAIN}/fullchain.pem"
  echo
fi

if command -v nginx >/dev/null 2>&1; then
  echo "[7] Nginx 配置校验"
  nginx -t
  echo
fi

if command -v systemctl >/dev/null 2>&1; then
  echo "[8] systemd 单元状态"
  systemctl status new-api-stack.service --no-pager || true
  echo
fi

LATEST_MYSQL_BACKUP="$(find "${BACKUP_DIR}/mysql" -type f -name '*.sql.gz' -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -n 1 | awk '{print $2}')"
if [[ -n "${LATEST_MYSQL_BACKUP:-}" ]]; then
  echo "[9] 最新 MySQL 备份"
  ls -lh "${LATEST_MYSQL_BACKUP}"
else
  echo "[9] 最新 MySQL 备份"
  echo "[WARN] 尚未发现 MySQL 备份文件。"
fi

echo
echo "[10] 建议随后执行健康检查脚本"
echo "      ${BASE_DIR}/scripts/healthcheck.sh"
