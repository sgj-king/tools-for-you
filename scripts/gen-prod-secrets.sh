#!/usr/bin/env bash
# =========================================================================
# scripts/gen-prod-secrets.sh
# 从 .env.prod.example 生成填好随机密钥的 .env.prod
#
# 用法:
#   scripts/gen-prod-secrets.sh                    # 同时生成 platform + Digital_life
#   scripts/gen-prod-secrets.sh platform           # 只生成 platform/.env.prod
#   scripts/gen-prod-secrets.sh digital-life       # 只生成 Digital_life/.env.prod
#   scripts/gen-prod-secrets.sh --force            # 覆盖已存在的 .env.prod
#
# 替换规则:
#   REPLACE_WITH_RANDOM_HEX_32_*  -> openssl rand -hex 16   (32 个十六进制字符)
#   REPLACE_WITH_RANDOM_HEX_48_*  -> openssl rand -hex 24   (48 个十六进制字符)
#   REPLACE_WITH_RANDOM_HEX_64_*  -> openssl rand -hex 32   (64 个十六进制字符)
#   REPLACE_WITH_*                -> openssl rand -hex 32   (默认 64 字符)
#
# 同名 REPLACE_WITH_* 标签会用同一份随机串（便于交叉引用）
# <FILL_ME_*> 保持原样，需要人工填写
# =========================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE=0
TARGETS=()

for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=1 ;;
    platform)        TARGETS+=("platform") ;;
    digital-life|dl) TARGETS+=("digital-life") ;;
    *) echo "[ERROR] 未知参数: $arg" >&2; exit 2 ;;
  esac
done

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  TARGETS=("platform" "digital-life")
fi

command -v openssl >/dev/null || { echo "[ERROR] 需要 openssl"; exit 1; }

gen_secret() {
  local bytes="$1"
  openssl rand -hex "$bytes"
}

process_file() {
  local example="$1"
  local target="$2"
  if [[ ! -f "$example" ]]; then
    echo "[SKIP] 找不到模板: $example"; return
  fi
  if [[ -f "$target" && $FORCE -ne 1 ]]; then
    echo "[SKIP] 已存在: $target (加 --force 覆盖)"; return
  fi

  declare -A cache=()
  local out=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    # 只匹配带显式 _HEX_NN_ 后缀且后面跟标识符的占位
    # 例如: REPLACE_WITH_RANDOM_HEX_32_FOO  REPLACE_WITH_RANDOM_HEX_64_BAR
    while [[ "$line" =~ (REPLACE_WITH_RANDOM_HEX_(32|48|64)_[A-Z0-9_]+) ]]; do
      local match="${BASH_REMATCH[1]}"
      local bits="${BASH_REMATCH[2]}"
      local bytes=$(( bits / 2 ))
      if [[ -z "${cache[$match]:-}" ]]; then
        cache[$match]="$(gen_secret "$bytes")"
      fi
      line="${line/$match/${cache[$match]}}"
    done
    out+="$line"$'\n'
  done < "$example"

  printf '%s' "$out" > "$target"
  chmod 600 "$target"
  echo "[OK] 已生成 $target (权限 600，含 ${#cache[@]} 个随机密钥)"
  for key in "${!cache[@]}"; do
    printf '       %-50s -> %s…\n' "$key" "${cache[$key]:0:8}"
  done | sort
}

for t in "${TARGETS[@]}"; do
  case "$t" in
    platform)
      process_file "${REPO_ROOT}/platform/.env.prod.example" "${REPO_ROOT}/platform/.env.prod" ;;
    digital-life)
      process_file "${REPO_ROOT}/Digital_life/.env.prod.example" "${REPO_ROOT}/Digital_life/.env.prod" ;;
  esac
done

cat <<'TIP'

下一步:
  1. 编辑刚生成的 .env.prod，把 <FILL_ME_*> 占位符替换为真实业务值
     （域名、Grafana 用户名、上游 API key 等）
  2. 严禁把 .env.prod 提交到 git；请确认它已在 .gitignore 中
  3. 部署时通过 --env-file .env.prod 注入容器
TIP
