# 基于 new-api 的“合规 + 可闭源商业化”AI API 平台完整落地方案

作者角色定位：首席架构师 + 资深平台工程师 + DevOps 架构师 + 商业化 SaaS 后端负责人 + 安全工程师 + AI 网关实施顾问  
适用阶段：从 MVP 到小型商业 SaaS，再到企业版增强  
核心原则：`new-api = 内部开源中转层`，`商业网关 / 计费 / 用户体系 / 风控 / 客户控制台 = 独立闭源`

> 法律边界提示：以下方案是工程上最稳妥的合规分层方案，但 AGPL 具体义务、网络交互是否触发衍生作品判断、商标/品牌使用、SaaS 销售模式等问题，仍需律师结合你的司法辖区和商业模式最终确认。

---

## 第 1 部分：合规边界与系统分层

### 1.1 哪些部分必须开源

必须开源的部分：

1. 你对 `new-api` 本体的修改。
2. 与 `new-api` 直接耦合、运行时作为其一部分提供网络服务的改动。
3. 任何直接嵌入 `new-api` 代码库、形成其功能一部分的商业逻辑实现。

建议公开的仓库：

1. `new-api-fork`
2. 你对 `new-api` 的部署补丁、适配层、非商业核心改动
3. 与 `new-api` 配套但不含商业秘密的运维清单、公开文档

### 1.2 哪些部分可以闭源

可以闭源且必须闭源的部分：

1. `Edge / API Gateway`
2. `Auth / Identity Service`
3. `Billing Service`
4. `Policy / Entitlement Service`
5. `Risk Control Service`
6. `Relay / Orchestrator`
7. `Admin Console`
8. `Customer Console`
9. `BI / Reporting`
10. 支付、订阅、订单、发票、对账、返佣、风控、组织体系、报表逻辑

### 1.3 为什么计费逻辑不能放进 new-api

原因不是“技术不能”，而是“法律和商业上都不划算”：

1. `new-api` 当前仓库明确为 `AGPL-3.0`，其 README 也明确写明如果想避免 AGPL 义务需要联系作者。
2. 一旦你把余额扣费、套餐、账期、发票、返佣、风控等核心商业逻辑直接塞进 `new-api`，这些能力很可能被视为 `new-api` 网络服务的一部分。
3. 这样做会让你的商业护城河与 AGPL 边界纠缠在一起，未来很难证明哪些必须公开、哪些可以闭源。
4. 更糟的是，后续若你想完全替换掉 `new-api`，会因为耦合太深而难以迁移。

### 1.4 为什么用户必须先经过闭源商业网关

1. 客户 API Key 不能直接等于 `new-api` 原生 key，否则客户就等于“直接面向 new-api”。
2. 商业网关必须先完成鉴权、组织/项目隔离、套餐判断、计费预授权、风控和限流。
3. 只有商业网关知道“客户是谁、该扣多少钱、能不能用某模型、是否超额、是否命中企业专属路由”。
4. `new-api` 只应该知道“内部调用者”和“内部路由后的模型/渠道信息”，而不是商业语义。

### 1.5 最终推荐架构图

```text
                    +-------------------------------+
                    |        Public Internet        |
                    +-------------------------------+
                          |                  |
                          v                  v
              +------------------+   +----------------------+
              | api.example.com  |   | console.example.com  |
              +------------------+   +----------------------+
                          |                  |
                          v                  v
                +----------------+   +----------------------+
                | Edge Gateway   |   | Customer Console     |
                | CLOSED         |   | CLOSED               |
                +----------------+   +----------------------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
 +----------------+ +----------------+ +----------------------+
 | Auth/Identity  | | Policy Service | | Risk Control Service |
 | CLOSED         | | CLOSED         | | CLOSED               |
 +----------------+ +----------------+ +----------------------+
          |               |               |
          +---------------+---------------+
                          |
                          v
                +----------------------+
                | Billing Service      |
                | CLOSED               |
                +----------------------+
                          |
                          v
                +----------------------+
                | Relay Orchestrator   |
                | CLOSED               |
                +----------------------+
                          |
                          v
                +----------------------+
                | new-api (internal)   |
                | AGPL / OPEN SOURCE   |
                +----------------------+
                          |
                          v
                +----------------------+
                | Upstream Providers    |
                | OpenAI/Anthropic/... |
                +----------------------+

Shared Infra:
MySQL + Redis + NATS + Object Storage + Prometheus/Grafana/Loki/Tempo

Internal Ops:
Admin Console (CLOSED) ---> Billing / Policy / Risk / Relay / new-api admin
new-api-fork (OPEN) -----> isolated repo, no business moat inside
```

### 1.6 每一层职责和边界

1. `Edge Gateway`：唯一对外 API 入口，负责客户鉴权、预授权、实时风控、流量治理、请求跟踪、协议整形、流式回传。
2. `Auth / Identity`：用户、组织、项目、成员关系、角色权限、API Key 主档。
3. `Policy / Entitlement`：客户到底“能不能用”、可用哪些模型、哪些区域、哪些吞吐上限。
4. `Billing`：价格、余额、订阅、账期、冻结、结算、冲正、对账。
5. `Risk Control`：滥用、盗刷、异常请求、成本失控、地区/来源策略。
6. `Relay Orchestrator`：把商业语义转换成内部路由语义，决定具体模型 profile、供应商和降级策略。
7. `new-api`：内部开源协议兼容与渠道中转，不承载商业护城河。
8. `Customer Console`：只给客户看自己的项目、key、用量、账单、工单。
9. `Admin Console`：内部运营和支持后台，不暴露给客户。

---

## 第 2 部分：完整技术架构

### 2.1 服务清单与闭源属性

| 服务 | 是否闭源 | 核心职责 |
|---|---|---|
| Edge / API Gateway | 闭源 | 外部统一 API、鉴权、预授权、限流、流式转发 |
| Auth / Identity Service | 闭源 | 用户、组织、项目、角色、客户 API Key |
| Billing Service | 闭源 | 价格、余额、订阅、账期、发票、结算、冲正 |
| Policy / Entitlement Service | 闭源 | 套餐权限、模型白名单、企业特权、地域策略 |
| Risk Control Service | 闭源 | 风控、异常检测、黑白名单、限流判定 |
| Relay / Orchestrator | 闭源 | 供应商路由、熔断、降级、成本优选 |
| new-api | 开源 | 内部兼容层、渠道管理、上游转发 |
| Admin Console | 闭源 | 运营后台 |
| Customer Console | 闭源 | 客户控制台 |
| MySQL | 基础设施 | 事务性主数据与账务 |
| Redis | 基础设施 | 缓存、短期限流、并发控制、幂等态 |
| NATS JetStream | 基础设施 | 事件总线、异步结算、对账和审计事件 |
| Monitoring / Logging / Tracing | 基础设施 | 监控、日志、追踪 |
| Object Storage | 基础设施 | 发票、报表导出、审计归档、原始对账文件 |

### 2.2 服务之间调用关系

```text
Client
  -> Edge Gateway
     -> Auth / Identity
     -> Policy
     -> Risk
     -> Billing (预授权)
     -> Relay Orchestrator
        -> new-api
           -> Provider
     -> Billing (最终结算)
     -> NATS (usage / audit / risk / metrics events)

Customer Console
  -> Auth / Identity
  -> Billing
  -> Policy
  -> Audit Query API

Admin Console
  -> Auth / Identity
  -> Billing
  -> Risk
  -> Relay Orchestrator
  -> new-api admin
```

### 2.3 数据流

1. 客户请求走 `Edge Gateway`。
2. 网关同步调用 `Auth / Policy / Risk / Billing` 做前置判断。
3. 网关把通过校验的请求发给 `Relay Orchestrator`。
4. `Relay Orchestrator` 选择内部稳定 profile，再转发到 `new-api`。
5. `new-api` 按渠道调用上游。
6. 网关回流式结果给客户，同时异步记录 `usage_records / request_traces / audit_logs / risk_events`。
7. `Billing` 基于结束事件做最终结算和冲正。

### 2.4 为什么这样拆分

1. 商业护城河与 AGPL 部分隔离。
2. 计费、风控、策略可以独立迭代，不被网关兼容层约束。
3. `new-api` 可以被替换，而上层商业系统不受影响。
4. 每个服务职责清楚，便于招聘、运维和权限隔离。

---

## 第 3 部分：推荐技术栈

### 3.1 推荐版总表

| 模块 | 推荐栈 | 原因 |
|---|---|---|
| Edge Gateway | Go + Gin/Fiber + OpenTelemetry | 并发强、SSE/流式处理稳、团队常见 |
| Auth / Identity | Go + Gin + MySQL | 和网关同语言，事务与权限模型稳定 |
| Billing Service | Go + MySQL + Redis + NATS | 账务更适合强类型、低延迟、易维护 |
| Policy / Entitlement | Go + Redis + MySQL | 读多写少，适合缓存前置 |
| Risk Control | Go + Redis + NATS | 实时判定快，异步分析方便 |
| Relay / Orchestrator | Go | 路由、熔断、重试、流式代理适合 Go |
| Admin Console | Next.js + TypeScript + Tailwind + shadcn/ui | 招聘容易、后台开发效率高 |
| Customer Console | Next.js + TypeScript | SSR/CSR 混合、商业控制台成熟 |
| DB | MySQL 8.4 | 事务强、生态成熟、对账/账本友好 |
| Cache | Redis 7 | 限流、幂等、缓存、并发控制成熟 |
| MQ | NATS JetStream | 比 Kafka/RabbitMQ 更轻，适合 MVP 到中型 SaaS |
| Monitoring | Prometheus + Grafana + Loki + Tempo + OTel | 成熟、成本低、易部署 |
| Object Storage | S3 兼容对象存储 | 发票、对账单、导出报表归档 |

### 3.2 为什么 Gateway 选 Go，不选 Rust/Node

1. Rust 很强，但招聘和交付节奏不如 Go。
2. Node 做重流式代理和高吞吐治理时，长期稳定性与性能调优成本更高。
3. Go 在 API Gateway、SSE、HTTP/2、连接池、超时控制上是更稳妥平衡点。

### 3.3 为什么 Billing 也选 Go，不选 Python

1. 账务系统需要强一致、低延迟、明确类型。
2. Python 适合数据分析、离线 BI、对账脚本，但核心实时扣费不如 Go 稳妥。
3. 为了减少语言栈，核心在线服务尽量统一为 Go。

### 3.4 为什么 Console 选 Next.js

1. 招聘容易。
2. 生态成熟。
3. SSR、权限页面、控制台类系统都很合适。

### 3.5 为什么 DB 选 MySQL

1. 商业 SaaS 的主数据、账务、订阅、发票、审计都需要事务一致性。
2. MySQL 对订单、账本、审计表、分库分表路径都很成熟。
3. 相比 PostgreSQL，并不是能力差，而是这里优先考虑团队普及度和运维普及度。

### 3.6 为什么 MQ 选 NATS JetStream

1. 比 Kafka 更轻，单机到小集群部署更简单。
2. 比 RabbitMQ 更适合事件流和服务间异步解耦。
3. MVP 到中型商业化阶段足够，后续也能支撑审计、usage、risk、billing 异步管线。

---

## 第 4 部分：请求链路设计

### 4.1 请求主链路

```text
Client
  -> Edge Gateway
  -> Auth/Identity: validate_api_key()
  -> Policy: check_entitlement()
  -> Billing: preauthorize()
  -> Risk: realtime_check()
  -> Relay Orchestrator: select_route()
  -> new-api: relay_request()
  -> Provider: infer()
  <- stream chunks
  <- Edge Gateway streams back to Client
  -> Billing: finalize_settlement()
  -> NATS: usage_recorded / audit_logged / risk_observed
```

### 4.2 ASCII 时序图

```text
Client      Gateway      Auth      Policy    Billing    Risk     Relay     new-api   Provider
  |            |           |          |         |         |         |          |         |
  |--request-->|           |          |         |         |         |          |         |
  |            |--verify-->|          |         |         |         |          |         |
  |            |<--ok------|          |         |         |         |          |         |
  |            |----------->| check    |         |         |         |          |         |
  |            |<-----------| allow    |         |         |         |          |         |
  |            |--------------------->| preauth |         |         |          |         |
  |            |<---------------------| hold_ok |         |         |          |         |
  |            |------------------------------->| rt risk |         |          |         |
  |            |<-------------------------------| pass    |         |          |         |
  |            |------------------------------------------>| route   |          |         |
  |            |<------------------------------------------| target  |          |         |
  |            |--------------------------------------------------->| relay    |         |
  |            |---------------------------------------------------------------->| infer  |
  |            |<----------------------------------------------------------------| chunks |
  |<===========| stream back                                                      
  |            |--------------------->| finalize |
  |            |<---------------------| settled  |
  |            |----publish usage/audit/risk events------------------------------> NATS
```

### 4.3 预授权 vs 最终结算

预授权阶段：

1. 校验 key、组织、项目状态。
2. 校验套餐是否有权限使用目标模型。
3. 根据最大 tokens、模型单价、风险系数做“估算冻结”。
4. 若余额/信用额度不足，直接拒绝。

最终结算阶段：

1. 读取真实 usage。
2. 计算真实成本和售价。
3. 释放未用完的冻结金额。
4. 写入用量账本和余额账本。
5. 异步生成发票项、对账项、审计日志。

### 4.4 流式请求如何计费和补偿

1. 先按“最大可预估成本”冻结。
2. 流开始后持续记录 chunk 与 provider usage 信息。
3. 连接中断时分三类：
   - 上游未成功开始：全部释放冻结
   - 上游已开始但无最终 usage：按已知 usage 或保守兜底规则结算
   - 上游返回最终 usage：按最终 usage 结算并释放剩余冻结
4. 若 `new-api` 或上游失败但客户已收到部分流，则记为“部分成功”，走补偿规则而不是全额免单。

---

## 第 5 部分：数据库设计

主库建议：MySQL 8.4，统一 `utf8mb4`，主键优先 `BIGINT UNSIGNED` 或 `CHAR(26)` ULID。  
审计敏感表建议启用 `created_at/updated_at/deleted_at/version`。  
密钥类字段建议只存 `hash + prefix + encrypted_blob`，不存明文。

### 5.1 表设计总览

#### `users`

核心字段：

1. `id` PK
2. `email` UNIQUE
3. `phone` UNIQUE NULL
4. `password_hash`
5. `status`
6. `display_name`
7. `last_login_at`
8. `mfa_enabled`
9. `created_at`
10. `updated_at`

索引：

1. `uk_users_email`
2. `idx_users_status`

审计：

1. 登录方式、密码修改、MFA 开关必须审计

#### `organizations`

字段：

1. `id` PK
2. `name`
3. `slug` UNIQUE
4. `status`
5. `owner_user_id`
6. `billing_type` (`prepaid`/`subscription`/`invoice`)
7. `credit_limit`
8. `currency`
9. `created_at`
10. `updated_at`

索引：

1. `uk_org_slug`
2. `idx_org_owner_user_id`

#### `projects`

字段：

1. `id`
2. `organization_id`
3. `name`
4. `env` (`prod`/`test`)
5. `status`
6. `daily_cost_cap`
7. `monthly_cost_cap`
8. `created_at`
9. `updated_at`

索引：

1. `uk_org_project_name (organization_id, name)`
2. `idx_projects_status`

#### `api_keys`

字段：

1. `id`
2. `organization_id`
3. `project_id`
4. `name`
5. `key_prefix`
6. `key_hash`
7. `encrypted_secret_ref`
8. `status`
9. `scopes_json`
10. `last_used_at`
11. `expires_at`
12. `created_by`
13. `created_at`

索引：

1. `uk_api_keys_key_hash`
2. `idx_api_keys_org_project`
3. `idx_api_keys_status_expires`

加密/哈希：

1. `key_hash` 必须哈希
2. `encrypted_secret_ref` 如需重显仅存加密件或 KMS 引用

#### `subscriptions`

字段：

1. `id`
2. `organization_id`
3. `price_plan_id`
4. `status`
5. `billing_cycle` (`monthly`/`annual`/`invoice`)
6. `start_at`
7. `end_at`
8. `renewal_at`
9. `seat_count`
10. `included_quota`

索引：

1. `idx_subscriptions_org_status`
2. `idx_subscriptions_renewal_at`

#### `price_plans`

字段：

1. `id`
2. `code` UNIQUE
3. `name`
4. `plan_type` (`prepaid`/`subscription`/`enterprise`)
5. `base_fee`
6. `currency`
7. `included_credits`
8. `overage_enabled`
9. `is_active`
10. `rules_json`

索引：

1. `uk_price_plans_code`
2. `idx_price_plans_active`

#### `model_entitlements`

字段：

1. `id`
2. `organization_id`
3. `project_id` NULL
4. `external_model_name`
5. `policy_code`
6. `rpm_limit`
7. `tpm_limit`
8. `daily_cap`
9. `is_enabled`
10. `expires_at`

索引：

1. `uk_model_entitlements_scope (organization_id, project_id, external_model_name)`

#### `balance_ledger`

字段：

1. `id`
2. `organization_id`
3. `account_type` (`cash`/`credit`/`promo`/`hold`)
4. `direction` (`debit`/`credit`)
5. `amount`
6. `currency`
7. `reference_type`
8. `reference_id`
9. `request_id`
10. `idempotency_key`
11. `balance_after`
12. `remark`
13. `created_at`

索引：

1. `idx_balance_ledger_org_created_at`
2. `uk_balance_ledger_idempotency`
3. `idx_balance_ledger_request_id`

审计：

1. 该表必须不可物理删除

#### `usage_records`

字段：

1. `id`
2. `request_id` UNIQUE
3. `organization_id`
4. `project_id`
5. `api_key_id`
6. `external_model_name`
7. `internal_model_profile`
8. `provider_code`
9. `provider_model`
10. `input_tokens`
11. `output_tokens`
12. `cache_read_tokens`
13. `cache_write_tokens`
14. `billable_units`
15. `provider_cost`
16. `sale_amount`
17. `settlement_status`
18. `started_at`
19. `finished_at`
20. `trace_id`

索引：

1. `uk_usage_records_request_id`
2. `idx_usage_records_org_time`
3. `idx_usage_records_provider_time`
4. `idx_usage_records_trace_id`

#### `invoices`

字段：

1. `id`
2. `organization_id`
3. `invoice_no` UNIQUE
4. `status`
5. `billing_period_start`
6. `billing_period_end`
7. `subtotal`
8. `tax_amount`
9. `total_amount`
10. `currency`
11. `pdf_object_key`
12. `issued_at`
13. `paid_at`

#### `payment_orders`

字段：

1. `id`
2. `organization_id`
3. `order_no` UNIQUE
4. `channel`
5. `amount`
6. `currency`
7. `status`
8. `provider_txn_id`
9. `idempotency_key`
10. `created_at`
11. `paid_at`

#### `risk_events`

字段：

1. `id`
2. `organization_id`
3. `project_id`
4. `api_key_id`
5. `request_id`
6. `risk_type`
7. `risk_level`
8. `decision`
9. `reason_code`
10. `score`
11. `evidence_json`
12. `created_at`

索引：

1. `idx_risk_events_org_time`
2. `idx_risk_events_request_id`
3. `idx_risk_events_decision`

#### `audit_logs`

字段：

1. `id`
2. `actor_type`
3. `actor_id`
4. `organization_id`
5. `action`
6. `resource_type`
7. `resource_id`
8. `before_json`
9. `after_json`
10. `ip`
11. `user_agent`
12. `trace_id`
13. `created_at`

#### `provider_routes`

字段：

1. `id`
2. `external_model_name`
3. `internal_model_profile`
4. `provider_code`
5. `channel_code`
6. `provider_model`
7. `priority`
8. `weight`
9. `region`
10. `cost_per_input_1k`
11. `cost_per_output_1k`
12. `latency_slo_ms`
13. `is_active`
14. `tenant_scope`
15. `rules_json`

索引：

1. `idx_provider_routes_external_model`
2. `idx_provider_routes_profile_active`

#### `request_traces`

字段：

1. `id`
2. `request_id` UNIQUE
3. `trace_id`
4. `span_root_id`
5. `organization_id`
6. `project_id`
7. `api_key_id`
8. `edge_status_code`
9. `provider_status_code`
10. `route_snapshot_json`
11. `latency_ms`
12. `stream_duration_ms`
13. `error_code`
14. `error_message_masked`
15. `created_at`

### 5.2 哪些字段必须审计

1. 用户身份变更
2. 组织成员角色变更
3. API Key 创建/禁用/删除
4. 价格策略变更
5. 路由策略变更
6. 余额充值、扣费、冲正
7. 发票状态变化
8. 风控策略变更

### 5.3 哪些字段适合加密或哈希

1. `api_keys.key_hash`：哈希
2. 支付回调原文、税号、账单地址：加密
3. 上游供应商密钥：不进商业主库，放 KMS/Secrets Manager
4. 敏感证件或企业合规材料：对象存储 + KMS 加密

---

## 第 6 部分：计费系统设计

### 6.1 支持的计费模型

1. 预付费余额
2. 月度订阅套餐
3. 企业账期
4. 免费额度
5. 超额计费
6. 模型分级定价
7. 成本价与售价分离
8. 预估冻结 + 最终结算
9. 失败补偿
10. 退款 / 冲正

### 6.2 为什么采用双账本

双账本 = `余额账本 + 用量账本`

1. `usage_records` 记录“发生了什么使用”。
2. `balance_ledger` 记录“钱或额度如何变化”。
3. 二者分离后可以：
   - 对账
   - 追溯
   - 修复错账
   - 重放结算
   - 支持免费额度、促销金、信用额度并存

### 6.3 计费核心规则

1. 对外价格按稳定模型名配置，不按供应商名直接暴露。
2. 结算单位统一为“最小货币单位”或高精度 decimal。
3. 每次请求先做价格快照，后续不可回溯修改。
4. 套餐内免费额度先抵扣，再扣余额，再走信用额度。
5. 失败补偿必须通过账本冲正，不允许直接修改历史余额。

### 6.4 结算流程

1. 接到请求，生成 `request_id`。
2. 读取价格策略，估算最大金额 `preauth_amount`。
3. 写入 `balance_ledger` 一条 `hold` 冻结记录。
4. 请求结束后读取真实 usage。
5. 生成 `usage_records`。
6. 把 `hold` 转成实际扣费，多余部分释放。
7. 如果失败且应补偿，写入 `refund/reversal` 记录。

### 6.5 如何避免流式请求错账

1. 预冻结必须独立记录。
2. 每个流式请求全程一个 `request_id`。
3. chunk 级别只用于观测，不直接记账。
4. 最终结算优先使用 provider 真实 usage。
5. 如果拿不到真实 usage，采用“保守规则 + 可追补结算”。
6. 后台必须支持 `reconcile_settlement(request_id)` 重新结算。

---

## 第 7 部分：模型与供应商路由设计

### 7.1 设计原则

1. 对外只暴露稳定逻辑模型名。
2. 对内维护 `internal_model_profile`。
3. profile 再映射到多个供应商和渠道。
4. 路由由 `Relay Orchestrator` 决定，不让客户感知。

### 7.2 示例映射

| 对外模型名 | 内部 profile | 主路由 | 备路由 | 说明 |
|---|---|---|---|---|
| `chat-basic` | `chat_basic_v1` | ProviderA/gpt-4.1-mini | ProviderB/qwen-plus | 低成本、主打性价比 |
| `chat-pro` | `chat_pro_v1` | ProviderA/gpt-4.1 | ProviderB/claude-sonnet | 通用高质量 |
| `reasoning-pro` | `reasoning_pro_v1` | ProviderA/o4-mini-high | ProviderB/deepseek-r1 | 推理优先 |
| `vision-pro` | `vision_pro_v1` | ProviderA/gpt-4.1-vision | ProviderB/gemini-2.5-pro-vision | 图文理解 |
| `embedding-large` | `embedding_large_v1` | ProviderA/text-embedding-3-large | ProviderB/bge-m3 | 向量服务 |

### 7.3 路由策略

1. 主备路由：主路由失败后自动切备。
2. 熔断降级：某供应商错误率超阈值，暂时摘除。
3. 成本优化：在满足质量 SLO 的前提下优先低成本路由。
4. 区域优先：欧盟客户优先欧盟节点/供应商。
5. 企业专属：大客户可绑定专属渠道或私有 key 池。

---

## 第 8 部分：风控与限流设计

### 8.1 实时风控

实时风控由 `Gateway + Risk Service + Redis` 完成：

1. 单 key RPM/TPM
2. 单组织 RPM/TPM
3. 并发数限制
4. 单项目每日成本封顶
5. 异常来源 IP / 地区拦截
6. 泄露 key 紧急熔断
7. 高风险 prompt 模式计分

### 8.2 离线风控

离线风控由 `NATS + Risk Worker + MySQL` 完成：

1. 突增成本分析
2. 异常模型偏好
3. 多 IP 高频切换
4. 组织间疑似共用 key
5. 对账异常与坏账预警

### 8.3 Redis vs MySQL 的边界

Redis 负责：

1. 短期计数器
2. 实时并发控制
3. 临时黑名单
4. 幂等窗口

MySQL 负责：

1. 审计追踪
2. 风险事件归档
3. 封禁历史
4. 证据留存

---

## 第 9 部分：部署拓扑设计

### 9.1 MVP 单区部署版

公网：

1. `api.example.com`
2. `console.example.com`

实例建议：

1. Edge Gateway x2
2. Customer Console x2
3. Auth x1
4. Billing x1
5. Policy x1
6. Risk x1
7. Relay x1
8. new-api x1
9. Admin Console x1，仅内网或 VPN
10. MySQL x1
11. Redis x1
12. NATS x1

单点可接受：

1. Billing
2. Policy
3. Risk
4. Relay
5. new-api

必须保护的点：

1. MySQL 持久化
2. 对象存储备份

### 9.2 稳定生产版

1. Edge Gateway x3
2. Auth x2
3. Billing x2
4. Policy x2
5. Risk x2
6. Relay x2
7. new-api master x1 + slave x2
8. MySQL 主从或托管 HA
9. Redis 哨兵/托管 HA
10. NATS 3 节点

TLS 终止位置：

1. CDN/WAF 或云 LB
2. 内部 Ingress 可二次 TLS

仅内网访问：

1. new-api
2. MySQL
3. Redis
4. NATS
5. Admin Console

### 9.3 多区扩展版

1. Edge Gateway 多区部署
2. Console 前端多区静态/边缘
3. Billing 保持单主逻辑区，避免多主账务复杂度
4. Relay + new-api 按区域就近部署
5. 全局 DNS / GSLB 做区域流量调度

---

## 第 10 部分：仓库与代码组织设计

推荐：`multi-repo + shared proto/contracts`

### 10.1 仓库列表

1. `platform-gateway`：闭源，私有
2. `platform-billing`：闭源，私有
3. `platform-auth`：闭源，私有
4. `platform-policy`：闭源，私有
5. `platform-risk`：闭源，私有
6. `platform-relay`：闭源，私有
7. `platform-console`：闭源，私有
8. `platform-shared-contracts`：可私有，存 OpenAPI / protobuf / SDK 生成
9. `new-api-fork`：开源，公开

### 10.2 为什么不推荐把所有内容塞进一个 monorepo

1. 开源与闭源边界容易混。
2. 访问权限难切。
3. CI/CD 难按许可和环境分隔。

### 10.3 CI/CD 划分

1. `new-api-fork`：公开 CI，构建开源镜像，发布源码。
2. 闭源仓库：私有 CI，构建私有镜像，签名发布。
3. 基础设施仓库单独管理 Helm/Compose/Terraform。

---

## 第 11 部分：接口设计

推荐：对外 REST，内部 REST 为主，热点服务可增补 gRPC。  
原因：对外 API 要兼容 OpenAI 风格；内部先用 REST 更快落地、调试简单。

### 11.1 客户 API 调用接口

`POST /v1/chat/completions`

请求：

```json
{
  "model": "chat-pro",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true,
  "max_tokens": 512
}
```

响应：OpenAI 兼容

### 11.2 Billing 内部接口

`POST /internal/billing/preauthorize`

```json
{
  "request_id": "req_01J...",
  "organization_id": 1001,
  "project_id": 2001,
  "api_key_id": 3001,
  "model": "chat-pro",
  "max_tokens": 512,
  "price_snapshot_code": "chat-pro@2026-04-21",
  "idempotency_key": "idem_01J..."
}
```

```json
{
  "allowed": true,
  "hold_amount": "0.120000",
  "currency": "USD",
  "hold_id": "hold_01J..."
}
```

### 11.3 Policy 校验接口

`POST /internal/policy/check`

```json
{
  "organization_id": 1001,
  "project_id": 2001,
  "api_key_id": 3001,
  "model": "chat-pro",
  "region": "ap-southeast-1"
}
```

```json
{
  "allowed": true,
  "policy_code": "pro_default",
  "limits": {
    "rpm": 300,
    "tpm": 300000,
    "daily_cost_cap": "50.00"
  }
}
```

### 11.4 Relay 调用接口

`POST /internal/relay/dispatch`

```json
{
  "request_id": "req_01J...",
  "external_model_name": "chat-pro",
  "internal_profile": "chat_pro_v1",
  "messages": [...],
  "stream": true,
  "customer_context": {
    "organization_tier": "team",
    "region": "ap-southeast-1"
  }
}
```

### 11.5 用量上报接口

`POST /internal/usage/finalize`

```json
{
  "request_id": "req_01J...",
  "trace_id": "tr_01J...",
  "provider_code": "openai",
  "provider_model": "gpt-4.1",
  "input_tokens": 1234,
  "output_tokens": 321,
  "provider_cost": "0.0312",
  "stream_status": "completed"
}
```

### 11.6 对账接口

`POST /internal/billing/reconcile`

```json
{
  "provider_code": "openai",
  "billing_date": "2026-04-21",
  "source_object_key": "reconciliation/openai/2026-04-21.csv"
}
```

### 11.7 审计查询接口

`GET /internal/audit/logs?organization_id=1001&actor_id=5001&action=api_key.disable`

---

## 第 12 部分：核心流程伪代码

### 12.1 API Gateway 请求入口

```text
function handle_request(http_request):
    trace_id = ensure_trace_id(http_request)
    request_id = generate_request_id()
    api_key = extract_bearer_token(http_request)

    key_ctx = auth.validate_api_key(api_key)
    if not key_ctx.valid:
        return 401

    policy = policy_service.check(key_ctx, http_request.model)
    if not policy.allowed:
        return 403

    risk = risk_service.realtime_check(key_ctx, http_request, policy)
    if risk.blocked:
        return 429 or 403

    preauth = billing.preauthorize(request_id, key_ctx, http_request, policy)
    if not preauth.allowed:
        return 402 or 403

    route = relay.select_route(key_ctx, http_request, policy)
    if route.none:
        billing.release_hold(preauth.hold_id)
        return 503

    return stream_proxy(route, request_id, trace_id, preauth.hold_id)
```

### 12.2 余额预校验

```text
function preauthorize(request_id, ctx, req, policy):
    price = load_price_snapshot(ctx.org_id, req.model)
    estimate = estimate_max_charge(price, req.max_tokens, req.input_size)
    available = account.available_balance + account.available_credit + policy.free_quota
    if available < estimate:
        return denied
    hold = ledger.create_hold(request_id, estimate)
    return allowed(hold)
```

### 12.3 风控判断

```text
function realtime_check(ctx, req, policy):
    if redis.rpm_exceeded(ctx.api_key_id): block("rpm_exceeded")
    if redis.concurrent_exceeded(ctx.project_id): block("concurrency_exceeded")
    if cost_cap_exceeded(ctx.org_id): block("daily_cost_cap")
    if ip_blacklisted(req.ip): block("ip_blacklisted")
    score = score_request(req, ctx)
    if score >= threshold: block("risk_score_high")
    return pass
```

### 12.4 供应商路由

```text
function select_route(ctx, req, policy):
    candidates = route_repo.list_active(req.model, ctx.region, ctx.org_tier)
    candidates = filter_by_policy(candidates, policy)
    candidates = filter_out_circuit_open(candidates)
    candidates = sort_by(priority, region_match, estimated_cost, health_score)
    return first_available(candidates)
```

### 12.5 流式请求转发

```text
function stream_proxy(route, request_id, trace_id, hold_id):
    upstream = open_stream(route)
    usage_acc = new_usage_accumulator()
    try:
        for chunk in upstream:
            usage_acc.observe(chunk)
            write_chunk_to_client(chunk)
        final = upstream.final_usage()
        finalize_success(request_id, hold_id, final, usage_acc)
    except ClientDisconnect:
        finalize_partial(request_id, hold_id, usage_acc, reason="client_disconnect")
    except UpstreamError as e:
        finalize_failure_with_compensation(request_id, hold_id, usage_acc, e)
```

### 12.6 请求结束后的最终结算

```text
function finalize_success(request_id, hold_id, final_usage, usage_acc):
    usage = merge(usage_acc, final_usage)
    sale_amount = pricing.calculate(usage)
    provider_cost = pricing.calculate_provider_cost(usage)
    usage_repo.insert(request_id, usage, sale_amount, provider_cost)
    ledger.capture_from_hold(hold_id, sale_amount)
    ledger.release_remaining_hold(hold_id, sale_amount)
    publish_usage_and_audit_events(request_id)
```

### 12.7 失败补偿

```text
function finalize_failure_with_compensation(request_id, hold_id, usage_acc, err):
    if usage_acc.no_effective_usage():
        ledger.release_hold_full(hold_id)
        usage_repo.insert_failed(request_id, 0)
    else:
        estimated_bill = pricing.calculate_partial(usage_acc)
        ledger.capture_from_hold(hold_id, estimated_bill)
        ledger.release_remaining_hold(hold_id, estimated_bill)
        usage_repo.insert_partial(request_id, usage_acc, err)
    publish_failure_event(request_id, err)
```

### 12.8 幂等处理

```text
function with_idempotency(key, action):
    if redis.exists(key):
        return redis.get_result(key)
    lock = redis.acquire_lock(key)
    if not lock:
        return retry_or_conflict()
    result = action()
    redis.store_result(key, result, ttl=24h)
    return result
```

---

## 第 13 部分：监控、日志、追踪

### 13.1 Trace 设计

1. `Edge Gateway` 生成 `trace_id` 和 `request_id`。
2. 通过 `X-Trace-Id`、`X-Request-Id` 传递到所有内部服务。
3. `new-api` 前如果不能原生透传全部 span，也至少在网关和 relay 层维持根追踪。

### 13.2 Prometheus 指标

1. `gateway_requests_total`
2. `gateway_request_latency_ms`
3. `gateway_stream_duration_ms`
4. `billing_preauthorize_fail_total`
5. `billing_settlement_mismatch_total`
6. `policy_denied_total`
7. `risk_block_total`
8. `relay_route_failover_total`
9. `provider_error_rate`
10. `provider_cost_total`
11. `sale_revenue_total`
12. `gross_margin_ratio`

### 13.3 Grafana 面板

1. API 总量 / 错误率 / P95 延迟
2. 各模型收入 / 成本 / 毛利
3. 各供应商成功率 / 错误率 / 延迟
4. 组织用量排行
5. 风控拦截趋势
6. 账务冻结与冲正趋势

### 13.4 日志策略

不能落敏感数据：

1. 客户完整 API Key
2. 上游供应商密钥
3. 完整 prompt/response 默认全文
4. 支付敏感字段

默认只落：

1. `request_id`
2. `trace_id`
3. 模型
4. 组织 / 项目 / key_id
5. 延迟
6. usage
7. provider route
8. 脱敏错误码

---

## 第 14 部分：运维与安全

### 14.1 HTTPS / WAF / CDN

1. `api.example.com` 放 CDN/WAF 前面，开启 Bot、DDoS 和区域规则。
2. TLS 在 CDN 或云 LB 终止，内部服务网格可再启用 mTLS。

### 14.2 密钥管理

1. 上游 provider key 存 Secrets Manager / Vault / KMS，不存 Git。
2. 客户 API Key 只存哈希，明文只展示一次。
3. `new-api` 自身的渠道 key 不给客户见到。

### 14.3 数据库备份

1. MySQL 每日全量 + 每小时 binlog 或增量。
2. 发票、对账单、审计归档写对象存储。
3. 每月演练一次恢复。

### 14.4 日志脱敏

1. Prompt 默认不全文落库。
2. 若企业版需要审计开关，必须按租户、按协议开启。
3. 错误日志对外只给 `error_code + request_id`。

### 14.5 审计日志保留

建议：

1. 关键审计 180 天以上
2. 账务与发票 3-7 年，视地区合规要求
3. 热数据入 MySQL，冷数据归档对象存储

### 14.6 管理后台访问控制

1. Admin Console 不上公网，走 VPN / SSO / Bastion
2. `new-api` 管理面板只允许办公网段访问
3. 所有高危操作强制二次确认和审计

### 14.7 灾备建议

1. 同区双可用区优先
2. 账务主库优先做热备
3. 对象存储跨区复制

### 14.8 升级与回滚策略

1. 先升级闭源上层服务，再升级 `new-api`
2. `new-api` 升级必须先看 release notes 和变更字段
3. 新版 `Relay` 先灰度 5%
4. 账务服务升级必须支持幂等回放和版本兼容

### 14.9 new-api 开源部分源码发布建议

1. 使用独立公开仓库 `new-api-fork`
2. 所有对 `new-api` 的修改通过 PR 风格提交
3. 不在公开仓库出现任何闭源服务接口密钥、商业规则、客户数据

---

## 第 15 部分：开发优先级路线图

### 15.1 第 1 阶段：MVP

必须做：

1. Edge Gateway
2. Auth / Identity
3. Billing 最小版：预付费 + 冻结 + 结算
4. Policy 最小版：模型权限 + 限额
5. Relay Orchestrator
6. `new-api` 内部部署
7. Customer Console 最小版：项目、key、余额、用量

可延后：

1. 发票
2. 企业账期
3. 高级风控
4. BI 报表

最易踩坑：

1. 把客户 key 直接映射成 new-api key
2. 流式计费错账
3. 对外模型名和内部路由耦合

### 15.2 第 2 阶段：增强商业化版本

必须做：

1. 订阅套餐
2. 免费额度
3. 超额计费
4. 风控服务
5. 对账任务
6. 发票和订单
7. Admin Console

可延后：

1. 企业专属线路
2. 多区容灾

### 15.3 第 3 阶段：企业版增强

必须做：

1. 企业账期
2. 组织层级权限
3. 专属路由与区域隔离
4. 审计导出
5. 成本中心 / 项目核算

---

## 第 16 部分：最终交付清单

### 16.1 服务清单

1. Edge Gateway
2. Auth / Identity
3. Billing
4. Policy / Entitlement
5. Risk Control
6. Relay / Orchestrator
7. new-api
8. Customer Console
9. Admin Console
10. MySQL
11. Redis
12. NATS JetStream
13. Prometheus
14. Grafana
15. Loki
16. Tempo
17. Object Storage

### 16.2 数据表清单

1. users
2. organizations
3. projects
4. api_keys
5. subscriptions
6. price_plans
7. model_entitlements
8. balance_ledger
9. usage_records
10. invoices
11. payment_orders
12. risk_events
13. audit_logs
14. provider_routes
15. request_traces

### 16.3 API 清单

1. `/v1/chat/completions`
2. `/v1/embeddings`
3. `/internal/auth/validate-key`
4. `/internal/policy/check`
5. `/internal/billing/preauthorize`
6. `/internal/billing/finalize`
7. `/internal/risk/realtime-check`
8. `/internal/relay/dispatch`
9. `/internal/usage/finalize`
10. `/internal/audit/logs`

### 16.4 仓库清单

1. platform-gateway
2. platform-auth
3. platform-billing
4. platform-policy
5. platform-risk
6. platform-relay
7. platform-console
8. platform-shared-contracts
9. new-api-fork

### 16.5 环境变量清单

核心公共变量：

1. `APP_ENV`
2. `SERVICE_NAME`
3. `HTTP_PORT`
4. `MYSQL_DSN`
5. `REDIS_ADDR`
6. `REDIS_PASSWORD`
7. `NATS_URL`
8. `JWT_SIGNING_KEY`
9. `KMS_KEY_ID`
10. `OTEL_EXPORTER_OTLP_ENDPOINT`
11. `OBJECT_STORAGE_ENDPOINT`
12. `OBJECT_STORAGE_BUCKET`
13. `NEW_API_BASE_URL`
14. `NEW_API_INTERNAL_TOKEN`
15. `BILLING_PRICE_VERSION`
16. `RISK_RULESET_VERSION`

### 16.6 上线前检查清单

1. 客户不会直接访问 `new-api`
2. 客户 key 不等于 new-api key
3. 所有商业逻辑不在 `new-api-fork`
4. 预授权和最终结算已跑通
5. 流式失败补偿已测试
6. 风控拦截与白名单机制已测试
7. 对外模型名已稳定化
8. 审计日志已开启
9. 备份恢复已演练
10. `new-api` 开源仓库可单独发布

### 16.7 最容易踩坑的 20 个问题

1. 把用户体系写进 `new-api`
2. 把套餐和余额写进 `new-api`
3. 直接暴露 `new-api` 管理后台给客户
4. 客户 API Key 直接复用 `new-api` 原生 key
5. 不做冻结，直接事后扣费
6. 流式请求断流没有补偿规则
7. 成本价和售价混在一张表里没版本快照
8. 路由策略和价格策略强耦合
9. 请求没有全链路 `request_id`
10. 幂等处理缺失
11. 订单、账本、用量不分离
12. 审计日志可以被删除
13. 把完整 prompt 和 key 写日志
14. 风控只做离线不做实时
15. Redis 挂了就全局不可用，没有降级
16. Billing 改价后历史请求被重算
17. 上游失败没有 provider 级别熔断
18. 没有对账重放机制
19. 开源和闭源仓库混在一起
20. 想替换 `new-api` 时发现商业逻辑都耦合在里面

### 16.8 推荐先实现的 10 个接口

1. `POST /v1/chat/completions`
2. `POST /internal/auth/validate-key`
3. `POST /internal/policy/check`
4. `POST /internal/billing/preauthorize`
5. `POST /internal/billing/finalize`
6. `POST /internal/risk/realtime-check`
7. `POST /internal/relay/dispatch`
8. `POST /internal/usage/finalize`
9. `GET /console/projects`
10. `POST /console/api-keys`

### 16.9 推荐先落地的 10 张表

1. organizations
2. users
3. projects
4. api_keys
5. price_plans
6. model_entitlements
7. balance_ledger
8. usage_records
9. provider_routes
10. request_traces

### 16.10 按此方案开始编码的执行顺序

1. 先定义外部稳定模型名和内部 profile
2. 建 `Auth + Org + Project + API Key` 主数据
3. 建 `Price Plan + Entitlement`
4. 建 `Balance Ledger + Usage Records`
5. 开发 `Gateway` 请求入口
6. 开发 `Billing preauthorize/finalize`
7. 开发 `Relay Orchestrator`
8. 接入内部 `new-api`
9. 接入 `Customer Console`
10. 再做 `Risk`、`Invoice`、`Admin Console`

---

## 如果未来不再依赖 new-api，如何平滑替换

要点：从第一天就把 `new-api` 当成“可替换适配器”，不要当成商业系统内核。

### 替换前提

1. 对外 API 永远由 `Edge Gateway` 保持稳定。
2. 所有商业语义只存在于闭源层。
3. `Relay Orchestrator` 输出统一的 `Provider Adapter Contract`。

### 演进步骤

1. 在 `Relay Orchestrator` 后面增加新的 `provider-adapter` 实现。
2. 让一部分内部 profile 改走新 adapter，不再经过 `new-api`。
3. 保持 `request_id / trace_id / usage_record` 不变。
4. 对新旧 adapter 做双写观测或影子流量。
5. 当所有模型都能直连新 adapter 后，再下线 `new-api`。

### 为什么这样能平滑替换

1. 客户域名、客户 key、套餐、账务、风控都不依赖 `new-api`。
2. 你替换的只是“内部中转层”，不是“整个商业平台”。

---

## 参考事实依据

1. `QuantumNous/new-api` README 当前明确声明项目使用 `AGPL-3.0` 许可证，并说明若想避免 AGPL 义务可联系作者。
2. README 当前还展示了其内置的支付/计费能力，这正是商业护城河不应继续耦合进去的信号。
3. 官方集群部署文档当前明确说明多节点共享 `MySQL + Redis + SESSION_SECRET + CRYPTO_SECRET`，说明 `new-api` 适合作为内部中转层而不是外部商业核心。

