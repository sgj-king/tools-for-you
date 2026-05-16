"use client";

import { AlertTriangle, FileJson, KeyRound, LifeBuoy, Play, SearchCode, ShieldAlert, Workflow } from "lucide-react";
import { DocsCenter, type DocsFaq, type DocsQuickLink, type DocsSection } from "@/components/domain/docs-center";

const quickLinks: DocsQuickLink[] = [
  { title: "开发接入文档", description: "先确认接入方式、真实网关地址和模型调用示例。", href: "/docs/developer", icon: Workflow },
  { title: "请求日志", description: "按 trace_id 查询真实请求链路和错误详情。", href: "/console/request-logs", icon: SearchCode },
  { title: "Playground", description: "复现真实 SSE 请求、延迟与成本反馈。", href: "/console/playground", icon: Play },
  { title: "支持工单", description: "需要协助时提交工单并附上 trace_id。", href: "/console/support", icon: LifeBuoy }
];

const sections: DocsSection[] = [
  {
    id: "troubleshooting-overview",
    title: "1. 排障总览与建议顺序",
    summary: "建议按“健康检查 -> 鉴权 -> 模型权限 -> 余额与限流 -> relay/upstream -> trace_id 回查”的顺序定位问题，这样最省时间。",
    bullets: [
      "先验证 http://127.0.0.1:8088/healthz 和 /readyz，确认网关与依赖服务可用。",
      "再检查 Authorization 头、API Key 是否有效、Key 是否启用、是否过期。",
      "如果请求已经进入链路，务必保留 request_id 和 trace_id，后续可以在请求日志页精确查询。"
    ],
    links: [
      { title: "开发接入文档", description: "先核对真实联调方式。", href: "/docs/developer", icon: Workflow },
      { title: "请求日志", description: "按 trace_id 进入真实日志查询。", href: "/console/request-logs", icon: SearchCode }
    ],
    codeExamples: [
      {
        id: "troubleshooting-health",
        title: "第一步：健康检查",
        description: "如果这里就失败，优先处理服务启动、容器依赖或网络连通性。",
        snippets: {
          curl: `curl -sS http://127.0.0.1:8088/healthz\ncurl -sS http://127.0.0.1:8088/readyz\ncurl -sS http://127.0.0.1:8088/v1/info \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev"`,
          python: `import httpx\n\nfor path in ("/healthz", "/readyz"):\n    response = httpx.get(f"http://127.0.0.1:8088{path}", timeout=10.0)\n    print(path, response.status_code, response.text)\n\ninfo = httpx.get(\n    "http://127.0.0.1:8088/v1/info",\n    headers={"Authorization": "Bearer demo_live_sk_platform_dev"},\n    timeout=10.0,\n)\nprint("/v1/info", info.status_code, info.text)`,
          node: `for (const path of ["/healthz", "/readyz"]) {\n  const response = await fetch(\`http://127.0.0.1:8088\${path}\`);\n  console.log(path, response.status, await response.text());\n}\n\nconst info = await fetch("http://127.0.0.1:8088/v1/info", {\n  headers: { Authorization: "Bearer demo_live_sk_platform_dev" },\n});\nconsole.log("/v1/info", info.status, await info.text());`
        }
      }
    ]
  },
  {
    id: "auth-failures",
    title: "2. 鉴权失败排查",
    summary: "如果返回 401 或错误码与 Key 相关，优先检查 Bearer Token、Key 状态、Key 作用域和过期时间。",
    bullets: [
      "常见错误码包括 missing_bearer_token、missing_api_key、invalid_api_key、key_or_scope_disabled、api_key_expired。",
      "当前开发环境的示例 Key 是 demo_live_sk_platform_dev，如果它都失败，通常说明数据库种子、鉴权服务或请求头有问题。",
      "如果用户从 UI 创建了新 Key，也要确认该 Key 对应项目、组织和 scope 都处于 active 状态。"
    ],
    links: [
      { title: "API Key 管理", description: "核对 Key 状态、模型权限和限制。", href: "/console/api-keys", icon: KeyRound },
      { title: "开发接入文档", description: "对照真实请求头和示例代码。", href: "/docs/developer", icon: Workflow }
    ],
    codeExamples: [
      {
        id: "auth-debug",
        title: "鉴权失败时的最小复现请求",
        description: "建议保留 request_id 与 trace_id，方便后续在请求日志页检索。",
        snippets: {
          curl: `curl -sS http://127.0.0.1:8088/v1/chat/completions \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Request-Id: req-auth-debug-001" \\\n  -H "X-Trace-Id: trace-auth-debug-001" \\\n  -d '{\n    "model": "chat-pro",\n    "messages": [{"role": "user", "content": "请返回一条测试信息"}],\n    "stream": false\n  }'`,
          python: `import httpx\n\nresponse = httpx.post(\n    "http://127.0.0.1:8088/v1/chat/completions",\n    headers={\n        "Authorization": "Bearer demo_live_sk_platform_dev",\n        "Content-Type": "application/json",\n        "X-Request-Id": "req-auth-debug-001",\n        "X-Trace-Id": "trace-auth-debug-001",\n    },\n    json={\n        "model": "chat-pro",\n        "messages": [{"role": "user", "content": "请返回一条测试信息"}],\n        "stream": False,\n    },\n    timeout=20.0,\n)\nprint(response.status_code)\nprint(response.text)`,
          node: `const response = await fetch("http://127.0.0.1:8088/v1/chat/completions", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer demo_live_sk_platform_dev",\n    "Content-Type": "application/json",\n    "X-Request-Id": "req-auth-debug-001",\n    "X-Trace-Id": "trace-auth-debug-001",\n  },\n  body: JSON.stringify({\n    model: "chat-pro",\n    messages: [{ role: "user", content: "请返回一条测试信息" }],\n    stream: false,\n  }),\n});\n\nconsole.log(response.status, await response.text());`
        }
      }
    ]
  },
  {
    id: "policy-billing-rate-limit",
    title: "3. 模型权限、余额与限流排查",
    summary: "如果 Key 本身没问题，但请求仍被拒绝，通常是 model entitlement、route、余额或限流策略导致。",
    bullets: [
      "常见策略相关错误码包括 model_not_entitled、route_not_found、insufficient_balance。",
      "如果响应来自 new-api_error/model_not_found，通常说明 gateway -> relay -> new-api 链路已通，但 new-api 里没有可用的 provider/channel/model mapping。",
      "如果模型名写错、组织未开通该模型、provider route 未配置或被禁用，通常会命中 model_not_entitled 或 route_not_found。",
      "如果你看到 429、额度不足或预授权失败，优先检查余额、冻结金额、组织日成本上限、项目限流和 API Key 的 RPM/TPM 设置。"
    ],
    links: [
      { title: "模型目录", description: "核对逻辑模型名与当前组织权限。", href: "/console/models", icon: Workflow },
      { title: "计费中心", description: "核对余额、账单与冻结金额。", href: "/console/billing", icon: AlertTriangle }
    ],
    codeExamples: [
      {
        id: "policy-billing-check",
        title: "快速验证模型名和请求参数",
        description: "当前开发环境建议先用 chat-pro 做基线验证，再切换 reasoning-pro 或 vision-pro。",
        snippets: {
          curl: `curl -sS http://127.0.0.1:8088/v1/chat/completions \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Trace-Id: trace-policy-check-001" \\\n  -d '{\n    "model": "reasoning-pro",\n    "messages": [{"role": "user", "content": "请列出排障顺序"}],\n    "max_tokens": 128,\n    "stream": false\n  }'`,
          python: `allowed_models = ["chat-pro", "reasoning-pro", "vision-pro"]\nprint("当前开发环境可直接联调模型:", ", ".join(allowed_models))\nprint("embedding-large: 当前环境未开通上游模型")`,
          node: `const allowedModels = ["chat-pro", "reasoning-pro", "vision-pro"];\nconsole.log("当前开发环境可直接联调模型:", allowedModels.join(", "));\nconsole.log("embedding-large: 当前环境未开通上游模型");`
        }
      }
    ]
  },
  {
    id: "stream-relay-upstream",
    title: "4. 流式中断、relay 与上游错误排查",
    summary: "如果普通请求能通但流式请求异常中断，重点检查 SSE 消费方式、网关超时、relay 到 new-api 的链路和上游 provider/channel/model mapping。",
    bullets: [
      "常见错误码包括 relay_unreachable、empty_upstream_payload、streaming_unsupported、relay_stream_read_failed、new_api_error、model_not_found。",
      "如果 new-api 没配好 provider/channel/model mapping，网关可能返回真实上游错误，而不是标准 completion。",
      "你可以先用工作台 Playground 复现，再结合 trace_id、Webhook 投递详情和管理后台路由配置定位。"
    ],
    links: [
      { title: "Playground", description: "用真实 SSE 链路复现问题。", href: "/console/playground", icon: Play },
      { title: "管理后台说明", description: "需要管理员检查路由和渠道时使用。", href: "/admin/docs", icon: ShieldAlert }
    ]
  },
  {
    id: "trace-debugging",
    title: "5. trace_id 回查与支持协作",
    summary: "trace_id 是当前平台最重要的排查索引。它能把网关请求、请求日志、Webhook 投递和支持工单串成一条线。",
    bullets: [
      "调用时尽量主动传 X-Trace-Id；如果不传，也要从返回体中记录 trace_id。",
      "工作台请求日志页支持按 trace_id 真实查询，不只是跳转入口。",
      "提交支持工单时，建议附带 trace_id、request_id、模型名、请求时间和错误响应全文。"
    ],
    links: [
      { title: "请求日志", description: "按 trace_id 查询真实日志。", href: "/console/request-logs", icon: SearchCode },
      { title: "支持工单", description: "需要协助时附带 trace_id 提交。", href: "/console/support", icon: LifeBuoy }
    ],
    codeExamples: [
      {
        id: "trace-query",
        title: "按 trace_id 查询工作台请求日志",
        description: "浏览器直接打开这个地址即可复现当前 trace 的日志查询视图。",
        snippets: {
          curl: `curl -sS "http://127.0.0.1:3200/api/platform/request-logs?trace_id=trace-auth-debug-001"`,
          python: `import webbrowser\n\ntrace_id = "trace-auth-debug-001"\nwebbrowser.open(f"http://127.0.0.1:3200/console/request-logs?trace_id={trace_id}")`,
          node: `const traceId = "trace-auth-debug-001";\nconsole.log(\`在浏览器中打开: http://127.0.0.1:3200/console/request-logs?trace_id=\${traceId}\`);`
        }
      }
    ]
  }
];

const faqs: DocsFaq[] = [
  {
    question: "如果看到 missing_bearer_token，最先检查什么？",
    answer: "先检查请求里是否真的带了 Authorization: Bearer <key>，再确认代理层没有把这个头丢掉。"
  },
  {
    question: "如果看到 model_not_entitled 或 route_not_found，应该找谁处理？",
    answer: "先在工作台确认逻辑模型名是否正确、项目是否有访问权限；如果仍有问题，再让管理员检查 provider route、channel 和模型映射。"
  },
  {
    question: "如果看到 new_api_error 或 model_not_found，说明哪里有问题？",
    answer: "这通常说明请求已经打到 new-api，但当前模型没有可用渠道。优先检查 new-api 后台的 provider、channel、模型映射和分组设置。"
  },
  {
    question: "如果流式返回中途断掉但非流式正常，优先看哪里？",
    answer: "优先看客户端 SSE 消费逻辑、网关超时配置、relay 到 new-api 的连接状态，以及上游模型是否支持当前流式参数。"
  },
  {
    question: "为什么排障时一定要保留 trace_id？",
    answer: "因为 trace_id 可以直接关联请求日志、Playground、Webhook 投递和支持工单，是跨页面、跨服务的统一索引。"
  }
];

export function TroubleshootingDocsView() {
  return (
    <DocsCenter
      badgeLabel="排障专题"
      title="彗星科技常见错误码与排障手册"
      intro="本专题页围绕当前开发环境和已落地的真实链路编写，重点覆盖常见错误码、鉴权失败、模型权限、限流、流式中断和 trace_id 回查。建议和开发接入文档、工作台说明一起阅读。"
      tips={[
        "先从健康检查开始，不要一上来就看应用层错误码。",
        "每次复现问题时都保留 request_id 和 trace_id，后续排查会快很多。",
        "如果你已经能在 Playground 复现，就优先用同一个 trace_id 去请求日志页和支持工单串联排查。"
      ]}
      quickLinks={quickLinks}
      sections={sections}
      faqs={faqs}
      primaryAction={{ href: "/console/request-logs", label: "按 trace_id 查日志" }}
      secondaryAction={{ href: "/docs/developer", label: "返回开发接入文档" }}
      printTitle="彗星科技常见错误码与排障手册"
    />
  );
}
