# Platform Console

保存路径：`/home/sgj/projects/NewAPI/platform/apps/platform-console/README.md`

## 说明

这是面向商业 AI API 平台的 Next.js App Router 前端骨架，目标是承载：

1. `工作台`
2. `管理后台`
3. `Marketing / Docs Entry`

## 已落地内容

1. 完整信息架构与页面规格文档：
   [AI_PLATFORM_FRONTEND_SPEC.zh-CN.md](/home/sgj/projects/NewAPI/platform/docs/AI_PLATFORM_FRONTEND_SPEC.zh-CN.md)
2. Next.js `App Router` 骨架
3. Tailwind 设计 token 与双主题
4. Query Provider / Theme Provider
5. Mock 数据与 API SDK 示例
6. Dashboard / API Keys / Billing / Usage / Playground / Admin 页面骨架
7. 超过 10 个核心组件实现
8. 已接入现有 `docker-compose` 开发环境，服务名为 `platform-console`
9. 第二版页面能力已补上：`创建 API Key 弹窗 / 请求详情抽屉 / Team / Webhook / SSE Playground`
10. 第三版已补上：`真实 gateway/relay Playground 代理 / 团队邀请 / Webhook 创建与测试 / trace_id 跳转 / 路由守卫`
11. 第四版已补上：`团队角色编辑 / Webhook 最近投递详情 / Playground 成本与 latency 展示 / Usage 高级筛选器`

## 目录

```text
platform-console/
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
└── modules/
```

## 开发模式

### docker-compose

当前已接入：

```bash
cd /home/sgj/projects/NewAPI/platform
./scripts/dev-up.sh
```

默认访问：

```bash
http://127.0.0.1:3200
http://127.0.0.1:3200/console
http://127.0.0.1:3200/admin
```

### mock

```bash
cp .env.example .env.local
```

保持：

```bash
NEXT_PUBLIC_ENABLE_MOCK=true
NEXT_PUBLIC_APP_ENV=mock
```

### staging / production

将：

```bash
NEXT_PUBLIC_ENABLE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

## 计划中的下一步

1. 用真实 `authApi / usageApi / billingApi / adminRoutingApi` 替换 mock 数据
2. 接入 `react-hook-form + zod` 的完整弹窗表单
3. 为请求日志详情抽屉、发票页、团队页、Webhook 页补充生产组件
4. 增加 `SSE` Playground 流式输出
5. 将 Usage 高级筛选器与真实后端查询参数打通
