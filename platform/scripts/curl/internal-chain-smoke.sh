#!/usr/bin/env bash
set -euo pipefail

# 按顺序直连 auth / policy / billing，验证内部链路的第一版实现。
# 这份脚本用于排除 Gateway 编排层之外的内部服务问题。

AUTH_HOST_PORT="${AUTH_HOST_PORT:-18082}"
AUTH_URL="${AUTH_URL:-http://127.0.0.1:${AUTH_HOST_PORT}}"
POLICY_URL="${POLICY_URL:-http://127.0.0.1:8083}"
BILLING_URL="${BILLING_URL:-http://127.0.0.1:8082}"
DEMO_API_KEY="${DEMO_API_KEY:-demo_live_sk_platform_dev}"
MODEL="${MODEL:-chat-pro}"
REQUEST_ID="${REQUEST_ID:-req-internal-$(date +%s)}"
TRACE_ID="${TRACE_ID:-trace-internal-$(date +%s)}"
IDEMPOTENCY_KEY="${IDEMPOTENCY_KEY:-idem-internal-${REQUEST_ID}}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

extract_json_string() {
  local payload="$1"
  local key="$2"
  printf '%s' "${payload}" | tr -d '\n' | sed -n "s/.*\"${key}\":\"\\([^\"]*\\)\".*/\\1/p"
}

extract_json_number() {
  local payload="$1"
  local key="$2"
  printf '%s' "${payload}" | tr -d '\n' | sed -n "s/.*\"${key}\":\\([0-9][0-9]*\\).*/\\1/p"
}

echo "[INFO] 调用 Auth validate-key"
auth_response="$(curl -sS "${AUTH_URL}/internal/auth/validate-key" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{
  "api_key": "${DEMO_API_KEY}",
  "request_id": "${REQUEST_ID}",
  "trace_id": "${TRACE_ID}"
}
JSON
)")" || fail "Auth 请求失败"

printf '%s\n' "${auth_response}"
printf '%s' "${auth_response}" | grep -q '"valid":true' || fail "Auth 未通过"

organization_id="$(extract_json_number "${auth_response}" "organization_id")"
project_id="$(extract_json_number "${auth_response}" "project_id")"
api_key_id="$(extract_json_number "${auth_response}" "api_key_id")"

[[ -n "${organization_id}" ]] || fail "未能从 Auth 响应提取 organization_id"
[[ -n "${project_id}" ]] || fail "未能从 Auth 响应提取 project_id"
[[ -n "${api_key_id}" ]] || fail "未能从 Auth 响应提取 api_key_id"

echo "[INFO] 调用 Policy check"
policy_response="$(curl -sS "${POLICY_URL}/internal/policy/check" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{
  "request_id": "${REQUEST_ID}",
  "trace_id": "${TRACE_ID}",
  "organization_id": ${organization_id},
  "project_id": ${project_id},
  "api_key_id": ${api_key_id},
  "model": "${MODEL}",
  "region": "global"
}
JSON
)")" || fail "Policy 请求失败"

printf '%s\n' "${policy_response}"
printf '%s' "${policy_response}" | grep -q '"allowed":true' || fail "Policy 未通过"

echo "[INFO] 调用 Billing preauthorize"
preauth_response="$(curl -sS "${BILLING_URL}/internal/billing/preauthorize" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{
  "request_id": "${REQUEST_ID}",
  "trace_id": "${TRACE_ID}",
  "organization_id": ${organization_id},
  "project_id": ${project_id},
  "api_key_id": ${api_key_id},
  "model": "${MODEL}",
  "max_tokens": 256,
  "input_tokens_estimate": 180,
  "idempotency_key": "${IDEMPOTENCY_KEY}"
}
JSON
)")" || fail "Billing preauthorize 请求失败"

printf '%s\n' "${preauth_response}"
printf '%s' "${preauth_response}" | grep -q '"allowed":true' || fail "Billing preauthorize 未通过"

hold_id="$(extract_json_string "${preauth_response}" "hold_id")"
hold_amount="$(extract_json_string "${preauth_response}" "hold_amount")"

[[ -n "${hold_id}" ]] || fail "未能从 Billing preauthorize 响应提取 hold_id"
[[ -n "${hold_amount}" ]] || fail "未能从 Billing preauthorize 响应提取 hold_amount"

echo "[INFO] 调用 Billing finalize"
finalize_response="$(curl -sS "${BILLING_URL}/internal/billing/finalize" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{
  "request_id": "${REQUEST_ID}",
  "trace_id": "${TRACE_ID}",
  "hold_id": "${hold_id}",
  "organization_id": ${organization_id},
  "project_id": ${project_id},
  "api_key_id": ${api_key_id},
  "model": "${MODEL}",
  "input_tokens": 180,
  "output_tokens": 120,
  "provider_cost": "0.000330",
  "authorized_amount": "${hold_amount}",
  "stream_status": "completed",
  "idempotency_key": "${IDEMPOTENCY_KEY}"
}
JSON
)")" || fail "Billing finalize 请求失败"

printf '%s\n' "${finalize_response}"
printf '%s' "${finalize_response}" | grep -q '"settled":true' || fail "Billing finalize 未完成结算"

echo "[OK] 内部链路验证通过。"
