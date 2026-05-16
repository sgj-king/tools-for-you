"use client";

import { BellRing, BookOpenText, CreditCard, FileSearch, KeyRound, LayoutDashboard, Play, Settings2, Shield, Sparkles, Users, Webhook } from "lucide-react";
import { DocsCenter, type DocsQuickLink, type DocsSection } from "@/components/domain/docs-center";

const quickStartLinks: DocsQuickLink[] = [
  { title: "总览 Dashboard", description: "查看调用量、余额、成本、错误率与默认筛选快捷入口。", href: "/console", icon: LayoutDashboard },
  { title: "API Key 管理", description: "创建项目密钥并限制模型、RPM、TPM、过期时间与 IP 白名单。", href: "/console/api-keys", icon: KeyRound },
  { title: "模型目录", description: "浏览对外模型能力、价格信息、访问权限和推荐使用方式。", href: "/console/models", icon: BookOpenText },
  { title: "Playground", description: "直接通过真实网关链路验证模型流式响应、成本和 latency。", href: "/console/playground", icon: Play },
  { title: "请求日志", description: "按 trace_id、状态、模型、项目、Key 与时间范围排查问题。", href: "/console/request-logs", icon: FileSearch },
  { title: "计费中心", description: "查看余额、账单、充值、订阅与发票。", href: "/console/billing", icon: CreditCard }
];

const documentSections: DocsSection[] = [
  {
    id: "overview",
    title: "1. 平台定位与使用边界",
    summary: "工作台面向客户与组织成员，提供业务使用、权限控制、计费观察与问题排查能力，不直接暴露 new-api 管理面板。",
    bullets: [
      "工作台只调用当前项目自己的闭源后端服务，不直接调用 new-api。",
      "你看到的模型、Key、账单、请求日志和团队成员，都是围绕组织 / 项目维度组织的，不是运维侧原始渠道界面。",
      "如果你是普通成员，主要使用工作台；如果你是平台管理员，才进入管理后台处理全局路由、定价和风控。"
    ],
    links: [{ title: "返回总览", description: "从总览页进入各模块。", href: "/console", icon: LayoutDashboard }]
  },
  {
    id: "start",
    title: "2. 首次使用推荐路径",
    summary: "这部分参考 new-api 文档里的“先配置后验证”思路，但重构成更适合商业开发者平台的路径。",
    bullets: [
      "先进入“项目设置”确认项目名称、环境标识和回调配置，再创建首个 API Key。",
      "在“模型目录”确认当前组织可访问的逻辑模型名，例如 chat-fast、chat-pro、reasoning、vision、embedding。",
      "进入 Playground 发起一次真实流式请求，确认模型可用、延迟可接受、成本反馈正常。",
      "最后在“请求日志”和“计费中心”核对 trace_id、用量、预估消费与最终账单是否一致。"
    ],
    links: [
      { title: "项目设置", description: "配置项目基本信息与回调。", href: "/console/project-settings", icon: Settings2 },
      { title: "Playground", description: "验证真实模型流式响应。", href: "/console/playground", icon: Play }
    ]
  },
  {
    id: "keys-models",
    title: "3. API Key 与模型目录",
    summary: "这两个模块是工作台的核心入口，分别解决“谁可以调用”和“可以调用什么”。",
    bullets: [
      "API Key 管理支持创建、查看、复制一次性明文、禁用、限制可访问模型、限制 RPM/TPM、设置过期时间与 IP 白名单。",
      "模型目录页用于查看模型简介、能力标签、上下文规模、计费口径、支持的能力和访问限制。",
      "模型详情页会进一步展示推荐场景、价格摘要、请求参数建议、兼容说明和示例调用方式。"
    ],
    links: [
      { title: "API Keys", description: "管理项目级密钥。", href: "/console/api-keys", icon: KeyRound },
      { title: "模型目录", description: "查看组织可访问模型。", href: "/console/models", icon: BookOpenText }
    ]
  },
  {
    id: "playground",
    title: "4. Playground 与真实流式验证",
    summary: "Playground 不只是演示页，它直接走 gateway -> relay -> new-api -> 上游模型 的真实链路。",
    bullets: [
      "支持选择模型、配置 temperature / max tokens / system prompt，并维护消息历史。",
      "响应采用真实 SSE 流式输出，可同时显示增量内容、累计 token、预估成本和 latency。",
      "当请求失败时，可在页面内看到错误提示，再用 trace_id 跳转到请求日志做精确排查。"
    ],
    links: [{ title: "Playground", description: "做真实联调和成本观察。", href: "/console/playground", icon: Sparkles }]
  },
  {
    id: "usage-observe",
    title: "5. 用量、请求日志与高级筛选",
    summary: "这一组页面用于从开发者视角和运营视角观察调用行为，适合日常巡检与问题定位。",
    bullets: [
      "用量分析支持按日期范围、模型、项目、API Key、状态、供应商等维度筛选，并支持保存 Preset、生成分享链接、恢复默认筛选。",
      "请求日志页支持按 trace_id 做真实查询联动，同时可查看模型、项目、Key、token、cost、重试情况和缓存命中。",
      "筛选器支持服务端持久化 Preset、团队共享、设为默认、导入导出 JSON 和首页快捷入口。"
    ],
    links: [
      { title: "用量分析", description: "看趋势、筛选和 Preset。", href: "/console/usage", icon: LayoutDashboard },
      { title: "请求日志", description: "围绕 trace_id 做问题排查。", href: "/console/request-logs", icon: FileSearch }
    ]
  },
  {
    id: "billing",
    title: "6. 计费、账单、充值、订阅与发票",
    summary: "计费中心围绕余额、消费趋势、对账与财务协作展开，适合长期运营。",
    bullets: [
      "计费总览页展示当前余额、冻结金额、今日预估消费和月度趋势。",
      "账单页支持分页、筛选、金额区间、状态过滤、导出和详情查看。",
      "充值页用于选择充值包或发起充值流程；订阅页用于查看套餐权益、升级路径和超额计费说明；发票页用于查看开票状态和下载。"
    ],
    links: [
      { title: "计费总览", description: "查看余额与消费趋势。", href: "/console/billing", icon: CreditCard },
      { title: "账单", description: "对账与导出。", href: "/console/bills", icon: CreditCard },
      { title: "发票", description: "查看发票与开票状态。", href: "/console/invoices", icon: FileSearch }
    ]
  },
  {
    id: "collaboration",
    title: "7. 团队、项目、安全与 Webhook",
    summary: "这一组页面用于组织协作、配置治理和自动化通知。",
    bullets: [
      "团队页支持成员查看、邀请、角色编辑与权限边界控制。",
      "项目设置页用于维护项目基础信息、环境、回调与业务标签；安全设置页用于配置密码策略、MFA、IP 约束和密钥轮换相关选项。",
      "Webhook 页支持创建、测试、历史投递列表、投递详情与 trace 联动。"
    ],
    links: [
      { title: "团队", description: "管理成员与角色。", href: "/console/team", icon: Users },
      { title: "项目设置", description: "维护项目配置。", href: "/console/project-settings", icon: Settings2 },
      { title: "安全设置", description: "管理账号与访问安全。", href: "/console/security", icon: Shield },
      { title: "Webhook", description: "管理事件回调和投递历史。", href: "/console/webhooks", icon: Webhook }
    ]
  },
  {
    id: "support",
    title: "8. 工单支持与常见排查入口",
    summary: "当你在调用中遇到异常时，建议优先使用 trace_id、日志、Webhook 投递详情和支持工单联动排查。",
    bullets: [
      "支持工单页可查看工单列表、详情、回复记录和处理状态。",
      "如果模型请求超时，先去 Playground 和请求日志复现，再提交工单并附带 trace_id、模型名、时间范围和错误信息。",
      "如果是计费相关争议，建议同时附上账单编号、发票编号、项目名与请求范围，便于客服和财务快速定位。"
    ],
    links: [{ title: "支持工单", description: "提交和跟踪问题。", href: "/console/support", icon: BellRing }]
  }
];

const faqItems = [
  {
    question: "为什么工作台里看不到 new-api 的渠道与 provider 配置？",
    answer: "因为工作台面向客户使用场景，渠道、provider 和模型映射属于内部网关层与管理后台职责。这样可以保持商业边界清晰，也避免客户接触内部实现细节。"
  },
  {
    question: "为什么创建 API Key 后只显示一次明文？",
    answer: "这是为了降低密钥泄露风险。关闭弹窗后只保留 masked prefix，需要你自行保存到安全位置。"
  },
  {
    question: "什么时候应该用筛选 Preset？",
    answer: "当你经常按同一组日期、模型、项目、状态或金额条件查看数据时，建议保存成 Preset，并根据团队协作需要设为个人默认或团队共享默认。"
  },
  {
    question: "trace_id 有什么作用？",
    answer: "trace_id 是串联 Playground、请求日志、Webhook 投递、支持工单与后端链路的核心索引。遇到问题时，优先保留它。"
  }
];

export function ConsoleDocsView() {
  return (
    <DocsCenter
      badgeLabel="工作台说明"
      title="彗星科技工作台使用说明"
      intro="本说明文档基于当前工作台已落地的功能编写，整体组织方式参考 new-api 文档强调“先理解能力边界，再按功能路径操作”的写法，但内容完全围绕彗星科技现有 Console 的信息架构、交互流程和页面风格重构，适合作为客户侧正式说明入口。"
      tips={[
        "Desktop 主方案建议保留左侧导航 + 顶部说明入口 + 主内容双栏阅读。",
        "Tablet 兼容建议将目录吸附区保持为顶部可见或侧边抽屉，正文保持单列，提高滚动阅读效率。",
        "如果你是首次接入，建议先读“首次使用推荐路径”和“Playground 与真实流式验证”。"
      ]}
      quickLinks={quickStartLinks}
      sections={documentSections}
      faqs={faqItems}
      primaryAction={{ href: "/console/playground", label: "立即验证模型" }}
      secondaryAction={{ href: "/console/request-logs", label: "查看请求日志" }}
      printTitle="彗星科技工作台使用说明"
    />
  );
}
