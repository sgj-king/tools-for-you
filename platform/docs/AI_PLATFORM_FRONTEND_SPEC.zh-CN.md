# AI API 商业平台前端规格

保存路径：`/home/sgj/projects/NewAPI/platform/docs/AI_PLATFORM_FRONTEND_SPEC.zh-CN.md`

## 1. 产品信息架构

### 1.1 产品定位

这套前端是一个双控制台商业开发者平台：

1. `Customer Console`
   面向客户组织、项目管理员、财务与开发者，负责接入、用量、计费、团队协作与安全控制。
2. `Admin Console`
   面向平台运营、风控、财务、运维与超管，负责用户、组织、路由、定价、审计与全局经营分析。
3. `Marketing / Docs Entry`
   面向潜在客户与开发者，负责产品介绍、文档入口、SDK 入口、状态页与支持入口。

### 1.2 Customer Console 与 Admin Console 边界

`Customer Console` 只暴露客户自己的资产与可授权范围：

1. 组织、项目、成员、API Key、模型权限
2. Playground、请求日志、用量、成本、账单、充值、发票
3. Webhook、通知、安全、项目设置、支持工单

`Admin Console` 只暴露平台内部运营与系统能力：

1. 用户、组织、项目、工单、公告、风控
2. 模型目录编排、供应商路由、渠道健康、定价、套餐
3. 账务核对、利润分析、审计日志、Feature Flags

### 1.3 完整 IA

```text
Platform
├── Public
│   ├── 首页
│   ├── 文档入口
│   ├── SDK 下载
│   ├── 状态页
│   ├── 登录
│   └── 注册
├── Customer Console
│   ├── 总览
│   ├── 开发
│   │   ├── API Keys
│   │   ├── 模型目录
│   │   ├── Playground
│   │   ├── 请求日志
│   │   └── Webhook
│   ├── 分析
│   │   ├── Usage
│   │   ├── 成本分析
│   │   ├── 缓存计费
│   │   └── 错误与重试
│   ├── 计费
│   │   ├── 余额与充值
│   │   ├── 订阅与套餐
│   │   ├── 账单
│   │   └── 发票
│   ├── 协作
│   │   ├── 团队成员
│   │   ├── 角色权限
│   │   ├── 项目设置
│   │   └── 通知设置
│   ├── 安全
│   │   ├── 登录安全
│   │   ├── MFA
│   │   ├── IP 白名单
│   │   └── 限流设置
│   └── 支持
│       ├── 工单
│       ├── 系统公告
│       └── 文档入口
└── Admin Console
    ├── 经营总览
    ├── 用户与组织
    │   ├── 用户管理
    │   ├── 组织管理
    │   ├── 项目管理
    │   └── Key 管理
    ├── 模型与路由
    │   ├── 模型映射
    │   ├── 路由策略
    │   ├── 渠道健康
    │   └── 供应商成本
    ├── 商业配置
    │   ├── 定价规则
    │   ├── 套餐管理
    │   ├── 充值订单
    │   └── 发票核对
    ├── 风控与审计
    │   ├── 风控事件
    │   ├── 审计日志
    │   ├── 封禁与申诉
    │   └── Feature Flags
    └── 支持与公告
        ├── 工单处理
        ├── 系统公告
        └── 运维通知
```

### 1.4 导航结构

一级导航：

1. `总览`
2. `开发`
3. `分析`
4. `计费`
5. `协作`
6. `安全`
7. `支持`
8. `管理后台`

二级导航：

1. 开发：`API Keys / 模型目录 / Playground / 请求日志 / Webhook`
2. 分析：`Usage / 成本分析 / 缓存计费 / 错误与重试`
3. 计费：`余额与充值 / 套餐 / 账单 / 发票`
4. 协作：`团队 / 角色权限 / 项目设置 / 通知`
5. 安全：`登录安全 / MFA / IP 白名单 / 限流设置`
6. 管理后台：`用户 / 组织 / 路由 / 定价 / 风控 / 审计`

面包屑逻辑：

1. 一级导航作为第一层
2. 二级导航作为第二层
3. 详情页附带实体名作为第三层
4. 抽屉页不进入 URL 层级，只显示 `返回列表 / trace_id`

客户可见页面：

1. Public 全部页面
2. Customer Console 全部页面
3. 文档、SDK、状态页

内部管理员可见页面：

1. Admin Console 全部页面
2. 审计、路由、定价、风控、利润看板

### 1.5 Desktop / Tablet

Desktop 主方案：

1. 左侧固定侧栏 + 顶部全局栏 + 主内容区
2. 详情信息用双栏或三栏卡片布局
3. Playground 用双面板布局

Tablet 兼容建议：

1. 侧栏折叠为 `sheet`
2. 表格列数降级，次要列收纳到行展开
3. Analytics 与 Billing 图表改为单列栈式

## 2. 设计系统

### 2.1 视觉方向

参考 `modern-style.css`，设计语言定义为：

1. 暖中性背景，不走冷白科技模板
2. 青绿色作为品牌强调色，不使用高饱和霓虹
3. 字体采用开发者友好的 Sans + 有辨识度的 Display Serif
4. 使用柔和纹理背景与低对比网格提升层次感

### 2.2 颜色体系

Light tokens：

```text
bg.canvas = #f6f2ea
bg.subtle = #f1ece3
bg.surface = #ffffff
bg.surfaceAlt = #fbf9f4
fg.primary = #1f2a2d
fg.secondary = #5f6a65
fg.tertiary = #8b958f
border.default = #e5ded4
brand.primary = #1e8b77
brand.strong = #0f6f5c
brand.soft = rgba(30,139,119,0.10)
success = #2d8f5f
warning = #c7862f
danger = #c75146
info = #3572c9
```

Dark tokens：

```text
bg.canvas = #121514
bg.subtle = #151b19
bg.surface = #1a211f
bg.surfaceAlt = #161c1a
fg.primary = #e7f1ed
fg.secondary = #a2b3ad
fg.tertiary = #7d8c87
border.default = #27312f
brand.primary = #35c9a0
brand.strong = #27a982
brand.soft = rgba(53,201,160,0.12)
success = #41c783
warning = #e6a74d
danger = #ef6b60
info = #67a2ff
```

图表配色：

1. 主调用量：`brand.primary`
2. 成本：`#4f6bed`
3. 收入：`#c7862f`
4. 缓存命中：`#7a56d6`
5. 错误率：`danger`
6. 重试成功：`success`
7. 供应商对比：`#1e8b77 / #4f6bed / #d97706 / #7c3aed / #dc2626`

### 2.3 字体与层级

1. Sans：`IBM Plex Sans`
2. Display：`Fraunces`
3. Mono：`IBM Plex Mono`

字号层级：

1. `display-1` 36/44
2. `display-2` 30/38
3. `heading-1` 24/32
4. `heading-2` 20/28
5. `heading-3` 18/26
6. `body-lg` 16/26
7. `body` 14/22
8. `caption` 12/18
9. `micro` 11/16

### 2.4 空间、圆角、阴影、边框

1. 间距基线：`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48`
2. 圆角：`10 / 14 / 18 / 24`
3. 阴影：`card / soft / floating`
4. 边框：`1px solid border.default`

### 2.5 组件规范

Table：

1. 默认行高 52
2. 头部吸附
3. 支持搜索、筛选、排序、分页、批量操作
4. Tablet 下次要列收纳进行展开

Modal / Drawer：

1. 创建类用 `Modal`
2. 查看详情用 `Drawer`
3. 危险操作二次确认
4. 成功使用 toast，敏感结果使用 result panel

Empty / Error / Skeleton：

1. Empty 需要给下一步建议
2. Error 需要支持重试
3. Skeleton 按真实布局占位，不用纯灰条

Status Pill：

1. `active / disabled / expired / low_balance / healthy / degraded / blocked`
2. 使用图标 + 颜色 + 文案三重表达

### 2.6 Tailwind / shadcn 映射

Tailwind token 建议：

1. `background`, `foreground`, `card`, `card-foreground`
2. `primary`, `primary-foreground`
3. `muted`, `muted-foreground`
4. `accent`, `accent-foreground`
5. `warning`, `danger`, `success`
6. `ring`, `border`, `input`

shadcn/ui 二次封装建议：

1. `AppCard`
2. `AppDataTable`
3. `AppMetricCard`
4. `AppFilterBar`
5. `AppDrawer`
6. `AppEmptyState`
7. `AppStatusBadge`

## 3. 页面清单

以下页面默认：

1. 支持搜索、筛选、排序、分页、批量操作（如适用）
2. 所有文案预留 i18n key
3. 所有表单弹窗包含校验、权限、成功、错误反馈

### 3.1 登录页

1. 页面目的：用户登录，进入角色对应控制台
2. 关键模块：品牌区、登录表单、SSO/MFA 入口、状态页入口
3. 可视化组件：安全提示卡、信任设备提示
4. 对接接口：`authApi.login`、`authApi.startMfaChallenge`
5. 空状态：首次邀请用户说明
6. 加载状态：表单按钮 loading
7. 错误状态：错误横幅 + 字段级提示
8. 权限：游客可见
9. Desktop：左右分栏品牌与表单
10. Tablet：品牌区折叠到顶部

### 3.2 注册页

1. 页面目的：创建组织与管理员账号
2. 关键模块：账号信息、组织信息、协议确认、邀请码
3. 可视化组件：权益预览卡、套餐说明卡
4. 对接接口：`authApi.register`
5. 空状态：邀请注册说明
6. 加载状态：步骤表单 skeleton
7. 错误状态：邮箱已占用、邀请码错误
8. 权限：游客可见
9. Desktop：双列注册步骤
10. Tablet：单列步骤

### 3.3 总览 Dashboard

1. 页面目的：查看业务健康、成本、错误率、余额与热点模型
2. 目标用户：成员、项目管理员、组织管理员、财务
3. KPI：今日调用量、成功率、余额、成本、缓存命中、活跃 Key
4. 主要模块：KPI 区、调用趋势、成本结构、模型排行、异常提示、余额卡
5. 数据接口：`usageApi.getOverview`、`billingApi.getSummary`、`modelApi.getTopModels`
6. 可视化：面积图、堆叠柱图、排行表、事件流
7. 空状态：引导创建第一个 Key 与 Playground
8. 加载：KPI skeleton + 图表 skeleton
9. 错误：局部卡片级错误
10. 权限：登录用户
11. Desktop：12 栅格
12. Tablet：KPI 2 列 + 图表单列

### 3.4 API Keys 列表页

1. 页面目的：管理项目级调用凭证
2. 关键模块：筛选栏、表格、批量禁用、创建按钮、风险提示
3. 可视化组件：状态 badge、复制统计、最后使用时间 heat hint
4. 接口：`apiKeyApi.list`、`apiKeyApi.batchUpdateStatus`
5. 空状态：创建第一个 Key
6. 加载：表格 skeleton
7. 错误：错误横幅 + 重试
8. 权限：项目管理员以上
9. Desktop：左筛选右表格
10. Tablet：筛选折叠

### 3.5 创建 API Key 弹窗

1. 页面目的：生成受限 Key
2. 关键模块：名称、项目、模型权限、RPM/TPM、过期时间、IP 白名单、备注
3. 可视化组件：Copy Secret Field、风险提示、权限标签
4. 接口：`apiKeyApi.create`
5. 空状态：无项目时提示先创建项目
6. 加载：提交按钮 loading
7. 错误：字段校验 + 接口错误 toast
8. 权限：项目管理员以上
9. Desktop：双列字段
10. Tablet：单列字段

### 3.6 模型目录页

1. 页面目的：查看平台对外稳定模型名与能力
2. 模块：能力筛选、价格/权限标签、模型卡列表
3. 可视化：Model Capability Card、能力 badge、上下文窗口标签
4. 接口：`modelApi.listCatalog`
5. 空状态：无授权模型
6. 加载：卡片 skeleton
7. 错误：全页错误
8. 权限：登录用户
9. Desktop：卡片网格 + 左侧筛选
10. Tablet：顶部筛选抽屉

### 3.7 模型详情页

1. 页面目的：查看模型能力、价格、可访问项目、示例代码
2. 模块：头部摘要、能力、限额、定价、示例、变更日志
3. 可视化：能力矩阵、价格卡、代码 tabs
4. 接口：`modelApi.getDetail`
5. 空状态：下线模型说明
6. 加载：头部 skeleton
7. 错误：404 / 无权限
8. 权限：登录用户且有模型目录权限
9. Desktop：主内容 + 右侧信息栏
10. Tablet：信息栏下沉

### 3.8 Playground 页

1. 页面目的：快速验证模型与参数
2. 模块：模型选择、参数面板、system prompt、消息历史、流式响应、token/cost 反馈
3. 可视化：左右双面板、流式消息气泡、成本 footer、错误提示条
4. 接口：`playgroundApi.runChat`
5. 空状态：示例 prompt 模板
6. 加载：发送中状态、streaming cursor
7. 错误：局部错误卡 + 请求详情链接
8. 权限：有模型调用权限
9. Desktop：聊天区 7 / 参数区 5
10. Tablet：参数区折叠到 sheet

### 3.9 Usage 总览页

1. 页面目的：查看调用量、成本与质量指标
2. 模块：筛选栏、趋势图、分组占比、状态分布、缓存命中
3. 可视化：趋势图、模型分布、状态 donut、供应商对比
4. 接口：`usageApi.getTrends`、`usageApi.getBreakdown`
5. 筛选维度：时间、项目、Key、模型、状态、供应商、区域
6. 权限：登录用户

### 3.10 请求日志页

1. 页面目的：定位失败请求、审查成本、追踪 trace_id
2. 模块：搜索筛选、日志表、批量导出、详情抽屉
3. 可视化：Request Log Table、状态 badge、trace pill
4. 接口：`usageApi.listRequestLogs`
5. 筛选维度：trace_id、request_id、项目、key、模型、状态、缓存命中、重试状态、时间
6. 权限：项目管理员以上

### 3.11 请求详情抽屉

1. 页面目的：查看单次请求完整诊断信息
2. 模块：摘要、入参与出参、token、成本、重试链路、路由 profile、provider 响应
3. 可视化：JSON Viewer、timeline、cost summary
4. 接口：`usageApi.getRequestDetail`
5. 权限：项目管理员以上

### 3.12 Billing 总览页

1. 页面目的：展示余额、消费、套餐权益与发票状态
2. 模块：余额卡、今日预估、本月趋势、套餐权益、发票提醒
3. 可视化：Billing Summary Card、月度消费趋势图、计划权益卡
4. 接口：`billingApi.getSummary`、`subscriptionApi.getCurrentPlan`
5. 权限：财务角色或组织管理员

### 3.13 Top-up 页

1. 页面目的：充值余额与支付状态跟踪
2. 模块：充值金额、支付方式、历史订单、充值须知
3. 对接：`billingApi.createTopUpOrder`、`billingApi.listTopUps`
4. 权限：财务角色

### 3.14 订阅与套餐页

1. 页面目的：查看并切换套餐
2. 模块：套餐对比、当前计划、权益明细、升级建议
3. 对接：`subscriptionApi.listPlans`、`subscriptionApi.changePlan`
4. 权限：财务角色、组织管理员

### 3.15 账单页

1. 页面目的：查看月度出账与核对
2. 模块：账单列表、状态、金额、下载
3. 对接：`billingApi.listBills`
4. 权限：财务角色

### 3.16 发票页

1. 页面目的：申请发票、查看开票状态
2. 模块：抬头信息、申请记录、状态追踪
3. 对接：`invoiceApi.list`、`invoiceApi.create`
4. 权限：财务角色

### 3.17 Team 管理页

1. 页面目的：管理成员与角色
2. 模块：成员列表、邀请、角色编辑、项目范围
3. 对接：`teamApi.listMembers`、`teamApi.invite`
4. 权限：组织管理员

### 3.18 项目设置页

1. 页面目的：维护项目元数据与默认策略
2. 模块：项目资料、默认模型策略、默认限流、默认通知
3. 对接：`projectApi.getDetail`、`projectApi.update`
4. 权限：项目管理员

### 3.19 安全设置页

1. 页面目的：账号与组织级安全控制
2. 模块：密码、MFA、会话、IP 白名单、登录历史
3. 对接：`authApi.getSecurityProfile`、`authApi.updateMfa`
4. 权限：登录用户 / 组织管理员

### 3.20 Webhook 设置页

1. 页面目的：订阅余额、账单、风险、请求失败通知
2. 模块：Webhook 列表、签名密钥、事件选择、重试策略
3. 对接：`webhookApi.list`、`webhookApi.create`
4. 权限：项目管理员以上

### 3.21 支持与工单页

1. 页面目的：提交与跟踪支持请求
2. 模块：工单列表、详情、附件、状态、优先级
3. 对接：`supportApi.listTickets`、`supportApi.createTicket`
4. 权限：登录用户

### 3.22 Admin 总览页

1. 页面目的：全局收入、成本、错误率、风控事件与供应商健康
2. 模块：经营看板、系统健康、风险摘要、工单待办
3. 对接：`adminUserApi.getAdminOverview`、`adminRoutingApi.getHealthSummary`
4. 权限：平台超管 / 运维 / 财务

### 3.23 用户管理页

1. 页面目的：管理用户账号、状态与支持动作
2. 模块：用户表、搜索、封禁、重置 MFA、账务视角
3. 对接：`adminUserApi.listUsers`
4. 权限：平台超管

### 3.24 组织管理页

1. 页面目的：管理组织生命周期与账务风险
2. 模块：组织表、余额、套餐、风险、操作记录
3. 对接：`adminUserApi.listOrganizations`
4. 权限：平台超管 / 财务

### 3.25 模型映射与路由页

1. 页面目的：管理对外模型名与内部 provider routes
2. 模块：模型映射表、主备策略、成本与成功率、渠道健康
3. 对接：`adminRoutingApi.listRoutes`
4. 权限：运维管理员 / 平台超管

### 3.26 定价规则页

1. 页面目的：配置售价、成本快照、组织特价
2. 模块：价格列表、规则编辑、利润率展示
3. 对接：`adminPricingApi.listRules`
4. 权限：财务 / 平台超管

### 3.27 风控事件页

1. 页面目的：处理异常调用、Key 泄露、地区异常
2. 模块：事件流、筛选、封禁、申诉、备注
3. 对接：`adminRiskApi.listEvents`
4. 权限：风控 / 平台超管

### 3.28 审计日志页

1. 页面目的：查看管理动作与敏感变更
2. 模块：审计表、筛选、详情、导出
3. 对接：`auditApi.listLogs`
4. 权限：平台超管 / 审计角色

## 4. 关键交互

### 4.1 创建 API Key

字段：

1. `name`
2. `projectId`
3. `allowedModels`
4. `rpmLimit`
5. `tpmLimit`
6. `expiresAt`
7. `ipAllowlist`
8. `notes`

交互规则：

1. `name` 必填，2 到 64 字符
2. 模型至少选择 1 个，或显式勾选继承项目默认策略
3. `rpm/tpm` 低于项目上限
4. 成功后只展示一次明文 key，并提供复制与下载
5. 关闭弹窗后只能看到 masked key

### 4.2 Playground

1. 左侧聊天，右侧参数面板
2. 顶部模型选择与项目上下文
3. 支持 `streaming / retry / clear`
4. Footer 展示 `input_tokens / output_tokens / estimated_cost / latency`
5. 错误时展示 `error_code + trace_id + 查看请求日志`

### 4.3 Billing

1. 顶部三张关键卡：当前余额、今日预估、本月已出账
2. 中部：月度消费趋势 + 计划权益
3. 右栏：低余额预警、超额提醒、待处理发票

### 4.4 Usage Analytics

筛选维度：

1. 时间粒度：小时 / 天 / 周 / 月
2. 项目
3. API Key
4. 模型
5. 状态
6. 上游供应商
7. 路由 profile
8. 缓存命中
9. 地区

### 4.5 Request Logs

1. 顶部全局搜索支持 `trace_id / request_id / key prefix`
2. 筛选支持：模型、项目、状态、缓存、重试、时间
3. 行点击打开详情抽屉
4. `trace_id` 可复制并跳转相关日志

### 4.6 Admin Routing

1. 左侧为模型映射表
2. 右侧为路由健康卡与成本成功率对比
3. 支持主备策略、权重、区域优先、专属组织策略

## 5. API 对接设计

统一 REST 规范：

1. 列表：`GET /v1/{resource}`
2. 详情：`GET /v1/{resource}/{id}`
3. 创建：`POST /v1/{resource}`
4. 更新：`PATCH /v1/{resource}/{id}`
5. 删除或禁用：`DELETE` 或动作型 `POST /actions`

统一响应：

```ts
type ApiResponse<T> = {
  data: T;
  meta?: {
    requestId: string;
    traceId?: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
```

模块清单：

1. `authApi`
   路由：`/v1/auth/login` `/v1/auth/register` `/v1/auth/me` `/v1/auth/security`
2. `orgApi`
   路由：`/v1/orgs` `/v1/orgs/{orgId}`
3. `projectApi`
   路由：`/v1/projects` `/v1/projects/{projectId}`
4. `apiKeyApi`
   路由：`/v1/api-keys` `/v1/api-keys/{id}` `/v1/api-keys/{id}/rotate`
5. `modelApi`
   路由：`/v1/models` `/v1/models/{modelId}`
6. `playgroundApi`
   路由：`/v1/playground/chat`
7. `usageApi`
   路由：`/v1/usage/overview` `/v1/usage/trends` `/v1/request-logs`
8. `billingApi`
   路由：`/v1/billing/summary` `/v1/top-ups`
9. `subscriptionApi`
   路由：`/v1/subscriptions/current` `/v1/subscriptions/plans`
10. `invoiceApi`
    路由：`/v1/invoices`
11. `teamApi`
    路由：`/v1/team/members`
12. `webhookApi`
    路由：`/v1/webhooks`
13. `supportApi`
    路由：`/v1/support/tickets`
14. `adminUserApi`
    路由：`/v1/admin/users` `/v1/admin/orgs` `/v1/admin/overview`
15. `adminRoutingApi`
    路由：`/v1/admin/routing/routes` `/v1/admin/routing/health`
16. `adminPricingApi`
    路由：`/v1/admin/pricing/rules`
17. `adminRiskApi`
    路由：`/v1/admin/risk/events`
18. `auditApi`
    路由：`/v1/admin/audit-logs`

React Query hooks 建议：

1. 读：`useOverviewQuery`, `useApiKeysQuery`
2. 写：`useCreateApiKeyMutation`, `useCreateTopUpMutation`
3. 详情：`useRequestLogDetailQuery(traceId)`
4. Admin：`useRoutingOverviewQuery`, `useRiskEventsQuery`

## 6. 业务字段映射

统一字段命名：

1. 前端实体 ID 使用 `camelCase`，接口传输按后端约定保留 `camelCase`
2. 金额统一 `amountUsd`, `balanceUsd`, `frozenAmountUsd`
3. token 使用 `inputTokens`, `outputTokens`, `totalTokens`
4. 状态统一 `status`, `riskStatus`, `invoiceStatus`, `retryStatus`

核心映射：

1. API Key 状态：`active | disabled | expired | blocked`
2. 模型权限：`allowedModels[]`
3. 余额：`balanceUsd`
4. 冻结金额：`frozenAmountUsd`
5. 实际消费：`actualCostUsd`
6. 预估消费：`estimatedCostUsd`
7. 请求状态：`requestStatus`
8. 重试状态：`retryStatus`
9. 缓存命中：`cacheHit`
10. 缓存计费：`cacheBilledUsd`
11. 上游供应商：`providerCode`
12. 路由 profile：`routeProfileCode`
13. 风控状态：`riskStatus`
14. 发票状态：`invoiceStatus`
15. 组织权限：`orgRole`

## 7. 项目结构

```text
apps/platform-console/
├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── services/
├── store/
├── types/
├── styles/
├── config/
├── providers/
├── layouts/
├── modules/
│   ├── admin/
│   ├── console/
│   └── shared/
└── public/
```

职责说明：

1. `app/` 页面级路由
2. `features/` 业务用例组合
3. `modules/` 跨页面业务模块
4. `components/` 基础与领域组件
5. `services/` API SDK
6. `store/` 轻状态
7. `providers/` Query / Theme / I18n
8. `lib/` 工具函数

## 8. 权限与路由守卫

角色：

1. `guest`
2. `member`
3. `project_admin`
4. `org_admin`
5. `finance`
6. `platform_super_admin`
7. `ops_admin`

路由守卫：

1. `/login` `/register` 仅游客
2. `/console/*` 登录必需
3. `/console/billing/*` 仅 `finance | org_admin`
4. `/admin/*` 仅 `platform_super_admin | ops_admin | finance`

菜单显示：

1. 按角色过滤一级菜单
2. 按 feature flag 过滤二级菜单
3. 按资源权限控制按钮

按钮级权限：

1. 创建 Key：`project_admin`
2. 充值：`finance`
3. 调整定价：`platform_super_admin`
4. 封禁组织：`platform_super_admin`

Feature Flag：

1. `playground_streaming_v2`
2. `workflow_templates`
3. `enterprise_invoicing`
4. `admin_route_experiments`

## 9. 组件清单

P0：

1. `KpiStatCard`
2. `UsageTrendChart`
3. `CostBreakdownChart`
4. `APIKeyTable`
5. `BillingSummaryCard`
6. `RequestLogTable`
7. `StatusBadge`
8. `CopySecretField`
9. `PlaygroundChatPanel`
10. `ParameterConfigPanel`

P1：

1. `PlanComparisonCard`
2. `ProviderHealthWidget`
3. `RiskEventTimeline`
4. `EmptyStateBlock`
5. `ConfirmActionModal`
6. `JsonViewer`
7. `CodeSnippetTabs`
8. `ModelCapabilityCard`

## 10. 联调方案

模式：

1. `mock`
   使用本地 mock 数据和 `/api/mock/*`
2. `staging`
   对接预发布服务
3. `production`
   对接正式域名

环境变量：

1. `NEXT_PUBLIC_APP_ENV`
2. `NEXT_PUBLIC_API_BASE_URL`
3. `NEXT_PUBLIC_ENABLE_MOCK`
4. `NEXT_PUBLIC_DOCS_URL`
5. `NEXT_PUBLIC_STATUS_URL`

Token 注入：

1. 浏览器端使用 HttpOnly session cookie
2. SSR 请求通过 server action 或 route handler 透传 session
3. Playground streaming 通过短期 access token 或 session header

## 11. 性能与体验优化

1. Dashboard 首屏做 SSR，图表做客户端懒加载
2. 大表格使用虚拟滚动
3. 高频筛选列表使用 URL state
4. Playground 流式输出使用 `SSE`
5. 详情抽屉按需请求
6. Mutation 使用乐观更新，失败回滚
7. 提供错误边界与分区级 fallback
8. 所有操作提供键盘可访问性

## 12. 上线前检查清单

1. 设计 token 与组件状态一致
2. 菜单与路由权限一致
3. 空状态、错误状态、骨架状态完整
4. Tablet 断点体验可用
5. 敏感信息不在日志或 URL 中泄露
6. trace_id、request_id、orgId、projectId 埋点一致
7. 文案与 i18n key 对齐
8. 所有图表筛选维度与后端字段一致

