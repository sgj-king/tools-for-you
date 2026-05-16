# platform-fastapi

`platform-fastapi` 是当前开发环境中替代 Go 微服务的一套 FastAPI 实现。它使用同一份代码，通过 `SERVICE_ROLE` 区分运行职责：

- `gateway`：对外 OpenAI 风格入口，执行 auth -> policy -> billing -> relay 调用链。
- `identity`：API Key 校验，读取 MySQL 中的 `api_keys / organizations / projects`。
- `policy`：模型权益与 provider route 决策。
- `billing`：预授权、最终结算、usage_records、balance_ledger、request_traces 写入。
- `relay`：代理到内部 `new-api`，支持普通响应和 SSE 流式透传。
- `risk`：当前为健康检查与扩展骨架。
- `operations`：控制台 BFF 后端，提供模型目录、请求日志、团队、Webhook、账单、发票、工单、Preset 等接口。

## 为什么可以替换 Go

现有 Go 后端主要是薄 HTTP 服务：

- 使用 `net/http` 暴露 JSON API。
- 通过 MySQL 做状态读写。
- 通过 HTTP 调用其他内部服务。
- relay/gateway 的流式能力是 SSE 字节流透传与结束后结算。

这些能力 FastAPI + httpx + PyMySQL 可以完整承载。当前实现保持原服务名、端口、URL 路由和 JSON 字段，前端 SDK 不需要改。

## Docker 开发环境

`platform/infra/dev/docker-compose.yml` 中以下服务已切换到本目录构建：

- `gateway`
- `auth`
- `billing`
- `policy`
- `risk`
- `relay`
- `ops`

启动：

```bash
docker compose --env-file /home/sgj/projects/NewAPI/platform/.env \
  -f /home/sgj/projects/NewAPI/platform/infra/dev/docker-compose.yml \
  up -d --build auth policy billing risk relay gateway ops
```

验证：

```bash
curl -sS http://127.0.0.1:8088/readyz
curl -sS http://127.0.0.1:8086/v1/models
curl -sS http://127.0.0.1:8088/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer demo_live_sk_platform_dev' \
  -d '{"model":"chat-pro","messages":[{"role":"user","content":"你好"}],"max_tokens":64,"stream":false}'
```

## 可选 conda 运行

如果宿主机可用 `conda`，可以用 `py311` 环境直接运行：

```bash
cd /home/sgj/projects/NewAPI/platform/services/platform-fastapi
conda run -n py311 pip install -r requirements.txt
SERVICE_NAME=platform-gateway SERVICE_ROLE=gateway SERVICE_PORT=8080 \
  ./scripts/run-conda-py311.sh
```

当前 Codex shell 中未找到 `conda` 命令，所以本次验证使用 Docker Python 3.11 镜像完成。

