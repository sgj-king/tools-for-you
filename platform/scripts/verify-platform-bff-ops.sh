#!/usr/bin/env bash
set -euo pipefail

# 一键验证 platform-console BFF -> platform-ops 的关键联调链路。
# 覆盖范围：
# 1) 列表查询：team/webhooks/invoices/bills/request-logs
# 2) 写操作：team 邀请、webhook 创建与测试、bill 更新、invoice 更新
# 3) 导出：team CSV

BASE_URL="${BASE_URL:-http://127.0.0.1:3200}"

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

extract_field() {
  local payload="$1"
  local key="$2"
  printf '%s' "${payload}" | sed -n "s/.*\"${key}\":\"\\([^\"]*\\)\".*/\\1/p" | head -n1
}

echo "[INFO] 检查 platform-console 健康状态"
health_response="$(curl -sS "${BASE_URL}/api/healthz")" || fail "healthz 请求失败"
printf '%s\n' "${health_response}" | grep -q '"ok":true' || fail "healthz 未返回 ok=true"

echo "[INFO] 查询 team/webhooks/invoices/bills/request-logs"
curl -sS "${BASE_URL}/api/platform/team/members?page=1&page_size=2" | grep -q '"data"' || fail "team members 查询失败"
curl -sS "${BASE_URL}/api/platform/webhooks?page=1&page_size=2" | grep -q '"data"' || fail "webhooks 查询失败"
curl -sS "${BASE_URL}/api/platform/invoices?page=1&page_size=2" | grep -q '"data"' || fail "invoices 查询失败"
curl -sS "${BASE_URL}/api/platform/bills?page=1&page_size=2" | grep -q '"data"' || fail "bills 查询失败"
logs_payload="$(curl -sS "${BASE_URL}/api/platform/request-logs?page=1&page_size=2")" || fail "request logs 查询失败"
printf '%s' "${logs_payload}" | grep -q '"data"' || fail "request logs 返回为空"

trace_id="$(extract_field "${logs_payload}" "traceId")"
if [[ -n "${trace_id}" ]]; then
  echo "[INFO] 按 trace_id 联动请求详情: ${trace_id}"
  curl -sS "${BASE_URL}/api/platform/request-logs/${trace_id}" | grep -q '"requestId"' || fail "trace 详情查询失败"
fi

echo "[INFO] 创建团队邀请"
invite_email="ops.verify.$(date +%s)@example.com"
invite_payload="$(curl -sS -X POST "${BASE_URL}/api/platform/team/invitations" -H "Content-Type: application/json" -d "{\"email\":\"${invite_email}\",\"role\":\"member\",\"projectScope\":[\"demo-project\"]}")" || fail "团队邀请失败"
printf '%s' "${invite_payload}" | grep -q '"inviteStatus":"sent"' || fail "团队邀请返回异常"

echo "[INFO] 创建 Webhook 并执行测试投递"
webhook_payload="$(curl -sS -X POST "${BASE_URL}/api/platform/webhooks" -H "Content-Type: application/json" -d "{\"name\":\"Ops Verify Webhook\",\"endpoint\":\"https://hooks.example.com/ops-verify\",\"events\":[\"request.trace.recorded\"],\"retryPolicy\":\"指数退避，最多 4 次\"}")" || fail "Webhook 创建失败"
webhook_id="$(extract_field "${webhook_payload}" "id")"
[[ -n "${webhook_id}" ]] || fail "未从 Webhook 创建响应中解析到 id"
curl -sS -X POST "${BASE_URL}/api/platform/webhooks/test" -H "Content-Type: application/json" -d "{\"webhookId\":\"${webhook_id}\",\"event\":\"request.trace.recorded\"}" | grep -q '"deliveryId"' || fail "Webhook 测试失败"

echo "[INFO] 更新账单与发票状态"
bills_payload="$(curl -sS "${BASE_URL}/api/platform/bills?page=1&page_size=1")" || fail "账单读取失败"
bill_id="$(extract_field "${bills_payload}" "id")"
[[ -n "${bill_id}" ]] || fail "未解析到账单 id"
curl -sS -X PUT "${BASE_URL}/api/platform/bills/${bill_id}" -H "Content-Type: application/json" -d '{"status":"partial","notes":"ops-verify"}' | grep -q '"status":"partial"' || fail "账单更新失败"

invoices_payload="$(curl -sS "${BASE_URL}/api/platform/invoices?page=1&page_size=1")" || fail "发票读取失败"
invoice_id="$(extract_field "${invoices_payload}" "id")"
[[ -n "${invoice_id}" ]] || fail "未解析到发票 id"
curl -sS -X PUT "${BASE_URL}/api/platform/invoices/${invoice_id}" -H "Content-Type: application/json" -d '{"status":"paid","notes":"ops-verify"}' | grep -q '"status":"paid"' || fail "发票更新失败"

echo "[INFO] 检查团队导出 CSV 响应头"
headers="$(curl -sSI "${BASE_URL}/api/platform/team/members/export")" || fail "团队导出接口失败"
printf '%s' "${headers}" | grep -qi 'content-disposition: attachment; filename="team-members.csv"' || fail "导出响应头不正确"

echo "[OK] platform-console BFF -> platform-ops 联调验证通过。"
