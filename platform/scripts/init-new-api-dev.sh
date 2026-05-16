#!/usr/bin/env bash
set -euo pipefail

# 初始化开发环境中的 new-api 管理员账户。
# 说明：
# 1. 只负责完成 /api/setup 初始化。
# 2. 不会自动创建上游渠道；真实模型调用仍需手动进入后台添加 provider/channel。

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
NEW_API_URL="${NEW_API_URL:-http://127.0.0.1:3005}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

json_has_true() {
  local payload="$1"
  local key="$2"
  printf '%s' "${payload}" | tr -d '\n' | grep -Eq "\"${key}\":true"
}

if [[ ! -f "${ENV_FILE}" ]]; then
  fail "未找到 ${ENV_FILE}"
fi

read_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  line="${line#*=}"
  printf '%s' "${line}"
}

NEW_API_ADMIN_USERNAME="$(read_env_value "NEW_API_ADMIN_USERNAME")"
NEW_API_ADMIN_PASSWORD="$(read_env_value "NEW_API_ADMIN_PASSWORD")"
NEW_API_USAGE_MODE_VALUE="$(read_env_value "NEW_API_USAGE_MODE")"
NEW_API_INTERNAL_TOKEN_VALUE="$(read_env_value "NEW_API_INTERNAL_TOKEN")"
NEW_API_DB_USER_VALUE="$(read_env_value "NEW_API_DB_USER")"
NEW_API_DB_PASSWORD_VALUE="$(read_env_value "NEW_API_DB_PASSWORD")"
NEW_API_DB_NAME_VALUE="$(read_env_value "NEW_API_DB_NAME")"
MYSQL_HOST_PORT_VALUE="$(read_env_value "MYSQL_HOST_PORT")"

[[ -n "${NEW_API_ADMIN_USERNAME}" ]] || fail "NEW_API_ADMIN_USERNAME 未配置"
[[ -n "${NEW_API_ADMIN_PASSWORD}" ]] || fail "NEW_API_ADMIN_PASSWORD 未配置"

self_use_enabled=false
demo_site_enabled=false

case "${NEW_API_USAGE_MODE_VALUE:-external}" in
  self)
    self_use_enabled=true
    ;;
  demo)
    demo_site_enabled=true
    ;;
  external)
    ;;
  *)
    fail "NEW_API_USAGE_MODE 仅支持 self / demo / external"
    ;;
esac

ensure_relay_internal_token() {
  if [[ -z "${NEW_API_INTERNAL_TOKEN_VALUE}" ]]; then
    echo "[WARN] NEW_API_INTERNAL_TOKEN 未配置，跳过 relay 内部 token 引导"
    return 0
  fi

  if ! command -v mysql >/dev/null 2>&1; then
    echo "[WARN] 当前环境未找到 mysql 客户端，跳过 relay 内部 token 引导"
    return 0
  fi

  local mysql_port="${MYSQL_HOST_PORT_VALUE:-3307}"
  local admin_user_id
  admin_user_id="$(mysql -h127.0.0.1 -P"${mysql_port}" -u"${NEW_API_DB_USER_VALUE}" -p"${NEW_API_DB_PASSWORD_VALUE}" -D "${NEW_API_DB_NAME_VALUE}" -Nse "select id from users where username='${NEW_API_ADMIN_USERNAME}' limit 1" 2>/dev/null || true)"

  if [[ -z "${admin_user_id}" ]]; then
    fail "未找到 new-api 管理员用户，无法创建 relay 内部 token"
  fi

  local token_count
  token_count="$(mysql -h127.0.0.1 -P"${mysql_port}" -u"${NEW_API_DB_USER_VALUE}" -p"${NEW_API_DB_PASSWORD_VALUE}" -D "${NEW_API_DB_NAME_VALUE}" -Nse "select count(*) from tokens where \`key\`='${NEW_API_INTERNAL_TOKEN_VALUE}'" 2>/dev/null || true)"

  if [[ "${token_count}" == "0" ]]; then
    echo "[INFO] 创建 relay -> new-api 的内部 token"
    mysql -h127.0.0.1 -P"${mysql_port}" -u"${NEW_API_DB_USER_VALUE}" -p"${NEW_API_DB_PASSWORD_VALUE}" -D "${NEW_API_DB_NAME_VALUE}" -e "insert into tokens (user_id, \`key\`, status, name, created_time, expired_time, remain_quota, unlimited_quota, \`group\`) values (${admin_user_id}, '${NEW_API_INTERNAL_TOKEN_VALUE}', 1, 'relay-dev-internal', UNIX_TIMESTAMP(), -1, 100000000, 1, 'default');" >/dev/null
  else
    echo "[INFO] relay 内部 token 已存在，跳过创建"
  fi
}

echo "[INFO] 等待 new-api 就绪: ${NEW_API_URL}/api/status"
status_response=""
for _ in $(seq 1 60); do
  if status_response="$(curl -sS "${NEW_API_URL}/api/status" 2>/dev/null)"; then
    break
  fi
  sleep 2
done

[[ -n "${status_response}" ]] || fail "new-api 状态接口不可达"

if json_has_true "${status_response}" "root_init" || json_has_true "${status_response}" "setup"; then
  echo "[INFO] new-api 已完成初始化，跳过 /api/setup"
  printf '%s\n' "${status_response}"
  ensure_relay_internal_token
  exit 0
fi

echo "[INFO] 提交 new-api 初始化请求"
setup_response="$(curl -sS "${NEW_API_URL}/api/setup" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{
  "username": "${NEW_API_ADMIN_USERNAME}",
  "password": "${NEW_API_ADMIN_PASSWORD}",
  "confirmPassword": "${NEW_API_ADMIN_PASSWORD}",
  "SelfUseModeEnabled": ${self_use_enabled},
  "DemoSiteEnabled": ${demo_site_enabled}
}
JSON
)")" || fail "调用 /api/setup 失败"

printf '%s\n' "${setup_response}"

echo "[INFO] 再次检查初始化状态"
status_response="$(curl -sS "${NEW_API_URL}/api/status")" || fail "重新获取 /api/status 失败"
printf '%s\n' "${status_response}"

if ! json_has_true "${status_response}" "root_init" && ! json_has_true "${status_response}" "setup"; then
  fail "new-api 初始化后仍未处于已完成状态"
fi

ensure_relay_internal_token

echo "[OK] new-api 初始化完成。请继续进入后台配置上游渠道和模型映射。"
