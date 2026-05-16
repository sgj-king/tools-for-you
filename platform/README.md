# Commercial AI Platform Monorepo Skeleton

这是按“闭源商业平台 + 内部 open-source `new-api` 适配层”思路生成的第一版可启动开发骨架。

## 目录

```text
platform/
├── apps/
│   ├── admin-console/
│   └── customer-console/
├── contracts/
├── docs/
├── infra/
│   └── dev/
├── open-source/
│   └── new-api-fork/
├── scripts/
└── services/
    ├── platform-auth/
    ├── platform-billing/
    ├── platform-gateway/
    ├── platform-policy/
    ├── platform-relay/
    └── platform-risk/
```

## 当前可启动内容

1. `platform-gateway`
2. `platform-auth`
3. `platform-billing`
4. `platform-policy`
5. `platform-risk`
6. `platform-relay`
7. `customer-console`
8. `admin-console`
9. `mysql`
10. `redis`
11. `nats`
12. `new-api`
13. `prometheus`
14. `grafana`

## 前端控制台骨架

当前已经新增一套正式的 Next.js 前端骨架，保存于：

1. [platform-console](/home/sgj/projects/NewAPI/platform/apps/platform-console)
2. [前端规格文档](/home/sgj/projects/NewAPI/platform/docs/AI_PLATFORM_FRONTEND_SPEC.zh-CN.md)

这套前端采用：

1. `Next.js App Router`
2. `TypeScript`
3. `Tailwind CSS`
4. `TanStack Query`
5. `Zustand`
6. `Zod`
7. `Recharts`
8. `Framer Motion`
9. `双主题设计 token`

## 快速开始

1. 复制环境变量文件：

```bash
cd /home/sgj/projects/NewAPI/platform
cp .env.example .env
```

2. 启动开发环境：

```bash
./scripts/dev-up.sh
```

3. 查看服务：

```bash
docker compose --env-file .env -f infra/dev/docker-compose.yml ps
```

## 入口地址

默认端口都选在一组尽量不与当前工作区冲突的值上：

1. Gateway: `http://127.0.0.1:8088`
2. Auth: `http://127.0.0.1:8081`
3. Billing: `http://127.0.0.1:8082`
4. Policy: `http://127.0.0.1:8083`
5. Risk: `http://127.0.0.1:8084`
6. Relay: `http://127.0.0.1:8085`
7. Customer Console: `http://127.0.0.1:3101`
8. Admin Console: `http://127.0.0.1:3102`
9. Platform Console: `http://127.0.0.1:3200`
10. New API: `http://127.0.0.1:3005`
11. Digital Life 融合首页: `http://127.0.0.1:8008`
12. Prometheus: `http://127.0.0.1:9091`
13. Grafana: `http://127.0.0.1:3006`

## 当前阶段说明

这是一版“能启动、可扩展、边界清晰”的骨架，不是完整业务实现。

当前每个后端服务先提供：

1. `/healthz`
2. `/readyz`
3. `/metrics`
4. `/v1/info`
5. `/v1/echo`

下一步建议优先把以下内容替换成正式实现：

1. `platform-auth` 的 API key 校验
2. `platform-policy` 的 entitlement 判定
3. `platform-billing` 的预授权与结算
4. `platform-gateway` 的流式代理链路

## 本次新增内容

1. 前 10 张核心表 DDL：
   [010-platform-core.sql](/home/sgj/projects/NewAPI/platform/infra/dev/mysql/init/010-platform-core.sql)
2. 开发种子数据：
   [020-platform-seed.sql](/home/sgj/projects/NewAPI/platform/infra/dev/mysql/init/020-platform-seed.sql)
3. 数据库加固与控制台运行表：
   [030-platform-db-hardening.sql](/home/sgj/projects/NewAPI/platform/infra/dev/mysql/init/030-platform-db-hardening.sql)
4. 4 个内部接口骨架：
   - `POST /internal/auth/validate-key`
   - `POST /internal/policy/check`
   - `POST /internal/billing/preauthorize`
   - `POST /internal/billing/finalize`

## Demo 调用参数

开发环境内置了一组 demo 数据：

1. `organization_id = 1001`
2. `project_id = 2001`
3. `api_key_id = 3001`
4. `price_plan_code = dev-free`
5. `api_key = demo_live_sk_platform_dev`

## 联调示例

先启动：

```bash
cd /home/sgj/projects/NewAPI/platform
cp .env.example .env
./scripts/dev-up.sh
```

### 1. validate-key

```bash
curl -sS http://127.0.0.1:8081/internal/auth/validate-key \
  -H 'Content-Type: application/json' \
  -d '{
    "api_key": "demo_live_sk_platform_dev",
    "request_id": "req-demo-001",
    "trace_id": "trace-demo-001"
  }'
```

### 2. policy/check

```bash
curl -sS http://127.0.0.1:8083/internal/policy/check \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "req-demo-001",
    "trace_id": "trace-demo-001",
    "organization_id": 1001,
    "project_id": 2001,
    "api_key_id": 3001,
    "model": "chat-pro",
    "region": "global"
  }'
```

### 3. billing/preauthorize

```bash
curl -sS http://127.0.0.1:8082/internal/billing/preauthorize \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "req-demo-001",
    "trace_id": "trace-demo-001",
    "organization_id": 1001,
    "project_id": 2001,
    "api_key_id": 3001,
    "model": "chat-pro",
    "max_tokens": 512,
    "input_tokens_estimate": 300,
    "idempotency_key": "idem-demo-001"
  }'
```

### 4. billing/finalize

```bash
curl -sS http://127.0.0.1:8082/internal/billing/finalize \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "req-demo-001",
    "trace_id": "trace-demo-001",
    "hold_id": "hold-demo-001",
    "organization_id": 1001,
    "project_id": 2001,
    "api_key_id": 3001,
    "model": "chat-pro",
    "input_tokens": 320,
    "output_tokens": 210,
    "provider_cost": "0.002100",
    "authorized_amount": "0.012000",
    "stream_status": "completed",
    "idempotency_key": "idem-demo-001"
  }'
```

说明：

1. 当前 4 个接口已经接到 MySQL 第一版实现，会真实读取或写入开发数据库。
2. 如果你在新增 DDL 之前已经启动过开发环境，直接执行 `./scripts/repair-platform-db.sh` 即可补齐表、列、索引和开发种子数据，无需删除 MySQL 数据卷。

## Gateway 到 Relay/New API 第一版链路

目前已经补上第一版客户入口真实转发链路：

1. `POST /v1/chat/completions`
2. `gateway -> auth -> policy -> billing(preauthorize/finalize) -> relay -> new-api`
3. `gateway` 不再返回 mock completion，而是直接返回 `new-api` 的真实响应体
4. 若 `new-api` 尚未配置可用上游渠道，`gateway` 会把真实 upstream 错误原样透传回来
5. 当前已经补齐 `stream=true` 的第一版真实流式链路：`platform-console -> gateway -> relay -> new-api`
6. 如果 `new-api` 没有可用渠道，Playground 会返回真实 upstream 错误，不再回退 mock

### 初始化 new-api

开发环境启动后会自动执行初始化脚本；你也可以手动执行：

```bash
cd /home/sgj/projects/NewAPI/platform
bash ./scripts/init-new-api-dev.sh
```

说明：

1. 这个脚本会完成 `new-api` 的 `/api/setup`
2. 它还会补一条开发环境专用的 `relay -> new-api` 内部 token，避免 `Invalid token`
3. 它不会自动创建上游渠道、模型映射或供应商密钥
4. 现在也可以用脚本自动导入 OpenAI-compatible 渠道：

```bash
cd /home/sgj/projects/NewAPI/platform
bash ./scripts/configure-new-api-openai-channel-dev.sh
```

5. 该脚本依赖 `.env` 中的 `UPSTREAM_OPENAI_*` 变量；若未填真实上游 key，会安全跳过

6. 如果你要按 `openclaw.json` 批量导入 Nvidia 上游，并统一把逻辑模型映射到 glm5 系列（优先 `z-ai/glm5`，次选 `z-ai/glm5.1`），可执行：

```bash
cd /home/sgj/projects/NewAPI/platform
bash ./scripts/configure-new-api-nvidia-channels-from-openclaw.sh
```

说明：

1. 默认读取 `/home/sgj/.openclaw/openclaw.json`
2. 仅导入 `nvidia*` 且模型列表中明确包含 `z-ai/glm5` 或 `z-ai/glm5.1` 的 provider
3. 会创建/更新 `new_api.channels`，并写入 `platform.provider_routes` 作为备路由（不覆盖 Groq 主路由）
4. 为避免影响默认会话稳定性，脚本默认把 Nvidia 渠道设为 `status=0`（已配置但默认不启用）
5. 如需启用 Nvidia 渠道，可显式传入：

```bash
NVIDIA_CHANNEL_STATUS=1 bash ./scripts/configure-new-api-nvidia-channels-from-openclaw.sh
```
6. 如需自定义配置路径，可用：

```bash
OPENCLAW_CONFIG=/your/path/openclaw.json bash ./scripts/configure-new-api-nvidia-channels-from-openclaw.sh
```

### Relay 直连联调

```bash
cd /home/sgj/projects/NewAPI/platform
bash ./scripts/curl/relay-chat.sh
```

如果当前还没配置上游渠道，也可以用允许真实错误返回的模式：

```bash
cd /home/sgj/projects/NewAPI/platform
ALLOW_UPSTREAM_ERROR=true bash ./scripts/curl/relay-chat.sh
```

示例：

```bash
curl -sS http://127.0.0.1:8088/v1/chat/completions \
  -H 'Authorization: Bearer demo_live_sk_platform_dev' \
  -H 'Content-Type: application/json' \
  -H 'X-Request-Id: req-gateway-demo-001' \
  -H 'X-Trace-Id: trace-gateway-demo-001' \
  -H 'Idempotency-Key: idem-gateway-demo-001' \
  -d '{
    "model": "chat-pro",
    "stream": false,
    "max_tokens": 256,
    "messages": [
      {
        "role": "system",
        "content": "你是联调助手。"
      },
      {
        "role": "user",
        "content": "请确认网关第一版链路已打通。"
      }
    ]
  }'
```

如果当前还未在 `new-api` 后台配置真实上游渠道，可以先用下面这个命令确认链路已经真实触达 `new-api`：

```bash
cd /home/sgj/projects/NewAPI/platform
ALLOW_UPSTREAM_ERROR=true bash ./scripts/curl/gateway-chat.sh
```

### 一键验证

```bash
cd /home/sgj/projects/NewAPI/platform
bash ./scripts/verify-gateway-chain.sh
```

这份脚本会依次：

1. 初始化 `new-api`
2. 检查 `gateway/auth/policy/billing/relay/new-api` 健康状态
3. 执行内部链路 smoke test
4. 执行 `relay -> new-api` 调试请求
5. 执行客户入口 `gateway -> relay -> new-api` 调试请求

如果脚本返回的是上游错误而不是 `chat.completion`，通常表示：

1. `new-api` 还没配置 provider/channel
2. 对外模型名和 `new-api` 内部可用模型名还没映射一致
3. 上游供应商密钥不可用或额度不足

## 前端控制台第二版

现在已经补上一套正式的前端控制台骨架：

1. [platform-console](/home/sgj/projects/NewAPI/platform/apps/platform-console)
2. [前端规格文档](/home/sgj/projects/NewAPI/platform/docs/AI_PLATFORM_FRONTEND_SPEC.zh-CN.md)

这版已经包含：

1. `docker-compose` 接入
2. `Dashboard / API Keys / Billing / Usage / Playground / Team / Webhook / Admin`
3. `创建 API Key 弹窗`
4. `请求详情抽屉`
5. `mock SSE Playground`

当前这套开发环境在未配置上游前，预期最常见的真实错误是：

1. `model_not_found`
2. `No available channel for model ...`

## 联调脚本

已经新增三份脚本：

1. Gateway 聊天脚本：
   [gateway-chat.sh](/home/sgj/projects/NewAPI/platform/scripts/curl/gateway-chat.sh)
2. 内部链路 smoke test：
   [internal-chain-smoke.sh](/home/sgj/projects/NewAPI/platform/scripts/curl/internal-chain-smoke.sh)
3. 一键验证脚本：
   [verify-gateway-chain.sh](/home/sgj/projects/NewAPI/platform/scripts/verify-gateway-chain.sh)

执行方式：

```bash
cd /home/sgj/projects/NewAPI/platform
bash ./scripts/verify-gateway-chain.sh
```

建议重建命令：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-down.sh
docker volume rm platform-dev_mysql_data
./scripts/dev-up.sh
```
