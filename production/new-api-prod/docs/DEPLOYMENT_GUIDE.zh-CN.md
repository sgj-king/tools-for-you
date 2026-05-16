# New API 高级生产部署手册

适用对象：希望把 `QuantumNous/new-api` 部署成长期稳定运行的个人或小团队 AI API 网关  
目标环境：Ubuntu 22.04 / 24.04 单机云服务器  
部署形态：Docker Compose + MySQL + Redis + Host Nginx + Certbot  
当前基线时间：2026-04-21  
当前参考上游版本：`calciumion/new-api:v0.12.14`

---

## 最终推荐架构

```mermaid
flowchart LR
    A["客户端 / SDK / curl"] --> B["Nginx + HTTPS<br/>api.example.com"]
    B --> C["new-api<br/>OpenAI 风格统一入口"]
    C --> D["MySQL 8.4.5<br/>核心持久化数据"]
    C --> E["Redis 7.4.2<br/>缓存 / 会话 / 同步 / 限流辅助"]
    C --> F["上游模型供应商 A"]
    C --> G["上游模型供应商 B"]
    C --> H["上游模型供应商 C"]
    I["备份脚本"] --> D
    I --> J["配置文件备份"]
    K["健康检查 / 巡检脚本"] --> B
    K --> C
    K --> D
    K --> E
```

### 为什么这是推荐版

1. `new-api` 负责统一对外的 OpenAI 风格接口、上游渠道聚合、模型映射、权重和重试，是整个系统的“网关层”。
2. `MySQL` 负责持久化用户、Token、渠道、模型映射、日志等核心状态，不能依赖容器内临时数据。
3. `Redis` 负责缓存、会话、多节点同步与部分限流辅助。单机时它不是唯一真相源，但丢失后会影响登录状态、缓存命中、同步状态与短期限流计数。
4. `Nginx` 负责 HTTPS、边界限流、超时控制、流式代理、Host 与 `X-Forwarded-*` 头转发，以及隐藏后台页面。
5. 备份、升级、回滚、健康检查、巡检脚本是长期稳定运行的关键，不能只靠 `docker compose up -d`。

### 为什么不建议直接裸跑单容器

1. 官方快速启动更偏“跑起来”，不是“长期运维”。
2. 裸跑单容器通常会直接暴露 3000 端口，没有 HTTPS、没有后台隔离、没有统一超时和请求体限制。
3. 默认 SQLite 更适合测试，不适合需要长期保留配置、日志、渠道和 Token 的生产网关。
4. 不接 Redis 时，多节点扩展和缓存能力都受限。
5. 不固定镜像版本时，`latest` 很容易导致不可控升级。

### 为什么建议固定版本、加反向代理、启用 HTTPS、独立 MySQL 和 Redis

1. 固定版本：可复现、可回滚、可审计。
2. 反向代理：统一 TLS、流式代理、请求体限制、访问控制。
3. HTTPS：保护下游 Token、管理 Cookie、上游路由配置等敏感信息。
4. 独立 MySQL：比 SQLite 更适合长期维护、备份、升级和未来多节点扩展。
5. 独立 Redis：为缓存、会话与未来多节点共享状态预留基础。

### 你已经为我生成了哪些文件

1. [docker-compose.yml](/home/sgj/projects/NewAPI/production/new-api-prod/compose/docker-compose.yml)
2. [.env.example](/home/sgj/projects/NewAPI/production/new-api-prod/compose/.env.example)
3. [MySQL 配置 zzz-new-api.cnf](/home/sgj/projects/NewAPI/production/new-api-prod/compose/mysql/conf.d/zzz-new-api.cnf)
4. [Redis 配置 redis.conf](/home/sgj/projects/NewAPI/production/new-api-prod/compose/redis/redis.conf)
5. [Nginx 启动配置 api.example.com.bootstrap.conf](/home/sgj/projects/NewAPI/production/new-api-prod/nginx/api.example.com.bootstrap.conf)
6. [Nginx 正式配置 api.example.com.conf](/home/sgj/projects/NewAPI/production/new-api-prod/nginx/api.example.com.conf)
7. [systemd 单元 new-api-stack.service](/home/sgj/projects/NewAPI/production/new-api-prod/systemd/new-api-stack.service)
8. [首次初始化脚本 init-first-deploy.sh](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/init-first-deploy.sh)
9. [备份脚本 backup.sh](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/backup.sh)
10. [升级脚本 upgrade.sh](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/upgrade.sh)
11. [回滚脚本 rollback.sh](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/rollback.sh)
12. [健康检查脚本 healthcheck.sh](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/healthcheck.sh)
13. [运维巡检脚本 ops-check.sh](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/ops-check.sh)

---

## 第 1 部分：项目理解

### new-api 在整个系统中的位置

`new-api` 不是一个普通 Web 管理后台，而是 AI 网关和模型路由层。它的核心价值不在“页面”，而在：

1. 把多个上游供应商统一成 OpenAI 风格接口。
2. 在下游维度管理 Token、配额、模型权限和分组。
3. 在上游维度管理渠道、模型映射、权重、重试、余额检测和可用性测试。
4. 让客户端始终对接你的域名，而不是直接暴露供应商密钥。

### 它与 MySQL、Redis、Nginx、客户端、上游的关系

1. 客户端只认你的 `https://api.example.com/v1/...`。
2. Nginx 终止 TLS，处理流式代理和安全访问控制。
3. new-api 接收请求，按模型映射和渠道策略选择上游。
4. MySQL 保存核心业务状态。
5. Redis 保存缓存、会话和同步状态。
6. 上游供应商只对 new-api 可见，不对客户端暴露。

### 官方 compose 的不足

基于当前仓库和文档，官方 compose 有这些明显不足：

1. 默认使用 `latest`，不适合生产升级控制。
2. 默认公开映射 `3000:3000`，不适合作为公网入口。
3. 默认示例密码是明文弱密码。
4. 没有 Nginx、HTTPS、备份、回滚与巡检链路。
5. 没有后台隐藏与公网暴露边界设计。

结论：官方 compose 可作为参考，不建议直接作为长期生产方案。

---

## 第 2 部分：生产架构设计

### 推荐目录结构

```text
/opt/new-api/
├── compose/
│   ├── docker-compose.yml                 # 必须保留，核心编排文件
│   ├── .env                              # 必须保留，敏感配置
│   ├── mysql/
│   │   └── conf.d/
│   │       └── zzz-new-api.cnf           # 必须保留，MySQL 参数
│   └── redis/
│       └── redis.conf                    # 必须保留，Redis 参数
├── data/
│   ├── mysql/                            # 必须备份，不能丢
│   ├── redis/                            # 建议备份，最好别丢
│   └── new-api/                          # 必须备份，不能丢
├── logs/
│   └── new-api/                          # 建议保留，主要用于排障
├── backups/
│   ├── mysql/                            # 必须保留
│   ├── config/                           # 必须保留
│   ├── manifests/                        # 必须保留
│   └── .tmp/                             # 临时目录，可丢
├── releases/                             # 必须保留，升级/回滚状态
└── src/
    └── new-api/                          # 建议保留，跟踪上游源码与文档
```

### 哪些目录需要备份

| 路径 | 级别 | 原因 |
|---|---|---|
| `/opt/new-api/compose/.env` | 必须 | 保存密钥、域名、镜像版本、数据库密码 |
| `/opt/new-api/compose/docker-compose.yml` | 必须 | 当前运行形态定义 |
| `/opt/new-api/compose/mysql/conf.d/zzz-new-api.cnf` | 必须 | 数据库参数 |
| `/opt/new-api/compose/redis/redis.conf` | 必须 | 缓存持久化参数 |
| `/opt/new-api/data/mysql` | 必须 | 核心业务数据 |
| `/opt/new-api/data/new-api` | 必须 | new-api 持久化目录 |
| `/opt/new-api/data/redis` | 建议 | 会话、缓存、同步状态 |
| `/opt/new-api/backups/*` | 必须 | 备份历史与回滚依据 |
| `/etc/nginx/sites-available/api.example.com.conf` | 必须 | 入口控制面 |
| `/etc/systemd/system/new-api-stack.service` | 建议 | 开机自启和统一管理 |
| `/etc/letsencrypt` | 建议 | 证书可再签，但备份能加速恢复 |

### Redis 在本架构中的作用与丢失影响

作用：

1. 缓存热点状态，减少数据库压力。
2. 支撑会话、同步和未来多节点扩展。
3. 为部分限流与后台任务协同提供支持。

丢失影响：

1. 不会像丢 MySQL 一样导致核心配置全没。
2. 但会导致缓存失效、登录状态失效、同步状态重置、短期限流计数丢失。
3. 所以单机也建议持久化 Redis。

### 你已经为我生成了哪些文件

1. [目录规范已对应到 compose、nginx、systemd、scripts 文件夹](/home/sgj/projects/NewAPI/production/new-api-prod)

---

## 第 3 部分：从全新 Ubuntu 服务器开始部署

下面按“目的 / 操作 / 预期结果 / 失败检查”展开。

### 步骤 1：准备 DNS 与安全组

目的：保证域名和 80/443 入口先打通。

操作：

```bash
# 在云厂商控制台完成，不是在服务器里执行
# 1. 为 api.example.com 添加 A 记录，指向你的服务器公网 IP
# 2. 安全组仅放行 22、80、443
# 3. 不要放行 3000、3306、6379
```

预期结果：

1. `api.example.com` 能解析到服务器公网 IP。
2. 服务器公网只需要暴露 22/80/443。

失败时怎么检查：

```bash
dig +short api.example.com
curl -I http://api.example.com
```

### 步骤 2：安装宿主机基础软件

目的：安装 Git、Nginx、Certbot、Docker 和 Compose。

操作：

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release git nginx certbot python3-certbot-nginx jq unzip

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker nginx
sudo usermod -aG docker "$USER"
```

建议额外执行：

```bash
# 避免无人值守升级把 Docker/Nginx 意外升版本
sudo apt-mark hold docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nginx
```

预期结果：

```bash
docker --version
docker compose version
nginx -v
git --version
certbot --version
```

失败时怎么检查：

```bash
sudo systemctl status docker --no-pager
sudo systemctl status nginx --no-pager
journalctl -u docker -n 100 --no-pager
```

### 步骤 3：拉取 upstream 仓库作为参考源码

目的：保留上游源码、默认 compose、release notes 和文档，便于以后升级核对。

操作：

```bash
sudo mkdir -p /opt/new-api/src
sudo git clone https://github.com/QuantumNous/new-api.git /opt/new-api/src/new-api
cd /opt/new-api/src/new-api
sudo git fetch --tags
sudo git checkout v0.12.14
```

预期结果：

```bash
cd /opt/new-api/src/new-api
git describe --tags --always
```

失败时怎么检查：

```bash
ls -la /opt/new-api/src/new-api
git tag -l | tail
```

### 步骤 4：复制本部署包到目标目录

目的：把推荐版生产配置放到宿主机标准位置。

操作：

```bash
sudo mkdir -p /opt/new-api

# 将本工作区中的 production/new-api-prod 整个目录复制到服务器
# 你也可以直接在服务器中手工创建相同文件

sudo mkdir -p /opt/new-api/compose
sudo mkdir -p /opt/new-api/scripts
sudo mkdir -p /opt/new-api/nginx
sudo mkdir -p /opt/new-api/systemd

# 复制示例:
# production/new-api-prod/compose/*      -> /opt/new-api/compose/
# production/new-api-prod/scripts/*      -> /opt/new-api/scripts/
# production/new-api-prod/nginx/*        -> /opt/new-api/nginx/
# production/new-api-prod/systemd/*      -> /opt/new-api/systemd/
```

预期结果：

```bash
tree -a /opt/new-api
```

失败时怎么检查：

```bash
find /opt/new-api -maxdepth 3 -type f | sort
```

### 步骤 5：初始化 .env 和目录

目的：创建生产目录、复制 `.env`、确保变量与权限正确。

操作：

```bash
sudo cp /opt/new-api/compose/.env.example /opt/new-api/compose/.env
sudo nano /opt/new-api/compose/.env

sudo /opt/new-api/scripts/init-first-deploy.sh
```

必须修改的变量：

1. `APP_DOMAIN`
2. `APP_PUBLIC_URL`
3. `ADMIN_ALLOW_CIDR`
4. `SESSION_SECRET`
5. `CRYPTO_SECRET`
6. `INITIAL_ROOT_TOKEN`
7. `INITIAL_ROOT_ACCESS_TOKEN`
8. `MYSQL_PASSWORD`
9. `MYSQL_ROOT_PASSWORD`
10. `REDIS_PASSWORD`

建议用下面命令生成随机值：

```bash
openssl rand -base64 48
openssl rand -hex 32
```

预期结果：

```bash
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml config >/dev/null && echo OK
```

失败时怎么检查：

```bash
sudo grep -n 'CHANGE_ME' /opt/new-api/compose/.env
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml config
```

### 步骤 6：先启用启动版 Nginx 配置，申请证书

目的：先让 Certbot 能完成 ACME 校验，再切换正式 HTTPS。

操作：

```bash
sudo mkdir -p /var/www/certbot
sudo cp /opt/new-api/nginx/api.example.com.bootstrap.conf /etc/nginx/sites-available/api.example.com.conf
sudo ln -sf /etc/nginx/sites-available/api.example.com.conf /etc/nginx/sites-enabled/api.example.com.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d api.example.com
```

预期结果：

```bash
sudo certbot certificates
```

失败时怎么检查：

```bash
sudo nginx -t
sudo journalctl -u nginx -n 100 --no-pager
curl -I http://api.example.com/.well-known/acme-challenge/test
```

### 步骤 7：切换正式 HTTPS Nginx 配置

目的：启用流式代理、访问控制、超时控制与 TLS 头。

操作：

先把下面两处替换成你的真实值：

1. `api.example.com`
2. `203.0.113.10/32`

然后执行：

```bash
sudo cp /opt/new-api/nginx/api.example.com.conf /etc/nginx/sites-available/api.example.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

预期结果：

```bash
curl -I http://api.example.com
curl -I https://api.example.com
```

失败时怎么检查：

```bash
sudo nginx -t
sudo tail -n 100 /var/log/nginx/new-api.error.log
```

### 步骤 8：启动 Docker 栈

目的：启动 `new-api + MySQL + Redis`。

操作：

```bash
cd /opt/new-api/compose
sudo docker compose --env-file /opt/new-api/compose/.env up -d
```

预期结果：

```bash
sudo docker compose --env-file /opt/new-api/compose/.env ps
```

失败时怎么检查：

```bash
sudo docker compose --env-file /opt/new-api/compose/.env logs --tail=200 new-api
sudo docker compose --env-file /opt/new-api/compose/.env logs --tail=200 mysql
sudo docker compose --env-file /opt/new-api/compose/.env logs --tail=200 redis
```

### 步骤 9：启用 systemd 托管

目的：让整套栈随宿主机自动恢复，并提供统一状态入口。

操作：

```bash
sudo cp /opt/new-api/systemd/new-api-stack.service /etc/systemd/system/new-api-stack.service
sudo systemctl daemon-reload
sudo systemctl enable --now new-api-stack.service
```

预期结果：

```bash
sudo systemctl status new-api-stack.service --no-pager
```

失败时怎么检查：

```bash
journalctl -u new-api-stack.service -n 100 --no-pager
```

### 步骤 10：执行首次健康检查

目的：确认从本地、外部、数据库和 Redis 看都已正常。

操作：

```bash
sudo /opt/new-api/scripts/healthcheck.sh
```

预期结果：

1. `new-api/mysql/redis` 三个服务状态正常。
2. `http://127.0.0.1:3000/api/status` 通过。
3. `https://api.example.com/api/status` 通过。

失败时怎么检查：

```bash
curl -sS http://127.0.0.1:3000/api/status
curl -sS https://api.example.com/api/status
sudo docker compose --env-file /opt/new-api/compose/.env logs --tail=200 new-api
```

### 你已经为我生成了哪些文件

1. [部署手册](/home/sgj/projects/NewAPI/production/new-api-prod/docs/DEPLOYMENT_GUIDE.zh-CN.md)
2. [compose 目录](/home/sgj/projects/NewAPI/production/new-api-prod/compose)
3. [nginx 目录](/home/sgj/projects/NewAPI/production/new-api-prod/nginx)
4. [systemd 目录](/home/sgj/projects/NewAPI/production/new-api-prod/systemd)
5. [scripts 目录](/home/sgj/projects/NewAPI/production/new-api-prod/scripts)

---

## 第 4 部分：全部配置文件

完整文件内容已经生成在以下路径：

1. [docker-compose.yml](/home/sgj/projects/NewAPI/production/new-api-prod/compose/docker-compose.yml)
2. [.env.example](/home/sgj/projects/NewAPI/production/new-api-prod/compose/.env.example)
3. [Nginx 启动配置](/home/sgj/projects/NewAPI/production/new-api-prod/nginx/api.example.com.bootstrap.conf)
4. [Nginx 正式配置](/home/sgj/projects/NewAPI/production/new-api-prod/nginx/api.example.com.conf)
5. [systemd 单元](/home/sgj/projects/NewAPI/production/new-api-prod/systemd/new-api-stack.service)
6. [备份脚本](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/backup.sh)
7. [升级脚本](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/upgrade.sh)
8. [回滚脚本](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/rollback.sh)
9. [健康检查脚本](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/healthcheck.sh)
10. [首次部署初始化脚本](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/init-first-deploy.sh)
11. [运维巡检脚本](/home/sgj/projects/NewAPI/production/new-api-prod/scripts/ops-check.sh)
12. [MySQL 参数文件](/home/sgj/projects/NewAPI/production/new-api-prod/compose/mysql/conf.d/zzz-new-api.cnf)
13. [Redis 参数文件](/home/sgj/projects/NewAPI/production/new-api-prod/compose/redis/redis.conf)

说明：

1. 所有脚本都已使用 `set -euo pipefail`。
2. 所有变量名已与 `.env.example` 保持一致。
3. 所有 secret 都保留为占位符。
4. Nginx 配置默认示例 IP 为文档保留地址，你上线前必须替换。

---

## 第 5 部分：生产参数建议

### 建议值与策略

| 项目 | 建议 |
|---|---|
| `SESSION_SECRET` | 至少 64 位随机字符串，所有未来节点必须一致 |
| `CRYPTO_SECRET` | 至少 64 位随机字符串，单独生成，不要直接复用 `SESSION_SECRET` |
| `SQL_DSN` | 通过 compose 自动拼接，使用专用业务用户 `newapi`，不要长期用 root |
| `REDIS_CONN_STRING` | 使用密码，持久化到 `/opt/new-api/data/redis` |
| 全局 API 限流 | `180 次 / 180 秒 / IP` 作为起点 |
| 全局 Web 限流 | `60 次 / 180 秒 / IP` |
| 关键操作限流 | `20 次 / 1200 秒 / IP` |
| `RELAY_TIMEOUT` | 建议维持 `0`，避免上游已计费而本地超时造成账单不同步 |
| `STREAMING_TIMEOUT` | 建议 `600` 秒，用于长流式响应 |
| `MAX_REQUEST_BODY_MB` | 建议 `64` |
| `STREAM_SCANNER_MAX_BUFFER_MB` | 建议 `128`，用于大图/base64 场景 |
| 日志策略 | 保留应用日志目录 + Docker json-file 轮转 |
| TLS 处理 | 宿主机 Nginx 终止 TLS |
| `TRUSTED_REDIRECT_DOMAINS` | 仅填你信任的域名，如 `api.example.com` |
| `FRONTEND_BASE_URL` | 单机场景建议和公网域名一致 |
| 多节点预留 | 保持 `MySQL + Redis + SESSION_SECRET + CRYPTO_SECRET` 可共享 |

### 需按当前版本文档核对的字段

以下字段基于当前公开文档与仓库示例，部署前请以当前版本文档再次核对字段名：

1. `INITIAL_ROOT_TOKEN`
2. `INITIAL_ROOT_ACCESS_TOKEN`
3. `NODE_NAME`
4. `CHANNEL_UPSTREAM_MODEL_UPDATE_TASK_ENABLED`
5. `CHANNEL_UPSTREAM_MODEL_UPDATE_TASK_INTERVAL_MINUTES`
6. `CHANNEL_UPSTREAM_MODEL_UPDATE_MIN_CHECK_INTERVAL_SECONDS`

---

## 第 6 部分：安全加固

### 基础原则

1. 公网只开 `80/443`。
2. `3000` 只绑定 `127.0.0.1`。
3. `3306/6379` 不做宿主机端口映射。
4. 后台页面与 `/api/` 管理接口仅允许固定 IP 访问。
5. 所有密钥仅保存在 `/opt/new-api/compose/.env`，权限 `640`。

### 具体建议

1. 仅暴露 `80/443`，安全组和防火墙都不要开放 `3000/3306/6379`。
2. 用 HTTPS，禁止明文公网调用。
3. 后台面板通过 Nginx `allow/deny` 隐藏，不把管理面板直接暴露给所有公网。
4. 首次上线后立即废弃初始化 Token，改用单独管理员和普通下游 Token。
5. 所有强密码与密钥都用 `openssl rand` 生成。
6. 备份目录权限建议 `750`，备份文件建议 `600`。
7. 容器重启策略使用 `unless-stopped`。
8. `ERROR_LOG_ENABLED` 默认保持 `false`，减少错误细节暴露到前端。
9. 上游供应商 Key 只放在 new-api 渠道配置中，不给客户端。
10. 通过 Nginx 和应用双重限流限制恶意刷接口。
11. 禁止使用 `latest` 镜像直接进生产。
12. 升级前永远先备份，再拉镜像，再切换，再验证，再决定是否保留。

---

## 第 7 部分：首次上线后的后台配置步骤

下面这部分需要你手工进入后台完成。

### 推荐 checklist

1. 从允许访问后台的 IP 打开 `https://api.example.com/`。
2. 使用初始化 root 方式进入后台。
3. 立即创建正式管理员账号。
4. 立即记录并妥善保管 root Token 与管理员凭据。
5. 如当前版本支持，关闭或废弃初始化 Token 的长期使用。
6. 添加第一个上游渠道，先用最稳定的主力供应商。
7. 添加第二个上游渠道，作为同模型或近似模型的备份。
8. 在模型映射中创建你的逻辑模型名，而不是让客户端直接写厂商原始模型名。
9. 推荐先创建这些逻辑模型名：
   - `chat-fast`
   - `chat-pro`
   - `reasoning`
   - `vision`
   - `embedding`
10. 为每个逻辑模型名绑定一个主渠道和至少一个备渠道。
11. 为不同用途创建不同下游 Token：
   - 个人开发
   - 脚本任务
   - 团队共享
12. 为每个 Token 配置模型权限和配额。
13. 设置基础限流与分组策略。
14. 用后台的渠道测试功能逐个测试可用性。
15. 用 `chat-fast` 做一次真实聊天请求验证。
16. 用 `vision` 做一次带图请求验证。
17. 用 `embedding` 做一次向量请求验证。
18. 设计主备策略：
   - 主渠道：稳定、便宜、延迟低
   - 备渠道：更贵但更稳，或不同供应商
19. 再设计权重策略：
   - 高频模型走主渠道
   - 高可靠模型走双供应商备份
20. 最后将 `/opt/new-api/compose/.healthcheck_token` 写入一个只具备最小必要权限的巡检 Token。

说明：

1. 后台 UI 细节和字段位置可能随版本变化。
2. 请以当前版本后台界面和官方文档为准，不要死记旧截图。

---

## 第 8 部分：客户端接入示例

下面示例全部通过你的域名，不直接访问上游供应商。

### Python（OpenAI SDK）

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-newapi-token",
    base_url="https://api.example.com/v1",
)

resp = client.chat.completions.create(
    model="chat-fast",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "请用一句话介绍你自己。"},
    ],
)

print(resp.choices[0].message.content)
```

### Node.js（OpenAI SDK）

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-newapi-token",
  baseURL: "https://api.example.com/v1",
});

const resp = await client.chat.completions.create({
  model: "chat-fast",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "请用一句话介绍你自己。" },
  ],
});

console.log(resp.choices[0].message.content);
```

### curl：模型列表验证

```bash
curl -sS https://api.example.com/v1/models \
  -H "Authorization: Bearer sk-your-newapi-token"
```

### curl：真实聊天请求验证

```bash
curl -sS https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-newapi-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chat-fast",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "请用一句话介绍你自己。"}
    ]
  }'
```

### curl：流式输出验证

```bash
curl -N https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-newapi-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chat-fast",
    "stream": true,
    "messages": [
      {"role": "user", "content": "请连续输出 1 到 10。"}
    ]
  }'
```

---

## 第 9 部分：监控、备份、升级、回滚

### 数据库备份

执行：

```bash
sudo /opt/new-api/scripts/backup.sh
```

数据库恢复命令：

```bash
gunzip -c /opt/new-api/backups/mysql/new-api_YYYY-MM-DD_HHMMSS.sql.gz | \
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml exec -T mysql \
sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

### 配置文件备份

由 `backup.sh` 一并打包：

1. `compose/`
2. `.env`
3. 当前 Nginx 实际运行配置
4. 当前 systemd 实际运行配置

### 容器镜像升级

推荐流程：

```bash
sudo /opt/new-api/scripts/upgrade.sh calciumion/new-api:v0.12.15
```

这个脚本会：

1. 先健康检查。
2. 先备份。
3. 拉取目标镜像。
4. 修改 `.env` 中的 `NEW_API_IMAGE`。
5. 仅滚动重建 `new-api` 容器。
6. 健康检查失败时自动回滚。

### 灰度升级思路

单机没有真正的双活灰度，但你至少应做到：

1. 先看 release notes。
2. 先备份数据库和配置。
3. 先拉目标镜像，不马上切换。
4. 在低峰时段切换。
5. 切换后先跑 `healthcheck.sh`。
6. 再执行真实模型请求验证。
7. 失败则立即回滚。

### 回滚

```bash
sudo /opt/new-api/scripts/rollback.sh
```

或指定版本：

```bash
sudo /opt/new-api/scripts/rollback.sh calciumion/new-api:v0.12.14
```

### 升级前后验证

升级前：

```bash
sudo /opt/new-api/scripts/healthcheck.sh
curl -sS https://api.example.com/v1/models -H "Authorization: Bearer sk-your-newapi-token"
```

升级后：

```bash
sudo /opt/new-api/scripts/healthcheck.sh
curl -sS https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-newapi-token" \
  -H "Content-Type: application/json" \
  -d '{"model":"chat-fast","messages":[{"role":"user","content":"升级后自检"}]}'
```

### 每周维护项

1. 运行 `ops-check.sh`。
2. 确认最近备份存在。
3. 检查证书剩余有效期。
4. 检查磁盘空间与 MySQL 数据增长。
5. 检查错误日志是否暴增。
6. 抽样测试主力模型。

### 每月维护项

1. 阅读 new-api release notes。
2. 评估是否升级。
3. 清理不用的下游 Token 和渠道。
4. 轮换敏感密码与初始化 Token。
5. 演练一次恢复流程。
6. 检查安全组、Nginx allowlist、系统账号权限。

### 第一周运维建议

1. 每天至少跑一次 `healthcheck.sh`。
2. 每天确认备份是否生成。
3. 每天观察 Nginx 和 new-api 错误日志。
4. 每天用真实业务流量最常用的模型做抽测。

### 第一个月运维建议

1. 一周后第一次审视限流值是否过宽或过窄。
2. 两周后审视日志保留和磁盘增长。
3. 一个月内不要频繁追 `latest`。
4. 先稳定业务模型名，再慢慢增加上游供应商。

---

## 第 10 部分：故障排查手册

### 1. 容器启动失败

现象：`docker compose ps` 显示 `Exit` 或 `Restarting`

可能原因：

1. `.env` 仍有占位符。
2. 数据卷权限不对。
3. 镜像标签不存在。

排查命令：

```bash
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml ps
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml logs --tail=200 new-api
```

修复方法：

1. 修正 `.env`。
2. 检查镜像标签。
3. 检查宿主机目录权限。

### 2. 数据库连接失败

现象：new-api 日志里出现数据库连接错误

可能原因：

1. `MYSQL_PASSWORD` 与实际初始化值不一致。
2. MySQL 尚未健康。
3. 数据目录损坏。

排查命令：

```bash
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml logs --tail=200 mysql
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml exec -T mysql sh -c 'mysqladmin ping -h 127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" --silent'
```

修复方法：

1. 核对 `.env` 与 MySQL 初始化状态。
2. 若是首次部署失败，清空错误初始化的数据目录后重建。
3. 若是线上故障，先恢复数据库备份再重建。

### 3. Redis 连接失败

现象：登录状态异常、同步异常，日志里出现 Redis 错误

可能原因：

1. Redis 密码不一致。
2. Redis 没起来。
3. AOF/RDB 损坏。

排查命令：

```bash
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml logs --tail=200 redis
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml exec -T redis sh -c 'redis-cli -a "$REDIS_PASSWORD" ping'
```

修复方法：

1. 核对 `REDIS_PASSWORD`。
2. 修复或清理损坏持久化文件。
3. 重启 Redis 后再检查 new-api。

### 4. 反代 502

现象：Nginx 返回 `502 Bad Gateway`

可能原因：

1. new-api 没监听在 `127.0.0.1:3000`。
2. new-api 容器没起来。
3. Nginx 代理路径写错。

排查命令：

```bash
curl -sS http://127.0.0.1:3000/api/status
sudo tail -n 100 /var/log/nginx/new-api.error.log
sudo nginx -t
```

修复方法：

1. 先修复 new-api 容器。
2. 再修复 Nginx 配置。

### 5. 模型请求超时

现象：客户端长时间等待后失败

可能原因：

1. 上游本身慢。
2. `STREAMING_TIMEOUT` 太短。
3. Nginx `proxy_read_timeout` 太短。

排查命令：

```bash
grep -n 'STREAMING_TIMEOUT' /opt/new-api/compose/.env
sudo grep -n 'proxy_read_timeout' /etc/nginx/sites-available/api.example.com.conf
sudo docker compose --env-file /opt/new-api/compose/.env -f /opt/new-api/compose/docker-compose.yml logs --tail=200 new-api
```

修复方法：

1. 适当提高 `STREAMING_TIMEOUT`。
2. 保持 Nginx 读写超时 `3600s`。
3. 检查上游渠道质量与地区连通性。

### 6. 鉴权失败

现象：返回 `401` 或 `403`

可能原因：

1. 下游 Token 错误。
2. Token 没权限访问对应逻辑模型。
3. 请求打到了后台受限路径。

排查命令：

```bash
curl -i https://api.example.com/v1/models -H "Authorization: Bearer sk-xxx"
```

修复方法：

1. 核对 Token。
2. 核对该 Token 的模型权限、分组、配额。
3. 确保客户端只走 `/v1/*`，不要走后台 `/api/*`。

### 7. 渠道可用但模型不可用

现象：渠道测试通过，但某模型调用报错

可能原因：

1. 模型名没映射。
2. 上游本身不支持该模型。
3. 逻辑模型名与客户端请求不一致。

排查命令：

```bash
curl -sS https://api.example.com/v1/models -H "Authorization: Bearer sk-your-newapi-token"
```

修复方法：

1. 在后台核对模型映射。
2. 统一只对客户端暴露逻辑模型名。

### 8. 流式输出异常中断

现象：SSE 中途断流

可能原因：

1. Nginx 缓冲没关闭。
2. 代理超时不够。
3. 上游不稳定。

排查命令：

```bash
sudo grep -n 'proxy_buffering off' /etc/nginx/sites-available/api.example.com.conf
sudo grep -n 'proxy_read_timeout' /etc/nginx/sites-available/api.example.com.conf
```

修复方法：

1. 确保 `proxy_buffering off`。
2. 确保 `add_header X-Accel-Buffering no`。
3. 提高 `STREAMING_TIMEOUT`。

### 9. 升级后配置失效

现象：升级后行为变了、某些字段不生效

可能原因：

1. 当前版本字段名变化。
2. 某些旧环境变量已弃用。
3. 后台数据库配置覆盖了旧习惯。

排查命令：

```bash
grep -n '^NEW_API_IMAGE=' /opt/new-api/compose/.env
cd /opt/new-api/src/new-api && git describe --tags --always
```

修复方法：

1. 对照当前版本文档重新核对环境变量。
2. 必要时回滚。

### 10. 数据卷权限错误

现象：容器日志报无法写入数据或日志目录

可能原因：

1. 宿主机目录属主/权限不匹配。
2. 手工复制文件时权限被锁死。

排查命令：

```bash
sudo ls -ld /opt/new-api /opt/new-api/data /opt/new-api/logs /opt/new-api/backups
sudo namei -om /opt/new-api/data/mysql
```

修复方法：

1. 修正目录权限。
2. 必要时先备份再重新创建目录。

### 11. 证书续期失败

现象：Certbot 自动续期失败

可能原因：

1. 80 端口未开放。
2. Nginx 配置被改坏。
3. DNS 已变更。

排查命令：

```bash
sudo certbot renew --dry-run
sudo nginx -t
dig +short api.example.com
```

修复方法：

1. 先恢复 Nginx 可用。
2. 确保 `/.well-known/acme-challenge/` 可访问。
3. 必要时重新签发证书。

---

## 上线验证命令

### 1. HTTP 自动跳转验证

```bash
curl -I http://api.example.com
```

### 2. 健康接口验证

```bash
curl -sS https://api.example.com/api/status
```

### 3. 模型列表验证

```bash
curl -sS https://api.example.com/v1/models \
  -H "Authorization: Bearer sk-your-newapi-token"
```

### 4. 一次真实聊天验证

```bash
curl -sS https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-newapi-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chat-fast",
    "messages": [
      {"role": "user", "content": "回复 OK"}
    ],
    "max_tokens": 8
  }'
```

---

## 最容易踩坑的 20 个问题

1. 直接拿官方 compose 上生产。
2. 镜像用 `latest`。
3. 把 3000 直接暴露公网。
4. 继续用 SQLite 长期跑。
5. Nginx 没关缓冲，导致流式中断。
6. 给 Redis 不设密码。
7. 把后台页面暴露给全网。
8. 忘了做数据库备份。
9. 只备份数据库，不备份 `.env`。
10. `TRUSTED_REDIRECT_DOMAINS` 填得过宽。
11. 用 root 作为业务数据库用户。
12. 初始化 Token 长期不轮换。
13. 客户端直接使用上游原始模型名。
14. 不做逻辑模型名分层。
15. 没有主备渠道。
16. 升级前不看 release notes。
17. 升级后不做真实模型请求验证。
18. Redis 丢了却以为完全没影响。
19. 证书续期从未演练。
20. 误把 `.env`、备份包和上游 Key 提交到 Git。

---

## 上线前最终核对清单

1. DNS 已正确解析到公网 IP。
2. 安全组只开放 22/80/443。
3. `3000/3306/6379` 未暴露公网。
4. `.env` 中已替换所有 `CHANGE_ME`。
5. 镜像版本已固定，不是 `latest`。
6. Nginx `server_name` 已替换为真实域名。
7. Nginx `allow` 网段已替换为真实管理 IP。
8. `certbot renew --dry-run` 成功。
9. `docker compose config` 校验成功。
10. `healthcheck.sh` 成功。
11. `backup.sh` 至少成功跑过一次。
12. 后台逻辑模型名已建立。
13. 主备渠道已建立。
14. 下游 Token 已创建且权限正确。
15. 至少完成一次真实聊天请求验证。

---

## 我应该长期保留的文件清单

1. `/opt/new-api/compose/docker-compose.yml`
2. `/opt/new-api/compose/.env`
3. `/opt/new-api/compose/mysql/conf.d/zzz-new-api.cnf`
4. `/opt/new-api/compose/redis/redis.conf`
5. `/etc/nginx/sites-available/api.example.com.conf`
6. `/etc/systemd/system/new-api-stack.service`
7. `/opt/new-api/scripts/backup.sh`
8. `/opt/new-api/scripts/upgrade.sh`
9. `/opt/new-api/scripts/rollback.sh`
10. `/opt/new-api/scripts/healthcheck.sh`
11. `/opt/new-api/scripts/ops-check.sh`
12. `/opt/new-api/backups/`
13. `/opt/new-api/releases/`
14. `/opt/new-api/src/new-api`

---

## 未来做双机 / 多节点时如何演进

单机稳定后，未来升级路径建议这样走：

1. 先把 MySQL 迁到托管数据库或独立数据库主机。
2. 再把 Redis 迁到托管 Redis 或独立 Redis。
3. 让所有 new-api 节点共享同一套：
   - `SQL_DSN`
   - `REDIS_CONN_STRING`
   - `SESSION_SECRET`
   - `CRYPTO_SECRET`
4. 主节点保持 `master`，新增只读或转发节点使用 `slave`。
5. 前面再放一层负载均衡器或云 SLB。
6. 升级顺序改为先升级从节点，最后升级主节点。

---

## 参考依据

以下信息已在设计时参考，但你上线前仍应再次核对最新文档：

1. [QuantumNous/new-api 仓库](https://github.com/QuantumNous/new-api)
2. [GitHub Releases：当前 latest 为 v0.12.14（2026-04-17）](https://github.com/QuantumNous/new-api/releases)
3. [官方 Docker Compose 示例](https://github.com/QuantumNous/new-api/blob/main/docker-compose.yml)
4. [环境变量文档](https://docs.newapi.ai/en/docs/installation/config-maintenance/environment-variables)
5. [集群部署文档](https://docs.newapi.ai/en/docs/installation/deployment-methods/cluster-deployment)
6. [系统更新文档](https://docs.newapi.ai/en/docs/installation/config-maintenance/system-update)

结论：

1. 官方文档明确支持 MySQL、Redis、`SESSION_SECRET`、`CRYPTO_SECRET`、限流与超时环境变量。
2. 官方 compose 更偏快速启动，不够生产化。
3. 生产部署必须自己补上 Nginx、HTTPS、备份、升级和回滚链路。
