"use client";

import { AlertTriangle, BookOpenText, DollarSign, FileSearch, LayoutDashboard, Route, ShieldAlert, Users } from "lucide-react";
import { DocsCenter, type DocsQuickLink, type DocsSection } from "@/components/domain/docs-center";

const quickLinks: DocsQuickLink[] = [
  { title: "管理总览", description: "查看平台健康度、组织规模、收入成本与异常概览。", href: "/admin", icon: LayoutDashboard },
  { title: "用户管理", description: "处理用户状态、角色、MFA 与最近活跃情况。", href: "/admin/users", icon: Users },
  { title: "组织管理", description: "查看组织套餐、状态、月消费和项目规模。", href: "/admin/organizations", icon: BookOpenText },
  { title: "路由配置", description: "管理模型映射、供应商路由、主备策略和健康状态。", href: "/admin/routing", icon: Route },
  { title: "定价规则", description: "维护对外售价、成本价、倍率和套餐映射。", href: "/admin/pricing", icon: DollarSign },
  { title: "风控事件", description: "追踪异常调用、额度风险和封禁处理。", href: "/admin/risk", icon: ShieldAlert }
];

const sections: DocsSection[] = [
  {
    id: "admin-overview",
    title: "1. 管理后台定位",
    summary: "管理后台只面向平台管理员、运维与财务角色，用于处理全局策略和平台层治理，不面向普通客户。",
    bullets: [
      "这里的操作会影响全局用户、组织、模型路由、定价与风控策略，因此必须限制为管理员角色访问。",
      "客户工作台强调项目级操作，而管理后台强调平台级运营、审核和异常处理。",
      "建议将管理后台与工作台在权限、域名和登录分流上持续保持隔离。"
    ],
    links: [{ title: "管理总览", description: "从平台级总览进入各运营模块。", href: "/admin", icon: LayoutDashboard }]
  },
  {
    id: "admin-users-orgs",
    title: "2. 用户与组织治理",
    summary: "这一组页面用于平台管理员处理用户、组织与权限生命周期。",
    bullets: [
      "用户管理页可查看账号状态、组织归属、MFA 启用情况与最近活跃时间。",
      "组织管理页可查看套餐、成员规模、项目数量、月消费与组织状态。",
      "建议在处理封禁、角色变更或组织异常时，同时保留审计日志与支持工单链路。"
    ],
    links: [
      { title: "用户管理", description: "处理账号和平台角色。", href: "/admin/users", icon: Users },
      { title: "组织管理", description: "处理组织状态和套餐。", href: "/admin/organizations", icon: BookOpenText }
    ]
  },
  {
    id: "admin-routing-pricing",
    title: "3. 路由与定价策略",
    summary: "这部分是平台商业能力的核心运维面，直接关系到成本、成功率与可售卖性。",
    bullets: [
      "路由配置页用于查看模型到供应商的映射、主备策略、健康状态、成功率和成本表现。",
      "定价规则页用于维护逻辑模型的售价、成本价、倍率、套餐权益与超额计费规则。",
      "调整路由或定价前，建议先在低风险组织或 staging 环境观察一轮指标，再做全量生效。"
    ],
    links: [
      { title: "路由配置", description: "管理供应商映射与主备。", href: "/admin/routing", icon: Route },
      { title: "定价规则", description: "维护售价和套餐。", href: "/admin/pricing", icon: DollarSign }
    ]
  },
  {
    id: "admin-risk-audit",
    title: "4. 风控与审计",
    summary: "这一组页面用于异常发现、处理闭环和事后追责。",
    bullets: [
      "风控事件页可查看风险等级、状态、时间和摘要，用于跟进高频异常调用、地域异常和成本超阈值事件。",
      "审计日志页用于保留关键管理动作，例如角色变更、组织状态修改、定价规则调整与路由策略更新。",
      "建议对高风险操作建立双人复核和变更记录制度，并在审计中保留操作人和时间。"
    ],
    links: [
      { title: "风控事件", description: "查看平台级异常。", href: "/admin/risk", icon: ShieldAlert },
      { title: "审计日志", description: "回看关键管理动作。", href: "/admin/audit", icon: FileSearch }
    ]
  },
  {
    id: "admin-guidelines",
    title: "5. 日常运营建议",
    summary: "这一节给出更偏运维和值班的使用建议，便于团队形成固定操作路径。",
    bullets: [
      "先看管理总览，再看风控和路由健康，最后处理用户与组织层反馈，可以缩短定位时间。",
      "出现大面积投诉时，优先比对路由变更、上游供应商异常、价格变更和风控策略是否同时发生。",
      "涉及封禁、调价或切换主备路线时，建议先记录原因，并同步支持团队更新对外口径。"
    ],
    links: [{ title: "返回管理总览", description: "回到平台级总览页。", href: "/admin", icon: LayoutDashboard }]
  }
];

const faqs = [
  {
    question: "为什么客户看不到这些页面？",
    answer: "因为这些页面涉及平台内部运营、定价、成本和风控信息，必须与客户工作台隔离，避免泄露平台治理能力和商业策略。"
  },
  {
    question: "调整路由策略时最需要关注什么？",
    answer: "优先关注成功率、latency、成本变化和是否影响关键大客户，再决定是否扩大生效范围。"
  },
  {
    question: "什么操作必须留审计记录？",
    answer: "组织状态变更、平台角色调整、定价修改、路由切换、风控处置和任何会影响收入或稳定性的动作都应审计。"
  },
  {
    question: "导出 PDF 有什么用？",
    answer: "适合做内部值班交接、培训资料、变更审批附件和运营 SOP 留档。"
  }
];

export function AdminDocsView() {
  return (
    <DocsCenter
      badgeLabel="管理后台说明"
      title="彗星科技管理后台使用说明"
      intro="本说明文档面向平台管理员、运维、财务和风控角色，重点解释管理后台的职责边界、常用页面、日常运营路径与审计要求。内容组织方式延续当前控制台风格，并针对平台运营场景补足了路由、定价、风控和审计的说明。"
      tips={[
        "Desktop 主方案建议保留左侧管理导航 + 顶部说明入口 + 主内容双栏阅读。",
        "Tablet 建议优先展示目录与搜索，再切换到正文，减少在运营场景下的来回跳转。",
        "如果你是第一次接手平台运营，建议先读“管理后台定位”“路由与定价策略”“风控与审计”。"
      ]}
      quickLinks={quickLinks}
      sections={sections}
      faqs={faqs}
      primaryAction={{ href: "/admin/routing", label: "查看路由配置" }}
      secondaryAction={{ href: "/admin/risk", label: "查看风控事件" }}
      printTitle="彗星科技管理后台使用说明"
    />
  );
}
