# 生产部署前自检清单

> 上线前对照逐项打勾，所有 ⛔ 必须 Done 才能开放公网入口。

## ⛔ 密钥与配置

- [ ] `platform/.env.prod` 已存在且 `chmod 600`，不在 git 跟踪
- [ ] `Digital_life/.env.prod` 已存在且 `chmod 600`，不在 git 跟踪
- [ ] 已运行 `scripts/gen-prod-secrets.sh`（或手工 `openssl rand -hex 32/48/64`）替换全部 `REPLACE_WITH_RANDOM_*` 占位符
- [ ] 所有 `<FILL_ME_*>` 占位符替换为真实业务值（域名 / 管理员账号 / Platform API key 等）
- [ ] `PLATFORM_SESSION_SECRET` 在 `platform/.env.prod` 与 `Digital_life/.env.prod` **完全一致**（跨服务签名验证 cookie 用）
- [ ] `JWT_SIGNING_KEY` / `NEW_API_SESSION_SECRET` / `NEW_API_CRYPTO_SECRET` / `INTERNAL_SERVICE_TOKEN` / `PLATFORM_OPS_SHARED_TOKEN` 全部独立随机
- [ ] `DEV_DEMO_API_KEY` 留空（生产 auth 检测到此变量为空会跳过 demo key 注入）

## ⛔ Cookie / Origin / CORS

- [ ] `PLATFORM_CONSOLE_COOKIE_SECURE=true`，`PLATFORM_CONSOLE_COOKIE_SAMESITE=lax`
- [ ] `PLATFORM_COOKIE_DOMAIN=.<根域>`，跨子域共享登录态（如不需要则留空）
- [ ] `PLATFORM_CONSOLE_ALLOWED_ORIGINS` 列出全部子域 `https://chat./console./app./ops./api.`
- [ ] `DIGITAL_LIFE_ALLOWED_ORIGINS` 不含 `*`，只含真实前端来源
- [ ] 所有公网 URL (`*_PUBLIC_URL`) 都是 `https://`，没有 `http://`

## ⛔ 调试与日志

- [ ] `APP_ENV=production`，`LOG_LEVEL=info`
- [ ] `PLATFORM_CONSOLE_APP_ENV=production`，`PLATFORM_CONSOLE_ENABLE_MOCK=false`，`PLATFORM_CONSOLE_PLAYGROUND_MODE=disabled`
- [ ] new-api: docker-compose 内已写死 `DEBUG=false` / `ERROR_LOG_ENABLED=false` / `GENERATE_DEFAULT_TOKEN=false`
- [ ] Digital_life: `DOCS_ENABLED=0`（关闭 /docs /redoc /openapi.json）
- [ ] 没有任何服务以 `--reload` 或 dev server 模式启动

## ⛔ 模型与计费

- [ ] new-api channel 已配置至少一个真实上游（`UPSTREAM_OPENAI_API_KEY` 非占位）
- [ ] `UPSTREAM_OPENAI_PUBLIC_MODELS` 含 `chat-basic` 与 `chat-pro`
- [ ] `UPSTREAM_OPENAI_MODEL_MAPPING_JSON` 中 `chat-basic` 映射到便宜的小模型，`chat-pro` 映射到主力模型
- [ ] `DIGITAL_LIFE_PLATFORM_API_KEY` 已从 console 创建并填入（同一 key 既路由 chat-basic 也路由 chat-pro）
- [ ] 测试账号 `owner@example.com` 已被禁用或改为强密码（dev seed 默认 `dev-password`）

## ⛔ 数据持久化

- [ ] MySQL volume 已规划备份（`docker exec mysql mysqldump …` 或独立 backup 容器）
- [ ] new-api logs volume 已挂载到宿主机持久路径
- [ ] Digital_life agent_workspace 已挂载并定期清理或备份

## 网络 / 反代（Sprint 3 实施时勾选）

- [ ] Nginx / Caddy 反代已配置子域 → 容器 127.0.0.1:host_port
- [ ] Let's Encrypt 证书已签发并自动续期
- [ ] 仅 80/443 暴露公网，其它端口仅 127.0.0.1
- [ ] WAF / fail2ban 已就绪（可选但推荐）

## 可观测

- [ ] Prometheus 抓到所有 service 的 /metrics（targets up == 1）
- [ ] `alerts.yml` 已加载，告警通道（邮件/钉钉/飞书 webhook）已配置
- [ ] Grafana 首登已改密码并打开总览 dashboard 验证数据

## 合规（如需公开服务于中国大陆）

- [ ] 已完成 ICP 备案（域名）
- [ ] 已完成 算法备案（生成式 AI 服务）
- [ ] 内容审核已启用（Digital_life chat 调 platform-risk）
- [ ] 用户协议 / 隐私政策 / 投诉入口已上线

## 上线烟测

执行顺序：

1. `curl -fsS https://console.<domain>/api/healthz`
2. 注册一个真实账号，登录后切换到 Pro / Free，确认订阅页响应正常
3. `curl -fsS https://chat.<domain>/api/health`
4. 用注册账号登录 chat，发一条消息，对照后端日志确认 provider 为 `gateway:chat-pro` 或 `gateway:chat-basic`
5. 触发一条审核命中关键词（如部署后再灰度测），确认收到友好拒答
6. Prometheus 看 `up{}` 全部 == 1，看一条人为 chat 失败是否在 5 分钟内触发告警
