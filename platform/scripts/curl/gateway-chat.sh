#!/usr/bin/env bash
set -euo pipefail

# 通过客户入口 Gateway 发起一次 OpenAI 风格的聊天请求。
# 这份脚本用于验证 gateway -> auth -> policy -> billing(preauthorize/finalize) -> relay -> new-api 的第一版真实链路。
# 如果 new-api 尚未配置上游渠道，脚本会返回真实错误并给出提示。

GATEWAY_URL="${GATEWAY_URL:-http://127.0.0.1:8088}"
DEMO_API_KEY="${DEMO_API_KEY:-demo_live_sk_platform_dev}"
MODEL="${MODEL:-chat-pro}"
USER_PROMPT="${USER_PROMPT:-请确认第一版网关链路已经跑通，并返回简短说明。}"
MAX_TOKENS="${MAX_TOKENS:-256}"
REQUEST_ID="${REQUEST_ID:-req-gateway-$(date +%s)}"
TRACE_ID="${TRACE_ID:-trace-gateway-$(date +%s)}"
IDEMPOTENCY_KEY="${IDEMPOTENCY_KEY:-idem-gateway-${REQUEST_ID}}"
ALLOW_UPSTREAM_ERROR="${ALLOW_UPSTREAM_ERROR:-false}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

echo "[INFO] Gateway URL: ${GATEWAY_URL}"
echo "[INFO] Request ID: ${REQUEST_ID}"
echo "[INFO] Trace ID: ${TRACE_ID}"

response="$(curl -sS "${GATEWAY_URL}/v1/chat/completions" \
  -H "Authorization: Bearer ${DEMO_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: ${REQUEST_ID}" \
  -H "X-Trace-Id: ${TRACE_ID}" \
  -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
  -d "$(cat <<JSON
{
  "model": "${MODEL}",
  "stream": false,
  "max_tokens": ${MAX_TOKENS},
  "messages": [
    {
      "role": "system",
      "content": "你是平台开发环境中的联调助手。"
    },
    {
      "role": "user",
      "content": "${USER_PROMPT}"
    }
  ]
}
JSON
)")" || fail "Gateway 请求失败"

printf '%s\n' "${response}"

if printf '%s' "${response}" | grep -q '"object":"chat.completion"'; then
  printf '%s' "${response}" | grep -q "\"request_id\":\"${REQUEST_ID}\"" || fail "Gateway 响应中的 request_id 不匹配"
  echo "[OK] Gateway 聊天链路验证通过。"
  exit 0
fi

if [[ "${ALLOW_UPSTREAM_ERROR}" == "true" ]] && printf '%s' "${response}" | grep -q '"error"'; then
  echo "[WARN] Gateway 已返回真实上游错误。通常表示 new-api 尚未配置可用的 provider/channel 或模型映射。"
  exit 0
fi

fail "Gateway 未返回 chat completion 响应"
