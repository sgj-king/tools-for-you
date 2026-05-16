#!/usr/bin/env bash
set -euo pipefail

# 用途：
# 1. 读取 platform/.env 中的 new-api 管理员账号和上游 OpenAI-compatible provider 配置
# 2. 调用 new-api 官方管理 API 创建 channel
# 3. 将对外稳定模型名映射到真实上游模型
#
# 重要说明：
# 1. 当前脚本只处理 OpenAI-compatible 渠道，type=1 来自 new-api 官方管理 API 文档示例
# 2. 如果没有提供真实上游 API Key，脚本会跳过，不写入任何假配置
# 3. 若未来需要 Anthropic / Gemini / DeepSeek，请按当前版本文档核对 type 编号后再扩展
# 4. 自用模式请通过 platform/.env 中的 NEW_API_USAGE_MODE=self 配合 init-new-api-dev.sh 完成

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
NEW_API_URL="${NEW_API_URL:-http://127.0.0.1:3005}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

read_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  line="${line#*=}"
  printf '%s' "${line}"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少命令: $1"
}

require_command curl

[[ -f "${ENV_FILE}" ]] || fail "未找到 ${ENV_FILE}"

NEW_API_ADMIN_USERNAME="$(read_env_value "NEW_API_ADMIN_USERNAME")"
NEW_API_ADMIN_PASSWORD="$(read_env_value "NEW_API_ADMIN_PASSWORD")"
UPSTREAM_OPENAI_API_KEY_VALUE="$(read_env_value "UPSTREAM_OPENAI_API_KEY")"
UPSTREAM_OPENAI_BASE_URL_VALUE="$(read_env_value "UPSTREAM_OPENAI_BASE_URL")"
UPSTREAM_OPENAI_CHANNEL_NAME_VALUE="$(read_env_value "UPSTREAM_OPENAI_CHANNEL_NAME")"
UPSTREAM_OPENAI_PUBLIC_MODELS_VALUE="$(read_env_value "UPSTREAM_OPENAI_PUBLIC_MODELS")"
UPSTREAM_OPENAI_MODEL_MAPPING_JSON_VALUE="$(read_env_value "UPSTREAM_OPENAI_MODEL_MAPPING_JSON")"
UPSTREAM_OPENAI_TEST_MODEL_VALUE="$(read_env_value "UPSTREAM_OPENAI_TEST_MODEL")"
[[ -n "${NEW_API_ADMIN_USERNAME}" ]] || fail "NEW_API_ADMIN_USERNAME 未配置"
[[ -n "${NEW_API_ADMIN_PASSWORD}" ]] || fail "NEW_API_ADMIN_PASSWORD 未配置"

if [[ -z "${UPSTREAM_OPENAI_API_KEY_VALUE}" ]]; then
  echo "[WARN] 未检测到 UPSTREAM_OPENAI_API_KEY，跳过 new-api 渠道自动导入。"
  echo "[INFO] 你只需要在 ${ENV_FILE} 填入真实上游凭据后重新执行本脚本。"
  exit 0
fi

COOKIE_JAR="$(mktemp)"
HEADERS_FILE="$(mktemp)"
BODY_FILE="$(mktemp)"
trap 'rm -f "${COOKIE_JAR}" "${HEADERS_FILE}" "${BODY_FILE}"' EXIT

echo "[INFO] 登录 new-api 管理 API"
login_payload="$(cat <<JSON
{
  "username": "${NEW_API_ADMIN_USERNAME}",
  "password": "${NEW_API_ADMIN_PASSWORD}"
}
JSON
)"

login_ok=false
for _ in $(seq 1 5); do
  if curl -sS -D "${HEADERS_FILE}" -o "${BODY_FILE}" -c "${COOKIE_JAR}" \
    -X POST "${NEW_API_URL}/api/user/login" \
    -H "Content-Type: application/json" \
    -d "${login_payload}" >/dev/null; then
    login_ok=true
    break
  fi
  sleep 1
done

[[ "${login_ok}" == "true" ]] || fail "无法连接 new-api 管理登录接口: ${NEW_API_URL}/api/user/login"

NEW_API_ADMIN_USER_ID="$(grep -o '"id":[0-9]\+' "${BODY_FILE}" | head -n 1 | cut -d: -f2)"
[[ -n "${NEW_API_ADMIN_USER_ID}" ]] || fail "new-api 管理员登录失败，未获取到用户 ID"

existing_channels_response="$(curl -sS -b "${COOKIE_JAR}" -H "New-Api-User: ${NEW_API_ADMIN_USER_ID}" "${NEW_API_URL}/api/channel/?p=0&page_size=200")"
existing_channel_id="$(printf '%s' "${existing_channels_response}" \
  | tr -d '\n' \
  | grep -oE "\\{\"id\":[0-9]+[^{}]*\"name\":\"${UPSTREAM_OPENAI_CHANNEL_NAME_VALUE}\"[^{}]*\\}" \
  | head -n 1 \
  | sed -E 's/^\{"id":([0-9]+).*/\1/')"

build_payload() {
  local mode="$1"
  local channel_id="${2:-}"
  if [[ -n "${channel_id}" ]]; then
    cat <<JSON
{
  "mode": "${mode}",
  "channel": {
    "id": ${channel_id},
    "name": "${UPSTREAM_OPENAI_CHANNEL_NAME_VALUE}",
    "type": 1,
    "key": "${UPSTREAM_OPENAI_API_KEY_VALUE}",
    "base_url": "${UPSTREAM_OPENAI_BASE_URL_VALUE}",
    "models": "${UPSTREAM_OPENAI_PUBLIC_MODELS_VALUE}",
    "groups": ["default"],
    "priority": 10,
    "weight": 100,
    "test_model": "${UPSTREAM_OPENAI_TEST_MODEL_VALUE}",
    "model_mapping": "$(printf '%s' "${UPSTREAM_OPENAI_MODEL_MAPPING_JSON_VALUE}" | sed 's/"/\\"/g')"
  }
}
JSON
    return
  fi
  cat <<JSON
{
  "mode": "${mode}",
  "channel": {
    "name": "${UPSTREAM_OPENAI_CHANNEL_NAME_VALUE}",
    "type": 1,
    "key": "${UPSTREAM_OPENAI_API_KEY_VALUE}",
    "base_url": "${UPSTREAM_OPENAI_BASE_URL_VALUE}",
    "models": "${UPSTREAM_OPENAI_PUBLIC_MODELS_VALUE}",
    "groups": ["default"],
    "priority": 10,
    "weight": 100,
    "test_model": "${UPSTREAM_OPENAI_TEST_MODEL_VALUE}",
    "model_mapping": "$(printf '%s' "${UPSTREAM_OPENAI_MODEL_MAPPING_JSON_VALUE}" | sed 's/"/\\"/g')"
  }
}
JSON
}

if [[ -n "${existing_channel_id}" ]]; then
  echo "[INFO] 渠道 ${UPSTREAM_OPENAI_CHANNEL_NAME_VALUE} 已存在（id=${existing_channel_id}），执行更新。"
  update_payload="$(build_payload "single" "${existing_channel_id}")"
  response="$(curl -sS -X PUT "${NEW_API_URL}/api/channel/" \
    -b "${COOKIE_JAR}" \
    -H "Content-Type: application/json" \
    -H "New-Api-User: ${NEW_API_ADMIN_USER_ID}" \
    -d "${update_payload}")"
else
  echo "[INFO] 正在通过 new-api 管理 API 创建 OpenAI-compatible 渠道: ${UPSTREAM_OPENAI_CHANNEL_NAME_VALUE}"
  create_payload="$(build_payload "single")"
  response="$(curl -sS -X POST "${NEW_API_URL}/api/channel/" \
    -b "${COOKIE_JAR}" \
    -H "Content-Type: application/json" \
    -H "New-Api-User: ${NEW_API_ADMIN_USER_ID}" \
    -d "${create_payload}")"
fi

printf '%s\n' "${response}"

if ! printf '%s' "${response}" | tr -d '\n' | grep -q '"success":true'; then
  fail "new-api 渠道创建/更新失败，请检查上游 key、base_url 或当前版本字段差异"
fi

echo "[OK] 渠道同步完成。请重新测试 Playground。"
