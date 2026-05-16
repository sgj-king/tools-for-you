#!/usr/bin/env bash
set -euo pipefail

# 健康检查脚本
# 作用:
# 1. 校验 docker compose 栈是否运行
# 2. 校验 new-api、MySQL、Redis 容器健康状态
# 3. 校验本地 /api/status
# 4. 如果存在 .healthcheck_token，则进一步测试 /v1/models 和一次真实聊天请求

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="${BASE_DIR}/compose"
ENV_FILE="${COMPOSE_DIR}/.env"
TOKEN_FILE="${COMPOSE_DIR}/.healthcheck_token"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

[[ -f "${ENV_FILE}" ]] || fail "未找到 ${ENV_FILE}"

# shellcheck disable=SC1090
source "${ENV_FILE}"

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_DIR}/docker-compose.yml")

check_service_health() {
  local service_name="$1"
  local container_id
  local status

  container_id="$("${COMPOSE[@]}" ps -q "${service_name}")"
  [[ -n "${container_id}" ]] || fail "服务 ${service_name} 不存在或未启动。"

  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
  case "${status}" in
    healthy|running)
      echo "[OK] ${service_name} 状态正常: ${status}"
      ;;
    *)
      fail "服务 ${service_name} 状态异常: ${status}"
      ;;
  esac
}

echo "[1/6] 检查容器健康状态 ..."
check_service_health new-api
check_service_health mysql
check_service_health redis

echo "[2/6] 检查本地状态接口 ..."
curl -fsS --max-time 10 "http://127.0.0.1:${NEW_API_PORT}/api/status" | grep -Eq '"success":\s*true' \
  || fail "本地 /api/status 检查失败。"

echo "[3/6] 检查 MySQL 连通性 ..."
"${COMPOSE[@]}" exec -T mysql sh -c 'mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" --silent' >/dev/null \
  || fail "MySQL 健康检查失败。"

echo "[4/6] 检查 Redis 连通性 ..."
"${COMPOSE[@]}" exec -T redis sh -c 'redis-cli -a "$REDIS_PASSWORD" ping' | grep -q PONG \
  || fail "Redis 健康检查失败。"

echo "[5/6] 检查外部 HTTPS 状态接口 ..."
curl -fsS --max-time 15 "${APP_PUBLIC_URL%/}/api/status" | grep -Eq '"success":\s*true' \
  || fail "外部 ${APP_PUBLIC_URL%/}/api/status 检查失败。"

if [[ -f "${TOKEN_FILE}" ]]; then
  TOKEN="$(head -n 1 "${TOKEN_FILE}" | tr -d '\r\n')"
  if [[ -n "${TOKEN}" ]]; then
    echo "[6/6] 检查受保护 API ..."
    curl -fsS --max-time 20 \
      -H "Authorization: Bearer ${TOKEN}" \
      "${APP_PUBLIC_URL%/}/v1/models" | grep -Eq '"data":\s*\[' \
      || fail "/v1/models 检查失败。"

    curl -fsS --max-time 60 \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"model\":\"${HEALTHCHECK_MODEL_NAME}\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":8}" \
      "${APP_PUBLIC_URL%/}/v1/chat/completions" | grep -Eq '"object":\s*"chat\.completion"' \
      || fail "真实聊天请求检查失败，请确认 HEALTHCHECK_MODEL_NAME 已在后台映射。"
  fi
else
  echo "[INFO] 未找到 ${TOKEN_FILE}，已跳过 /v1/models 与真实聊天请求验证。"
fi

echo "[OK] 健康检查全部通过。"
