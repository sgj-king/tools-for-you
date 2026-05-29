# 上线 Runbook（CRITICAL + HIGH 修复后版本）

本文件汇总：
1. 本轮安全审计修了什么
2. 上线前必须按顺序做完的事
3. 上线后 30 分钟内必跑的回归测试清单
4. 几条容易踩坑的注意点

> 适用范围：`/home/sgj/projects/NewAPI/` 整套栈（Digital_life + IT_tools + platform + production/new-api-prod）。

---

## 一、本次修了什么（按风险分级）

### CRITICAL（生产必修）

| ID | 位置 | 修复 |
|----|------|------|
| C1 | `Digital_life/backend/app/main.py` | 给 `/api/state` `/api/chat` `/api/tts` `/api/memory*` 加 `_require_user`，生产无 session 直接 401 |
| C2 | `platform/services/platform-fastapi/app/main.py` | `INTERNAL_SERVICE_TOKEN` / `PLATFORM_OPS_SHARED_TOKEN` 在 `APP_ENV=production` 下必须配置，否则 `/internal/*` 直接 503，杜绝"忘了配 token = 无认证开放"漏洞 |
| C3 | 同上 | 全局异常处理器在生产不再回 `str(exc)`，避免堆栈 / SQL / 路径泄漏 |
| C4 | `Digital_life/backend/app/main.py` | 全局 `HTTPException` 处理器在生产把 5xx 的 `detail` 收敛成 `"internal error"` |
| C5 | `Digital_life/backend/app/main.py` | `/api/health` 在生产隐藏 LLM / TTS 内部 URL |
| C6 | `production/new-api-prod/nginx/api.example.com.conf` | 把硬编码 `allow 203.0.113.10/32` 改成 `REPLACE_WITH_ADMIN_IP`，未替换时 `nginx -t` 会失败，避免占位 IP 上线 |
| C7 | `platform/apps/platform-console/app/api/playground/chat/stream/route.ts` | Playground 加 session 校验；生产剔除 `PLAYGROUND_DEV_API_KEY` 兜底；可用 `PLATFORM_CONSOLE_PLAYGROUND_MODE=disabled` 关闭 |

### HIGH

| ID | 位置 | 修复 |
|----|------|------|
| H1 / H2 | `platform-fastapi/app/main.py` | `/v1/projects/current/settings` `/v1/security/settings` `/v1/filter-presets*` 全部移除硬编码 `id=2001 / 1001 / owner@example.com`，改为从 session header 解析；新增 `require_session_user()` 辅助 |
| H4 | Playground BFF（同 C7） | session 必须在线 |
| H6 | `IT_tools/src/tools/markdown-editor/markdown-editor.tool.vue`、`IT_tools/src/components/AIChat.vue` | Marked 渲染结果走 DOMPurify；AIChat 的 `v-html` 先 escape 再只允许 `<br>` |
| H7 | `Digital_life/backend/app/main.py` | TTS 失败日志走 `logger.exception`，对外只返回 `"TTS service unavailable"` |
| H8 | `Digital_life/Dockerfile`、`platform/services/platform-fastapi/Dockerfile`、`platform/apps/platform-console/Dockerfile` | 三个镜像全部加 **非 root 用户** + HEALTHCHECK |
| H9 | `production/new-api-prod/compose/redis/redis.conf` | `maxmemory-policy: noeviction → allkeys-lru`，避免缓存写满后阻塞 |
| H10 | `production/new-api-prod/systemd/new-api-stack.service` | 加 `NoNewPrivileges` `PrivateTmp` `ProtectSystem=full` `ProtectHome` `ProtectKernel*` `ProtectControlGroups` `RestrictSUIDSGID` `LockPersonality` |
| H11 | `production/new-api-prod/scripts/healthcheck.sh` | curl Bearer token 改走 `-K -`（stdin），不再出现在 `ps -ef` 的 cmdline 里 |

Nginx 还顺手补齐：HSTS + preload、CSP、COOP、X-Permitted-Cross-Domain-Policies、TLS 1.2/1.3 only、OCSP stapling、`ssl_session_tickets off`、`send_timeout` 从 3600s 降到 120s。

---

## 二、上线前必须做的事（按顺序）

### 1. 生成密钥

```bash
cd /opt/new-api   # 或你的项目根
scripts/gen-prod-secrets.sh                # 同时生成 platform + Digital_life 的 .env.prod
chmod 600 platform/.env.prod Digital_life/.env.prod
```

然后人工打开两个 `.env.prod`，把所有 `<FILL_ME_*>` 占位填掉（域名、上游 LLM key、Grafana 用户名、SMTP 等）。

### 2. 重点核对环境变量

**`platform/.env.prod`：**

- `APP_ENV=production`（决定异常脱敏 + token 强校验是否生效）
- `INTERNAL_SERVICE_TOKEN` 非空，且和所有调用方一致
- `PLATFORM_OPS_SHARED_TOKEN` 非空
- `PLATFORM_CONSOLE_PLAYGROUND_MODE`：要么 `real`（启用，需登录），要么 `disabled`（直接 404）
- `PLAYGROUND_DEV_API_KEY` **必须留空**，生产已不再读它
- `SESSION_COOKIE_SECURE=true`、`SESSION_COOKIE_SAMESITE=lax` 或 `strict`

**`Digital_life/.env.prod`：**

- `APP_ENV=production`
- 数字人 LLM / TTS 的真实 endpoint + key 已填

**`production/new-api-prod/compose/.env`：**

- `NEW_API_PORT`、`MYSQL_ROOT_PASSWORD`、`REDIS_PASSWORD`、`APP_PUBLIC_URL`、`HEALTHCHECK_MODEL_NAME` 全部已填
- 文件权限：`chmod 600`

### 3. 改 Nginx 占位 IP

打开 `production/new-api-prod/nginx/api.example.com.conf`：

```nginx
allow REPLACE_WITH_ADMIN_IP;     # ← 两处都要改成你的固定公网 IP / CIDR
```

然后：

```bash
sudo cp production/new-api-prod/nginx/api.example.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/api.example.com.conf /etc/nginx/sites-enabled/
sudo nginx -t   # 必须通过；如果你忘了改占位 IP，这里会失败
```

### 4. 申请证书

```bash
sudo certbot --nginx -d api.yourdomain.com --rsa-key-size 4096 --must-staple
```

### 5. 装 systemd unit

```bash
sudo cp production/new-api-prod/systemd/new-api-stack.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable new-api-stack
```

### 6. 检查 `.gitignore` / 仓库清洁度

```bash
git status --short                          # 不应该看到任何 .env.prod
git ls-files | grep -E '\.env\.prod$'       # 必须输出为空
```

### 7. 首次部署

```bash
cd production/new-api-prod
docker compose --env-file compose/.env -f compose/docker-compose.yml pull
docker compose --env-file compose/.env -f compose/docker-compose.yml up -d
sudo systemctl start nginx
sudo systemctl start new-api-stack
```

### 8. 跑健康检查

```bash
production/new-api-prod/scripts/healthcheck.sh
```

首次跑会跳过 `[6/6]`；想跑就把 healthcheck token 写到 `compose/.healthcheck_token`（权限 600）。

---

## 三、回归测试清单（上线 30 分钟内逐条跑）

### 安全相关（这次修的）

- [ ] **未登录访问 `/api/state`、`/api/chat`、`/api/tts`** → 期望 401
- [ ] **未登录访问 `/api/playground/chat/stream`** → 期望 401
- [ ] **设 `PLATFORM_CONSOLE_PLAYGROUND_MODE=disabled` 重启** → Playground 接口返回 404
- [ ] **故意触发后端异常**（比如关掉数据库连下接口）→ 响应 body 里不应出现堆栈 / 路径 / SQL
- [ ] **`/api/health`（数字人）** → `urls` 字段在生产应为空或不存在
- [ ] **`/v1/projects/current/settings`、`/v1/security/settings`、`/v1/filter-presets` 不带 session header** → 期望 401
- [ ] **Markdown 编辑器贴 `<img src=x onerror=alert(1)>`** → 预览不能弹窗
- [ ] **AIChat 让 AI 回复含 `<script>` 串** → 不能执行
- [ ] **`curl https://你的域名/api/` 从非 admin IP** → 403
- [ ] **`curl https://你的域名/v1/models` 不带 Bearer** → 401
- [ ] **`curl -I https://你的域名/`** → 响应头有 `Strict-Transport-Security`、`Content-Security-Policy`、`X-Frame-Options`
- [ ] **`ssllabs.com` 扫描你的域名** → A 或 A+
- [ ] **容器是否以非 root 跑**：`docker exec <container> id` → 应非 `uid=0`

### 功能回归

- [ ] 用户登录 → 进入 console → Playground 发一条消息能看到流式响应
- [ ] 创建 / 删除 filter-preset（验 H1 / H2 没有把 org 拿错）
- [ ] 数字人页面登录后能聊、能 TTS、能查 memory
- [ ] IT_tools 主页能加载、所有工具页能进
- [ ] `/v1/chat/completions` 走 gateway 真实跑一次（`healthcheck.sh` 的 `[6/6]`）
- [ ] Grafana / Prometheus 能看到 metrics
- [ ] `docker compose ps` 全部 healthy

### 监控 / 告警

- [ ] 故意 kill 一个 worker 容器 → Docker 自动拉起 + Grafana 告警
- [ ] 把 Redis 停 30 秒 → 业务降级但不雪崩，恢复后限流计数能自愈
- [ ] MySQL 主连接耗尽 → 后端返回 503，不会把 5xx 详情泄漏给前端

---

## 四、必须特别注意的几个点

1. **`.env.prod` 永远不要进 git。** 已确认目前未跟踪；上线后做一次 `git ls-files | grep env.prod` 复查。
2. **`PLAYGROUND_DEV_API_KEY` 在生产必须为空字符串。** 生产代码已不再读它，但留着就是钓鱼，干脆 unset。
3. **Nginx `REPLACE_WITH_ADMIN_IP` 没换会 `nginx -t` 失败**，这是故意的。换成你自己的 IP / CIDR；如果办公网 IP 不固定，考虑改用 VPN 段 / 跳板机白名单。
4. **首次部署后看 MySQL 是否做了 `mysql_secure_installation`**，并确保 `MYSQL_ROOT_PASSWORD` 不复用其它环境。
5. **Redis 现在是 `allkeys-lru`**：关键 key（比如长期幂等键）若不能被淘汰，业务侧要么 `PERSIST` 要么换一套独立 namespace。
6. **生产开 `APP_ENV=production` 之后，本地排错会更难。** 出问题先看容器日志 `docker compose logs -f --tail=200 <service>`，不要靠浏览器响应里的 stacktrace。
7. **回滚预案**：保留上一版镜像 tag，回滚就是 `docker compose pull <旧 tag> && docker compose up -d`。`.env.prod` 不动，迁移如果有 schema 变更要单独评估。
8. **第一周建议每天跑一次 `healthcheck.sh`**，并把 `.healthcheck_token` 写好启用 `[6/6]`。
