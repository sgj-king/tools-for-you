#!/usr/bin/env bash
set -euo pipefail

# 用途：
# 1) 从 openclaw.json 中读取 nvidia* provider 配置（baseUrl / apiKey / models）
# 2) 在 new_api.channels 中创建或更新 Nvidia 渠道
# 3) 将逻辑模型统一映射到 glm5 系列（优先 z-ai/glm5，次选 z-ai/glm5.1）
# 4) 在 platform.provider_routes 中写入 Nvidia 备路由（不覆盖 Groq 主路由）
#
# 说明：
# - 默认只接入“明确支持 z-ai/glm5 或 z-ai/glm5.1”的 Nvidia provider。
# - groq 相关渠道/路由不在本脚本中改动。

OPENCLAW_CONFIG="${OPENCLAW_CONFIG:-/home/sgj/.openclaw/openclaw.json}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3307}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-dev_root_password}"
MYSQL_NEWAPI_DB="${MYSQL_NEWAPI_DB:-new_api}"
MYSQL_PLATFORM_DB="${MYSQL_PLATFORM_DB:-platform}"
# 默认放在 canary 组，避免影响 default 生产链路
NVIDIA_CHANNEL_GROUP="${NVIDIA_CHANNEL_GROUP:-nvidia-canary}"
# 默认禁用，需显式 NVIDIA_CHANNEL_STATUS=1 才参与调度
NVIDIA_CHANNEL_STATUS="${NVIDIA_CHANNEL_STATUS:-0}"
NVIDIA_CHANNEL_PRIORITY="${NVIDIA_CHANNEL_PRIORITY:-50}"
NVIDIA_CHANNEL_WEIGHT="${NVIDIA_CHANNEL_WEIGHT:-10}"

LOGICAL_MODELS="chat-basic,chat-pro,reasoning-pro,vision-pro"
GLM5_MODEL="z-ai/glm5"
GLM5_MODEL_ALT="z-ai/glm5.1"

normalize_openai_base_url_for_newapi() {
  local raw="$1"
  # new-api OpenAI 渠道会自行拼接 /v1/...，因此这里去掉结尾 /v1 以避免 /v1/v1
  raw="${raw%/}"
  if [[ "${raw}" == */v1 ]]; then
    raw="${raw%/v1}"
  fi
  printf "%s" "${raw}"
}

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

info() {
  echo "[INFO] $*"
}

warn() {
  echo "[WARN] $*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少命令: $1"
}

escape_sql() {
  # 仅处理单引号转义：' -> ''
  printf "%s" "$1" | sed "s/'/''/g"
}

mysql_exec() {
  local sql="$1"
  local attempt=1
  local max_attempts=5
  local stdout_file stderr_file
  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  while true; do
    if mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -N -B -e "${sql}" >"${stdout_file}" 2>"${stderr_file}"; then
      cat "${stdout_file}"
      rm -f "${stdout_file}" "${stderr_file}"
      return 0
    fi
    if [[ "${attempt}" -ge "${max_attempts}" ]]; then
      cat "${stderr_file}" >&2
      rm -f "${stdout_file}" "${stderr_file}"
      return 1
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
}

upsert_newapi_channel() {
  local channel_name="$1"
  local base_url="$2"
  local api_key="$3"
  local mapped_model="$4"
  local normalized_base_url
  normalized_base_url="$(normalize_openai_base_url_for_newapi "${base_url}")"

  local esc_name esc_base esc_key esc_models esc_mapping
  local esc_group esc_status esc_priority esc_weight
  esc_name="$(escape_sql "${channel_name}")"
  esc_base="$(escape_sql "${normalized_base_url}")"
  esc_key="$(escape_sql "${api_key}")"
  esc_models="$(escape_sql "${LOGICAL_MODELS}")"
  esc_mapping="$(escape_sql "{\"chat-basic\":\"${mapped_model}\",\"chat-pro\":\"${mapped_model}\",\"reasoning-pro\":\"${mapped_model}\",\"vision-pro\":\"${mapped_model}\"}")"
  esc_group="$(escape_sql "${NVIDIA_CHANNEL_GROUP}")"
  esc_status="$(escape_sql "${NVIDIA_CHANNEL_STATUS}")"
  esc_priority="$(escape_sql "${NVIDIA_CHANNEL_PRIORITY}")"
  esc_weight="$(escape_sql "${NVIDIA_CHANNEL_WEIGHT}")"

  local existing_id
  existing_id="$(mysql_exec "SELECT id FROM ${MYSQL_NEWAPI_DB}.channels WHERE name='${esc_name}' ORDER BY id ASC LIMIT 1;")"

  if [[ -n "${existing_id}" ]]; then
    mysql_exec "UPDATE ${MYSQL_NEWAPI_DB}.channels
      SET type=1,
          \`key\`='${esc_key}',
          base_url='${esc_base}',
          models='${esc_models}',
          \`group\`='${esc_group}',
          test_model='chat-pro',
          status='${esc_status}',
          priority='${esc_priority}',
          weight='${esc_weight}',
          model_mapping='${esc_mapping}'
      WHERE id=${existing_id};"
    info "已更新 new-api 渠道: ${channel_name} (id=${existing_id})"
  else
    mysql_exec "INSERT INTO ${MYSQL_NEWAPI_DB}.channels
      (type,\`key\`,base_url,test_model,status,name,weight,created_time,models,\`group\`,model_mapping,priority)
      VALUES
      (1,'${esc_key}','${esc_base}','chat-pro','${esc_status}','${esc_name}','${esc_weight}',UNIX_TIMESTAMP(),'${esc_models}','${esc_group}','${esc_mapping}','${esc_priority}');"
    info "已创建 new-api 渠道: ${channel_name}"
  fi
}

upsert_platform_route() {
  local id="$1"
  local external_model="$2"
  local profile="$3"
  local provider_code="$4"
  local channel_code="$5"
  local provider_model="$6"
  local priority="$7"
  local rules_json="$8"

  local cost_in cost_out latency
  case "${external_model}" in
    "chat-basic")
      cost_in="0.000300"; cost_out="0.000600"; latency="2500"
      ;;
    "chat-pro")
      cost_in="0.002000"; cost_out="0.008000"; latency="3000"
      ;;
    "reasoning-pro")
      cost_in="0.004000"; cost_out="0.016000"; latency="5000"
      ;;
    "vision-pro")
      cost_in="0.003000"; cost_out="0.012000"; latency="4000"
      ;;
    *)
      fail "未知 external_model: ${external_model}"
      ;;
  esac

  local esc_external esc_profile esc_provider esc_channel esc_model esc_rules
  esc_external="$(escape_sql "${external_model}")"
  esc_profile="$(escape_sql "${profile}")"
  esc_provider="$(escape_sql "${provider_code}")"
  esc_channel="$(escape_sql "${channel_code}")"
  esc_model="$(escape_sql "${provider_model}")"
  esc_rules="$(escape_sql "${rules_json}")"

  mysql_exec "INSERT INTO ${MYSQL_PLATFORM_DB}.provider_routes
    (id, external_model_name, internal_model_profile, provider_code, channel_code, provider_model, priority, weight, region,
     cost_per_input_1k, cost_per_output_1k, latency_slo_ms, is_active, tenant_scope, rules_json)
    VALUES
    (${id}, '${esc_external}', '${esc_profile}', '${esc_provider}', '${esc_channel}', '${esc_model}', ${priority}, 100, 'global',
     ${cost_in}, ${cost_out}, ${latency}, 1, 'default', CAST('${esc_rules}' AS JSON))
    ON DUPLICATE KEY UPDATE
      external_model_name=VALUES(external_model_name),
      internal_model_profile=VALUES(internal_model_profile),
      provider_code=VALUES(provider_code),
      channel_code=VALUES(channel_code),
      provider_model=VALUES(provider_model),
      priority=VALUES(priority),
      weight=VALUES(weight),
      region=VALUES(region),
      cost_per_input_1k=VALUES(cost_per_input_1k),
      cost_per_output_1k=VALUES(cost_per_output_1k),
      latency_slo_ms=VALUES(latency_slo_ms),
      is_active=VALUES(is_active),
      tenant_scope=VALUES(tenant_scope),
      rules_json=VALUES(rules_json);"
}

main() {
  require_cmd jq
  require_cmd mysql
  [[ -f "${OPENCLAW_CONFIG}" ]] || fail "未找到配置文件: ${OPENCLAW_CONFIG}"

  info "读取 Nvidia provider 列表: ${OPENCLAW_CONFIG}"

  local provider_rows
  provider_rows="$(jq -r '
    .models.providers
    | to_entries[]
    | select(.key | test("^nvidia[0-9]+$"))
    | [
        .key,
        (.value.baseUrl // ""),
        (.value.apiKey // ""),
        (
          ([.value.models[]?.id] | index("z-ai/glm5")) as $has_glm5
          | ([.value.models[]?.id] | index("z-ai/glm5.1")) as $has_glm51
          | if $has_glm5 != null then "z-ai/glm5"
            elif $has_glm51 != null then "z-ai/glm5.1"
            else ""
            end
        )
      ]
    | @tsv
  ' "${OPENCLAW_CONFIG}")"

  [[ -n "${provider_rows}" ]] || fail "openclaw.json 中未找到 nvidia provider"

  local configured=0
  local provider_index=0

  while IFS=$'\t' read -r provider_name base_url api_key mapped_model; do
    [[ -n "${provider_name}" ]] || continue
    provider_index=$((provider_index + 1))

    if [[ -z "${base_url}" || -z "${api_key}" ]]; then
      warn "跳过 ${provider_name}: baseUrl 或 apiKey 为空"
      continue
    fi
    if [[ -z "${mapped_model}" ]]; then
      warn "跳过 ${provider_name}: 文档模型列表不包含 ${GLM5_MODEL} / ${GLM5_MODEL_ALT}"
      continue
    fi

    upsert_newapi_channel "${provider_name}" "${base_url}" "${api_key}" "${mapped_model}"

    # 约定：Groq 保持 priority=10 主路由；Nvidia 作为备路由从 20 开始递增。
    local prio
    prio=$((20 + provider_index))

    upsert_platform_route "$((6100 + 1 * 10 + provider_index))" "chat-basic" "chat_basic_v1" "${provider_name}" "${provider_name}" "${mapped_model}" "${prio}" '{"fallback": true, "source": "nvidia-glm5-family"}'
    upsert_platform_route "$((6100 + 2 * 10 + provider_index))" "chat-pro" "chat_pro_v1" "${provider_name}" "${provider_name}" "${mapped_model}" "${prio}" '{"fallback": true, "source": "nvidia-glm5-family"}'
    upsert_platform_route "$((6100 + 3 * 10 + provider_index))" "reasoning-pro" "reasoning_pro_v1" "${provider_name}" "${provider_name}" "${mapped_model}" "${prio}" '{"mode": "reasoning", "source": "nvidia-glm5-family"}'
    upsert_platform_route "$((6100 + 4 * 10 + provider_index))" "vision-pro" "vision_pro_v1" "${provider_name}" "${provider_name}" "${mapped_model}" "${prio}" '{"supports_image": true, "source": "nvidia-glm5-family"}'

    configured=$((configured + 1))
  done <<< "${provider_rows}"

  if [[ "${configured}" -eq 0 ]]; then
    warn "没有可配置的 Nvidia provider（可能都缺少 ${GLM5_MODEL}）"
    exit 0
  fi

  info "完成：已配置 ${configured} 个 Nvidia provider 到 new-api + platform 路由。"
  info "验证建议："
  info "1) mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p'***' -e \"SELECT id,name,models,model_mapping FROM ${MYSQL_NEWAPI_DB}.channels WHERE name REGEXP '^nvidia[0-9]+$';\""
  info "2) mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p'***' -e \"SELECT external_model_name,provider_code,provider_model,priority,is_active FROM ${MYSQL_PLATFORM_DB}.provider_routes WHERE provider_code REGEXP '^nvidia[0-9]+$' ORDER BY external_model_name,priority;\""
}

main "$@"
