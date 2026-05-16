# NewAPI + AI Platform + Digital Life 项目说明

本仓库把三部分能力放在同一个开发工作区中：

1. `platform/`：商业 AI 平台骨架，包含 FastAPI 版网关链路、平台控制台、Digital_life 融合首页、数据库、Redis、NATS、Prometheus、Grafana 和 `new-api` 适配层。
2. `Digital_life/`：星语 StarryChat 数字生命项目，包含自己的 FastAPI 后端和静态前端。
3. 融合首页：`Digital_life` 首屏保留数字生命交互，下方融合原 NewAPI/平台首页模块，包括控制台入口、服务状态、KPI、账务、渠道健康和 Preset 快捷入口。

## 目录结构

```text
/home/sgj/projects/NewAPI
├── Digital_life/
│   ├── backend/
│   │   ├── app/main.py              # Digital_life FastAPI 入口
│   │   ├── app/config.py            # LLM/TTS/平台链接配置
│   │   └── data/agent_workspace/    # 长期记忆、每日记忆、情绪状态
│   └── frontend/
│       ├── index.html               # 融合后的首页 HTML
│       └── src/
│           ├── app.js               # 星语交互 + 平台首页渲染逻辑
│           └── styles.css           # 数字生命和平台首页样式
├── platform/
│   ├── apps/platform-console/       # Next.js 平台控制台
│   ├── infra/dev/docker-compose.yml # 开发环境 Docker 编排
│   ├── infra/dev/mysql/init/        # 平台表结构与种子数据
│   ├── scripts/                     # 启停、初始化、验证、模型配置脚本
│   └── services/platform-fastapi/   # FastAPI 版平台后端
├── production/                      # 生产相关预留目录
└── runtime/                         # 本地运行数据目录
```

## 总体架构

```mermaid
flowchart LR
  User["用户 / 下游应用"] --> DL["Digital_life 首页 :8008"]
  User --> Console["Platform Console :3200"]
  User --> Gateway["Platform Gateway :8088"]

  DL --> DLApi["Digital_life FastAPI"]
  DLApi --> OpenClaw["OpenClaw / OpenAI-compatible LLM"]
  DLApi --> TTS["FreeTTS / TTSFM / 浏览器 TTS"]
  DLApi --> PlatformLinks["平台状态聚合 / 链接"]

  Console --> ConsoleBff["Next.js API Routes"]
  ConsoleBff --> Ops["platform-ops FastAPI :8086"]

  Gateway --> Auth["identity/auth :18082"]
  Gateway --> Policy["policy :8083"]
  Gateway --> Billing["billing :8082"]
  Gateway --> Relay["relay :8085"]
  Relay --> NewAPI["new-api :3005"]
  NewAPI --> Upstream["上游模型服务"]

  Auth --> MySQL["MySQL :3307"]
  Policy --> MySQL
  Billing --> MySQL
  Ops --> MySQL
  Gateway --> Redis["Redis :6380"]
```

核心调用链：

1. 下游应用调用 `platform-gateway` 的 OpenAI-compatible API。
2. Gateway 读取 Bearer API Key，调用 `identity` 验证 key。
3. Gateway 调用 `policy` 检查模型权益、限额配置和路由。
4. Gateway 调用 `billing` 做预授权冻结。
5. Gateway 调用 `relay`，由 relay 带内部 token 转发到 `new-api`。
6. `new-api` 根据 channel/model mapping 请求真实上游模型。
7. 请求完成后 Gateway 调用 `billing/finalize` 写入用量、账本和 trace。

## 默认端口

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| Digital_life 融合首页 | `http://127.0.0.1:8008/` | 星语首屏 + 平台首页模块，已纳入 Docker Compose |
| Platform Gateway | `http://127.0.0.1:8088` | 下游 API 主入口 |
| Auth / Identity | `http://127.0.0.1:18082` | API Key 校验 |
| Billing | `http://127.0.0.1:8082` | 预授权、结算、账本 |
| Policy | `http://127.0.0.1:8083` | 权益与路由策略 |
| Risk | `http://127.0.0.1:8084` | 风控骨架 |
| Relay | `http://127.0.0.1:8085` | 转发到 new-api |
| Ops BFF | `http://127.0.0.1:8086` | 控制台后端 |
| Platform Console | `http://127.0.0.1:3200` | 平台控制台 |
| Customer Console | `http://127.0.0.1:3101` | 客户控制台入口包装 |
| Admin Console | `http://127.0.0.1:3102` | 管理后台入口包装 |
| New API | `http://127.0.0.1:3005` | new-api 管理与兼容 API |
| MySQL | `127.0.0.1:3307` | 平台和 new-api 数据库 |
| Redis | `127.0.0.1:6380` | 缓存/队列 |
| NATS | `127.0.0.1:4223` | 消息总线 |
| Prometheus | `http://127.0.0.1:9091` | 指标 |
| Grafana | `http://127.0.0.1:3006` | 观测面板 |

## 一键启动平台后端、原前端和 Digital_life 融合首页

首次启动：

```bash
cd /home/sgj/projects/NewAPI/platform
cp .env.example .env
```

按需编辑 `platform/.env`，至少关注这些字段：

```bash
NEW_API_ADMIN_USERNAME=devadmin
NEW_API_ADMIN_PASSWORD=DevAdmin123!
NEW_API_INTERNAL_TOKEN=dev_new_api_internal_access_token
DEV_DEMO_API_KEY=demo_live_sk_platform_dev

UPSTREAM_OPENAI_API_KEY=<YOUR_PROVIDER_KEY>
UPSTREAM_OPENAI_BASE_URL=https://api.groq.com/openai
UPSTREAM_OPENAI_PUBLIC_MODELS=chat-pro,reasoning-pro,vision-pro
UPSTREAM_OPENAI_MODEL_MAPPING_JSON={"chat-pro":"openai/gpt-oss-120b","reasoning-pro":"openai/gpt-oss-120b","vision-pro":"meta-llama/llama-4-scout-17b-16e-instruct"}
```

启动全部服务：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-up.sh
```

该脚本会：

1. 如不存在 `platform/.env`，从 `.env.example` 复制。
2. 执行 `docker compose up -d --build`。
3. 调用 `scripts/init-new-api-dev.sh` 初始化 `new-api` 管理员。
4. 创建 relay 调用 `new-api` 所需的内部 token。
5. 同时拉起 Digital_life 融合首页容器 `digital-life-dev`。

查看状态：

```bash
cd /home/sgj/projects/NewAPI/platform
docker compose --env-file .env -f infra/dev/docker-compose.yml ps
```

一键启动后直接访问：

```text
Digital_life 融合首页: http://127.0.0.1:8008/
平台控制台:          http://127.0.0.1:3200/
New API:             http://127.0.0.1:3005/
Gateway API:         http://127.0.0.1:8088/
```

查看日志：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-logs.sh
```

停止：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-down.sh
```

## 单独启动 Digital_life 融合首页

正常开发推荐用上面的 `platform/scripts/dev-up.sh` 一键启动。只有在需要单独调试 Digital_life 时，才使用本节命令。

安装依赖：

```bash
cd /home/sgj/projects/NewAPI/Digital_life
/home/sgj/miniconda3/envs/py311/bin/python -m pip install -r backend/requirements.txt
```

启动：

```bash
cd /home/sgj/projects/NewAPI/Digital_life
/home/sgj/miniconda3/envs/py311/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8008
```

访问：

```text
http://127.0.0.1:8008/
```

Digital_life 可选环境变量：

```bash
export OPENCLAW_BASE_URL=http://127.0.0.1:11434/v1
export OPENCLAW_API_KEY=openclaw-local
export OPENCLAW_MODEL=openclaw

export FREETTS_BASE_URL=https://freetts.org/api
export TTS_BASE_URL=http://ttsapi.site
export TTS_DEFAULT_VOICE=zh-CN-XiaoxiaoNeural

export PLATFORM_GATEWAY_URL=http://127.0.0.1:8088
export PLATFORM_OPS_URL=http://127.0.0.1:8086
export PLATFORM_CONSOLE_URL=http://127.0.0.1:3200
export NEW_API_URL=http://127.0.0.1:3005
```

Digital_life 主要 API：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/health` | Digital_life 健康和 LLM/TTS 配置 |
| `GET` | `/api/state` | 情绪、记忆、环境状态 |
| `POST` | `/api/chat` | 星语对话 |
| `POST` | `/api/tts` | 语音合成 |
| `POST` | `/api/memory` | 写入长期记忆 |
| `POST` | `/api/memory/search` | 检索记忆 |
| `GET` | `/api/platform/home` | 融合首页的平台聚合数据 |

## 使用下游 API

下游应用只需要对接 `platform-gateway`，接口风格兼容 OpenAI Chat Completions。

开发环境 demo key：

```text
demo_live_sk_platform_dev
```

普通非流式调用：

```bash
curl -sS http://127.0.0.1:8088/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer demo_live_sk_platform_dev' \
  -H 'X-Request-Id: req-demo-001' \
  -H 'X-Trace-Id: trace-demo-001' \
  -H 'Idempotency-Key: idem-demo-001' \
  -d '{
    "model": "chat-pro",
    "messages": [
      {"role": "user", "content": "你好，请用一句话介绍这个平台"}
    ],
    "max_tokens": 128,
    "stream": false
  }'
```

流式调用：

```bash
curl -N http://127.0.0.1:8088/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer demo_live_sk_platform_dev' \
  -d '{
    "model": "chat-pro",
    "messages": [
      {"role": "user", "content": "请流式输出三条平台能力"}
    ],
    "max_tokens": 128,
    "stream": true
  }'
```

可用模型来自 `platform.provider_routes` 与 `platform.model_entitlements` 的交集。开发种子默认包含：

1. `chat-basic`
2. `chat-pro`
3. `reasoning-pro`
4. `vision-pro`
5. `embedding-large`

注意：当前 Gateway 主要实现 Chat Completions。`embedding-large` 已在数据模型中预留，但完整 embedding API 入口需要继续补实现。

## 添加上游模型

平台把“对外模型名”和“真实上游模型名”分开：

| 层级 | 示例 | 说明 |
| --- | --- | --- |
| 对外模型名 | `chat-pro` | 下游 API 调用时使用，稳定不变 |
| 平台路由 | `provider_routes` | 决定 `chat-pro` 走哪个 provider/channel/model |
| new-api channel | `groq-primary-dev` | 保存上游 key、base URL、model mapping |
| 真实上游模型 | `openai/gpt-oss-120b` | provider 实际模型名 |

### 方式一：用脚本导入 OpenAI-compatible 上游

编辑 `platform/.env`：

```bash
UPSTREAM_OPENAI_API_KEY=<真实上游 API Key>
UPSTREAM_OPENAI_BASE_URL=https://api.groq.com/openai
UPSTREAM_OPENAI_CHANNEL_NAME=groq-primary-dev
UPSTREAM_OPENAI_PUBLIC_MODELS=chat-pro,reasoning-pro,vision-pro
UPSTREAM_OPENAI_MODEL_MAPPING_JSON={"chat-pro":"openai/gpt-oss-120b","reasoning-pro":"openai/gpt-oss-120b","vision-pro":"meta-llama/llama-4-scout-17b-16e-instruct"}
UPSTREAM_OPENAI_TEST_MODEL=chat-pro
```

执行：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/configure-new-api-openai-channel-dev.sh
```

脚本会登录 `new-api` 管理 API，创建或更新 OpenAI-compatible channel，并写入模型映射。

### 方式二：从 OpenClaw 导入 Nvidia 上游

脚本会读取 `/home/sgj/.openclaw/openclaw.json` 中的 `nvidia*` provider，筛选支持 `z-ai/glm5` 或 `z-ai/glm5.1` 的 provider，然后：

1. 在 `new_api.channels` 中创建/更新 nvidia 渠道。
2. 在 `platform.provider_routes` 中写入对应备用路由。
3. 默认放入 `nvidia-canary` 组。
4. 默认 `NVIDIA_CHANNEL_STATUS=0`，不立即参与调度。

执行：

```bash
cd /home/sgj/projects/NewAPI/platform
NVIDIA_CHANNEL_STATUS=1 ./scripts/configure-new-api-nvidia-channels-from-openclaw.sh
```

常用参数：

```bash
OPENCLAW_CONFIG=/home/sgj/.openclaw/openclaw.json
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=dev_root_password
NVIDIA_CHANNEL_GROUP=nvidia-canary
NVIDIA_CHANNEL_STATUS=1
NVIDIA_CHANNEL_PRIORITY=50
NVIDIA_CHANNEL_WEIGHT=10
```

### 方式三：手动在 New API 后台添加

访问：

```text
http://127.0.0.1:3005
```

默认管理员：

```text
用户名: devadmin
密码: DevAdmin123!
```

进入 New API 后台后添加渠道，配置：

1. 上游类型，例如 OpenAI-compatible。
2. 上游 `base_url`。
3. 上游 API Key。
4. 可用模型列表。
5. 模型映射，例如把平台的 `chat-pro` 映射到真实上游模型。
6. 渠道分组、优先级、权重和状态。

手动添加完 New API channel 后，还要在平台侧写入或更新 `provider_routes`，否则 Gateway 的 policy 不会选中该上游。

示例 SQL：

```sql
INSERT INTO platform.provider_routes
  (external_model_name, internal_model_profile, provider_code, channel_code, provider_model,
   priority, weight, region, cost_per_input_1k, cost_per_output_1k, latency_slo_ms,
   is_active, tenant_scope, rules_json)
VALUES
  ('chat-pro', 'chat_pro_v1', 'my-provider', 'my-channel', 'real-upstream-model',
   20, 100, 'global', 0.002000, 0.008000, 3000,
   1, 'default', JSON_OBJECT('fallback', true));
```

## 调整速率、额度和路由

### 模型权益和限速配置

表：`platform.model_entitlements`

关键字段：

| 字段 | 说明 |
| --- | --- |
| `external_model_name` | 对外模型名，如 `chat-pro` |
| `rpm_limit` | 每分钟请求数上限配置 |
| `tpm_limit` | 每分钟 Token 上限配置 |
| `concurrency_limit` | 并发上限配置 |
| `daily_cost_cap` | 单日成本上限配置 |
| `is_enabled` | 是否允许该项目调用该模型 |
| `expires_at` | 权益过期时间 |

示例：提高 `chat-pro` 的速率和并发：

```sql
UPDATE platform.model_entitlements
SET rpm_limit = 120,
    tpm_limit = 160000,
    concurrency_limit = 10,
    daily_cost_cap = 50.000000,
    is_enabled = 1
WHERE organization_id = 1001
  AND project_id = 2001
  AND external_model_name = 'chat-pro';
```

当前 FastAPI 版 `policy` 会读取并返回这些 limit，供控制台与策略层使用；完整的 token-bucket / concurrency 强制拦截还属于后续可扩展点。当前已经强制生效的是 key 状态、模型权益是否启用、路由是否存在、余额预授权。

### 项目成本封顶

表：`platform.projects`

```sql
UPDATE platform.projects
SET daily_cost_cap = 100.000000,
    monthly_cost_cap = 2000.000000
WHERE id = 2001;
```

控制台路径：

```text
http://127.0.0.1:3200/console/project-settings
```

### 余额和预授权

表：`platform.balance_ledger`

开发环境初始余额由 seed 写入：

```text
organization_id = 1001
project_id = 2001
api_key_id = 3001
初始 cash credit = 100 USD
```

充值示例：

```sql
INSERT INTO platform.balance_ledger
  (organization_id, project_id, api_key_id, account_type, direction, amount,
   currency, reference_type, reference_id, request_id, idempotency_key, remark)
VALUES
  (1001, 2001, 3001, 'cash', 'credit', 500.000000,
   'USD', 'manual_topup', 'topup-001', 'manual-topup-001', 'manual-topup-001', 'Manual dev top-up');
```

调用时 `billing/preauthorize` 会估算本次调用金额，检查可用余额并写入 hold；完成后 `billing/finalize` 会写入用量和结算流水。

### 路由优先级和权重

表：`platform.provider_routes`

| 字段 | 说明 |
| --- | --- |
| `priority` | 越小越优先 |
| `weight` | 同优先级时的权重，当前 FastAPI 版本主要按 `priority ASC, weight DESC` 选择 |
| `is_active` | 是否启用 |
| `cost_per_input_1k` | 输入成本价 |
| `cost_per_output_1k` | 输出成本价 |
| `latency_slo_ms` | 延迟 SLO |
| `rules_json` | 扩展策略，如 fallback、supports_image |

禁用某个 provider：

```sql
UPDATE platform.provider_routes
SET is_active = 0
WHERE provider_code = 'my-provider';
```

把某个 provider 调成优先：

```sql
UPDATE platform.provider_routes
SET priority = 5, weight = 100
WHERE external_model_name = 'chat-pro'
  AND provider_code = 'my-provider';
```

### API Key 管理

表：`platform.api_keys`

开发环境 demo key 明文：

```text
demo_live_sk_platform_dev
```

数据库中保存的是 SHA-256：

```text
1d990962d51571a40f431c3715715846db4543c04aa5a0f32d347092ff8b7d6c
```

禁用 key：

```sql
UPDATE platform.api_keys
SET status = 'disabled'
WHERE id = 3001;
```

恢复 key：

```sql
UPDATE platform.api_keys
SET status = 'active'
WHERE id = 3001;
```

控制台路径：

```text
http://127.0.0.1:3200/console/api-keys
```

## 管理入口

### 平台控制台

```text
http://127.0.0.1:3200
```

常用页面：

| 页面 | 地址 | 用途 |
| --- | --- | --- |
| 首页 | `/console` | KPI、趋势、账务、渠道健康 |
| API Keys | `/console/api-keys` | 创建和管理密钥 |
| Playground | `/console/playground` | 通过 Gateway 测试下游调用 |
| Models | `/console/models` | 查看模型目录和路由概览 |
| Usage | `/console/usage` | 用量趋势 |
| Request Logs | `/console/request-logs` | trace、成本、延迟、重试详情 |
| Billing | `/console/billing` | 账务总览 |
| Bills | `/console/bills` | 账单 |
| Invoices | `/console/invoices` | 发票 |
| Webhooks | `/console/webhooks` | Webhook 配置和投递 |
| Team | `/console/team` | 团队成员 |
| Project Settings | `/console/project-settings` | 项目配置 |
| Security | `/console/security` | 安全设置 |
| Support | `/console/support` | 工单 |

管理后台：

| 页面 | 地址 | 用途 |
| --- | --- | --- |
| 管理首页 | `/admin` | 管理概览 |
| Routing | `/admin/routing` | 供应商路由管理 |
| Organizations | `/admin/organizations` | 组织管理 |
| Users | `/admin/users` | 用户管理 |
| Pricing | `/admin/pricing` | 价格策略 |
| Risk | `/admin/risk` | 风控事件 |
| Audit | `/admin/audit` | 审计日志 |

### New API 后台

```text
http://127.0.0.1:3005
```

用途：

1. 管理上游 channel/provider。
2. 配置模型映射。
3. 查看 New API 自身 token、分组、渠道状态。
4. 手动测试上游可用性。

### 观测

```text
Prometheus: http://127.0.0.1:9091
Grafana:    http://127.0.0.1:3006
```

默认 Grafana：

```text
用户名: admin
密码: admin
```

服务指标端点：

```text
GET /healthz
GET /readyz
GET /metrics
```

## Platform FastAPI 服务说明

`platform/services/platform-fastapi/app/main.py` 使用同一份代码，通过 `SERVICE_ROLE` 选择角色：

| SERVICE_ROLE | 容器 | 职责 |
| --- | --- | --- |
| `gateway` | `platform-gateway-dev` | 下游 OpenAI-compatible API 入口 |
| `identity` | `platform-auth-dev` | API Key 校验 |
| `policy` | `platform-policy-dev` | 模型权益和路由决策 |
| `billing` | `platform-billing-dev` | 预授权、结算、账本 |
| `relay` | `platform-relay-dev` | 代理到 new-api |
| `risk` | `platform-risk-dev` | 风控骨架 |
| `operations` | `platform-ops-dev` | 控制台 BFF 后端 |

平台内部接口：

| 方法 | 路径 | 服务角色 |
| --- | --- | --- |
| `POST` | `/internal/auth/validate-key` | identity |
| `POST` | `/internal/policy/check` | policy |
| `POST` | `/internal/billing/preauthorize` | billing |
| `POST` | `/internal/billing/finalize` | billing |
| `POST` | `/internal/relay/chat-completions` | relay |
| `POST` | `/internal/relay/chat-completions/stream` | relay |

平台外部和控制台接口：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `POST` | `/v1/chat/completions` | 下游聊天 API |
| `GET` | `/v1/models` | 模型目录 |
| `GET` | `/v1/request-logs` | 请求日志 |
| `GET/PUT` | `/v1/projects/current/settings` | 项目设置 |
| `GET/PUT` | `/v1/security/settings` | 安全设置 |
| `GET` | `/v1/team/members` | 团队成员 |
| `GET/POST/PUT` | `/v1/webhooks` | Webhook 管理 |
| `GET/POST/PUT` | `/v1/billing/invoices` | 发票 |
| `GET/PUT` | `/v1/billing/bills` | 账单 |
| `GET/POST/PUT/DELETE` | `/v1/filter-presets` | 筛选 Preset |
| `GET/POST` | `/v1/support/tickets` | 工单 |

## 本地开发前端

平台控制台也可以脱离 Docker 直接本地运行。

```bash
cd /home/sgj/projects/NewAPI/platform/apps/platform-console
npm install
npm run dev
```

默认地址：

```text
http://127.0.0.1:3200
```

常用环境变量：

```bash
NEXT_PUBLIC_APP_ENV=mock
NEXT_PUBLIC_ENABLE_MOCK=true
NEXT_PUBLIC_ENABLE_PLATFORM_BFF=true
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8088
NEXT_PUBLIC_DOCS_URL=http://127.0.0.1:3005
NEXT_PUBLIC_STATUS_URL=http://127.0.0.1:9091
NEXT_PUBLIC_PLAYGROUND_MODE=real
PLAYGROUND_GATEWAY_BASE_URL=http://127.0.0.1:8088
PLAYGROUND_DEV_API_KEY=demo_live_sk_platform_dev
PLATFORM_OPS_BASE_URL=http://127.0.0.1:8086
```

构建检查：

```bash
cd /home/sgj/projects/NewAPI/platform/apps/platform-console
npm run typecheck
npm run build
```

## 验证脚本

验证 Gateway 完整链路：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/verify-gateway-chain.sh
```

验证 Platform Console BFF 到 Ops 的链路：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/verify-platform-bff-ops.sh
```

只验证服务健康：

```bash
curl -sS http://127.0.0.1:8088/readyz
curl -sS http://127.0.0.1:8086/readyz
curl -sS http://127.0.0.1:3200/api/healthz
curl -sS http://127.0.0.1:3005/api/status
```

## 数据库维护和修复

平台开发库由 `platform/infra/dev/mysql/init/` 里的 SQL 初始化：

1. `010-platform-core.sql`：组织、用户、项目、API Key、模型权益、路由、账本、用量和 trace 核心表。
2. `020-platform-seed.sql`：开发组织、项目、demo key、默认模型权益、默认路由和初始余额。
3. `030-platform-db-hardening.sql`：控制台运行表、头像表、缺失列、查询索引和基础金额约束。

如果已经启动过 MySQL，Docker 的初始化 SQL 不会自动重跑。现在可以直接执行修复脚本，不需要删除数据卷：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/repair-platform-db.sh
```

该脚本会重新套用核心表、种子数据和数据库加固 SQL，并输出数据库健康检查。重点检查项包括：缺失控制台表、缺失索引、重复 request_id、重复路由、重复组织级模型授权、用量/账本负金额、已结算用量缺少完成时间、用量记录孤儿外键。

## 常见排障

### 1. Gateway 返回 `invalid_api_key`

检查请求头：

```text
Authorization: Bearer demo_live_sk_platform_dev
```

检查数据库：

```sql
SELECT id, name, status, key_prefix, expires_at
FROM platform.api_keys
WHERE id = 3001;
```

### 2. Gateway 返回 `model_not_entitled`

检查 `model_entitlements`：

```sql
SELECT external_model_name, rpm_limit, tpm_limit, concurrency_limit, daily_cost_cap, is_enabled
FROM platform.model_entitlements
WHERE organization_id = 1001 AND project_id = 2001;
```

### 3. Gateway 返回 `route_not_found`

检查 `provider_routes`：

```sql
SELECT external_model_name, provider_code, provider_model, priority, weight, is_active
FROM platform.provider_routes
WHERE external_model_name = 'chat-pro'
ORDER BY priority ASC, weight DESC;
```

### 4. Gateway 返回 `insufficient_balance`

检查余额和 hold：

```sql
SELECT account_type, direction, SUM(amount) AS amount
FROM platform.balance_ledger
WHERE organization_id = 1001
GROUP BY account_type, direction;
```

需要充值时插入一条 `cash/credit` 流水。

### 5. Relay 或 New API 上游错误

先检查 New API：

```bash
curl -sS http://127.0.0.1:3005/api/status
```

然后进入：

```text
http://127.0.0.1:3005
```

检查 channel 的：

1. API Key 是否有效。
2. Base URL 是否少/多了 `/v1`。
3. Model mapping 是否把 `chat-pro` 映射到真实上游模型。
4. Channel 是否启用。
5. Channel group 是否和 token/group 匹配。

### 6. Digital_life 首页平台状态显示离线

确认平台服务端口可访问：

```bash
curl -sS http://127.0.0.1:8088/readyz
curl -sS http://127.0.0.1:8086/readyz
curl -sS http://127.0.0.1:3200/api/healthz
curl -sS http://127.0.0.1:3005/api/status
```

如果 Digital_life 在容器或 WSL 不同网络命名空间中运行，需要把下面环境变量改成它能访问到的地址：

```bash
PLATFORM_GATEWAY_URL=
PLATFORM_OPS_URL=
PLATFORM_CONSOLE_URL=
NEW_API_URL=
```

### 7. 端口被占用

平台端口在 `platform/.env` 中调整，例如：

```bash
GATEWAY_HOST_PORT=8088
PLATFORM_CONSOLE_HOST_PORT=3200
NEW_API_HOST_PORT=3005
MYSQL_HOST_PORT=3307
```

改完后重启：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-down.sh
./scripts/dev-up.sh
```

Digital_life 端口直接改 uvicorn 参数：

```bash
/home/sgj/miniconda3/envs/py311/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8010
```

## 开发约定

1. 不要提交真实 API Key、数据库密码或生产 token。
2. `platform/.env` 是本地文件，按需从 `.env.example` 复制。
3. `runtime/` 和数据库 volume 是本地运行态数据，通常不进入版本管理。
4. 平台逻辑模型名应保持稳定，下游只依赖 `chat-pro` 这类外部模型名。
5. 上游 provider、真实模型、成本、权重、启停应通过 `new-api.channels` 和 `platform.provider_routes` 管理。
6. 速率、额度、权益应通过 `model_entitlements`、`projects`、`api_keys`、`balance_ledger` 管理。
7. Digital_life 的记忆文件在 `Digital_life/backend/data/agent_workspace/`，调试时可以备份后再修改。

## 快速命令速查

```bash
# 一键启动平台后端、原前端、New API 和 Digital_life 首页
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-up.sh

# 停止平台
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-down.sh

# 验证 Gateway 链路
cd /home/sgj/projects/NewAPI/platform
./scripts/verify-gateway-chain.sh

# 验证 Console BFF
cd /home/sgj/projects/NewAPI/platform
./scripts/verify-platform-bff-ops.sh

# 导入 OpenAI-compatible 上游
cd /home/sgj/projects/NewAPI/platform
./scripts/configure-new-api-openai-channel-dev.sh

# 启动 Digital_life 融合首页
cd /home/sgj/projects/NewAPI/Digital_life
/home/sgj/miniconda3/envs/py311/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8008

# 下游 API 调用
curl -sS http://127.0.0.1:8088/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer demo_live_sk_platform_dev' \
  -d '{"model":"chat-pro","messages":[{"role":"user","content":"你好"}],"max_tokens":64,"stream":false}'
```
