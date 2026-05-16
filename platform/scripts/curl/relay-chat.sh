#!/usr/bin/env bash
set -euo pipefail

# 直连 relay，验证 relay -> new-api 这段链路是否已经真实打通。
# 说明：
# 1. 这不是客户入口，而是内部链路调试脚本。
# 2. 如果 new-api 尚未配置上游渠道，relay 会返回真实 upstream 错误，这属于预期阻塞点。

RELAY_URL="${RELAY_URL:-http://127.0.0.1:8085}"
MODEL="${MODEL:-chat-pro}"
REQUEST_ID="${REQUEST_ID:-req-relay-$(date +%s)}"
TRACE_ID="${TRACE_ID:-trace-relay-$(date +%s)}"
ALLOW_UPSTREAM_ERROR="${ALLOW_UPSTREAM_ERROR:-false}"
USER_PROMPT="${USER_PROMPT:-请简短确认 relay 到 new-api 的真实转发链路。}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

echo "[INFO] Relay URL: ${RELAY_URL}"
echo "[INFO] Request ID: ${REQUEST_ID}"
echo "[INFO] Trace ID: ${TRACE_ID}"

response="$(curl -sS "${RELAY_URL}/internal/relay/chat-completions" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{
  "request_id": "${REQUEST_ID}",
  "trace_id": "${TRACE_ID}",
  "organization_id": 1001,
  "project_id": 2001,
  "api_key_id": 3001,
  "external_model_name": "${MODEL}",
  "policy_code": "allow",
  "route_hint": {
    "preferred_provider": "new-api"
  },
  "openai_request": {
    "model": "${MODEL}",
    "stream": false,
    "max_tokens": 128,
    "messages": [
      {
        "role": "system",
        "content": "你是 relay 联调助手。"
      },
      {
        "role": "user",
        "content": "${USER_PROMPT}"
      }
    ]
  }
}
JSON
)")" || fail "Relay 请求失败"

printf '%s\n' "${response}"

if printf '%s' "${response}" | grep -q '"success":true'; then
  echo "[OK] Relay 返回了真实 completion 响应。"
  exit 0
fi

if [[ "${ALLOW_UPSTREAM_ERROR}" == "true" ]] && printf '%s' "${response}" | grep -q '"response_json"'; then
  echo "[WARN] Relay 已触达 new-api，但 new-api/上游返回错误。通常表示上游渠道或模型映射尚未配置。"
  exit 0
fi

fail "Relay 未返回成功结果"
