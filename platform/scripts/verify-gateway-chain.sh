#!/usr/bin/env bash
set -euo pipefail

# 一键验证开发环境中的 Gateway 第一版链路是否可用。
# 验证顺序：
# 1. 初始化 new-api（如尚未初始化）
# 2. 检查 gateway/auth/policy/billing/relay/new-api 健康状态
# 2. 跑一次内部链路 smoke test
# 3. 跑一次 relay -> new-api 调试请求
# 4. 跑一次客户入口 Gateway chat completion

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTH_HOST_PORT="${AUTH_HOST_PORT:-18082}"
AUTH_URL="${AUTH_URL:-http://127.0.0.1:${AUTH_HOST_PORT}}"
POLICY_URL="${POLICY_URL:-http://127.0.0.1:8083}"
BILLING_URL="${BILLING_URL:-http://127.0.0.1:8082}"
RELAY_URL="${RELAY_URL:-http://127.0.0.1:8085}"
GATEWAY_URL="${GATEWAY_URL:-http://127.0.0.1:8088}"
NEW_API_URL="${NEW_API_URL:-http://127.0.0.1:3005}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

check_health() {
  local name="$1"
  local url="$2"

  echo "[INFO] 检查 ${name}: ${url}/healthz"
  local response
  response="$(curl -sS "${url}/healthz")" || fail "${name} healthz 请求失败"
  printf '%s\n' "${response}"
  printf '%s' "${response}" | grep -q '"success":true' || fail "${name} healthz 未返回 success=true"
}

check_new_api_status() {
  echo "[INFO] 检查 new-api: ${NEW_API_URL}/api/status"
  local response
  response="$(curl -sS "${NEW_API_URL}/api/status")" || fail "new-api /api/status 请求失败"
  printf '%s\n' "${response}"
  printf '%s' "${response}" | grep -q '"success":true' || fail "new-api /api/status 未返回 success=true"
}

echo "[INFO] 初始化 new-api（若尚未初始化）"
bash "${ROOT_DIR}/scripts/init-new-api-dev.sh"

check_health "gateway" "${GATEWAY_URL}"
check_health "auth" "${AUTH_URL}"
check_health "policy" "${POLICY_URL}"
check_health "billing" "${BILLING_URL}"
check_health "relay" "${RELAY_URL}"
check_new_api_status

echo "[INFO] 执行内部链路联调脚本"
bash "${ROOT_DIR}/scripts/curl/internal-chain-smoke.sh"

echo "[INFO] 执行 Relay 联调脚本"
ALLOW_UPSTREAM_ERROR=true bash "${ROOT_DIR}/scripts/curl/relay-chat.sh"

echo "[INFO] 执行 Gateway 聊天联调脚本"
ALLOW_UPSTREAM_ERROR=true bash "${ROOT_DIR}/scripts/curl/gateway-chat.sh"

echo "[OK] Gateway 到 relay/new-api 的一键验证已完成。若当前仍是上游错误，请继续在 new-api 后台配置 provider/channel。"
