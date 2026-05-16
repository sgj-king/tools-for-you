#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_DIR="$(cd "${PLATFORM_DIR}/.." && pwd)"

ENV_FILE=""
if [[ -f "${PLATFORM_DIR}/.env" ]]; then
  ENV_FILE="${PLATFORM_DIR}/.env"
elif [[ -f "${PLATFORM_DIR}/.env.example" ]]; then
  ENV_FILE="${PLATFORM_DIR}/.env.example"
fi

read_env_value() {
  local key="$1"
  if [[ -z "${ENV_FILE}" ]]; then
    return 0
  fi
  awk -F= -v key="${key}" '
    $1 == key {
      sub(/^[^=]*=/, "")
      gsub(/^"|"$/, "")
      gsub(/^'\''|'\''$/, "")
      print
      exit
    }
  ' "${ENV_FILE}"
}

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_HOST_PORT="${MYSQL_HOST_PORT:-$(read_env_value MYSQL_HOST_PORT)}"
MYSQL_HOST_PORT="${MYSQL_HOST_PORT:-3307}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-$(read_env_value MYSQL_ROOT_PASSWORD)}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-dev_root_password}"
PLATFORM_DB_NAME="${PLATFORM_DB_NAME:-$(read_env_value PLATFORM_DB_NAME)}"
PLATFORM_DB_NAME="${PLATFORM_DB_NAME:-platform}"

MYSQL=(mysql --protocol=tcp -h"${MYSQL_HOST}" -P"${MYSQL_HOST_PORT}" -uroot "-p${MYSQL_ROOT_PASSWORD}")
INIT_DIR="${REPO_DIR}/platform/infra/dev/mysql/init"

echo "Applying platform database schema and hardening SQL to ${MYSQL_HOST}:${MYSQL_HOST_PORT}/${PLATFORM_DB_NAME}..."
"${MYSQL[@]}" -e "SOURCE ${INIT_DIR}/010-platform-core.sql"
"${MYSQL[@]}" -e "SOURCE ${INIT_DIR}/020-platform-seed.sql"
"${MYSQL[@]}" -e "SOURCE ${INIT_DIR}/030-platform-db-hardening.sql"

echo
echo "Database health checks (all n values should be 0):"
"${MYSQL[@]}" -D "${PLATFORM_DB_NAME}" -e "
SELECT 'usage_negative_amounts' AS check_name, COUNT(*) AS n
FROM usage_records
WHERE provider_cost < 0 OR sale_amount < 0 OR billable_units < 0
UNION ALL
SELECT 'usage_missing_finished_at', COUNT(*)
FROM usage_records
WHERE settlement_status IN ('settled','failed') AND finished_at IS NULL
UNION ALL
SELECT 'duplicate_request_id', COALESCE(SUM(cnt - 1), 0)
FROM (SELECT request_id, COUNT(*) AS cnt FROM usage_records GROUP BY request_id HAVING COUNT(*) > 1) d
UNION ALL
SELECT 'duplicate_route_identity', COALESCE(SUM(cnt - 1), 0)
FROM (
  SELECT external_model_name, provider_code, channel_code, provider_model, region, tenant_scope, COUNT(*) AS cnt
  FROM provider_routes
  GROUP BY external_model_name, provider_code, channel_code, provider_model, region, tenant_scope
  HAVING COUNT(*) > 1
) d
UNION ALL
SELECT 'duplicate_org_level_entitlement', COALESCE(SUM(cnt - 1), 0)
FROM (
  SELECT organization_id, external_model_name, COUNT(*) AS cnt
  FROM model_entitlements
  WHERE project_id IS NULL
  GROUP BY organization_id, external_model_name
  HAVING COUNT(*) > 1
) d
UNION ALL
SELECT 'orphan_usage_org', COUNT(*)
FROM usage_records ur LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE o.id IS NULL
UNION ALL
SELECT 'orphan_usage_project', COUNT(*)
FROM usage_records ur LEFT JOIN projects p ON p.id = ur.project_id
WHERE p.id IS NULL
UNION ALL
SELECT 'orphan_usage_api_key', COUNT(*)
FROM usage_records ur LEFT JOIN api_keys ak ON ak.id = ur.api_key_id
WHERE ak.id IS NULL;
"

echo
echo "Table summary:"
"${MYSQL[@]}" -e "
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA='${PLATFORM_DB_NAME}'
ORDER BY TABLE_NAME;
"
