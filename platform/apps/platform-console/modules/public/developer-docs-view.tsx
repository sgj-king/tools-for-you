"use client";

import { Activity, BookOpenText, Code2, FileJson, KeyRound, ShieldCheck, Workflow } from "lucide-react";
import { DocsCenter, type DocsFaq, type DocsQuickLink, type DocsSection } from "@/components/domain/docs-center";

const quickLinks: DocsQuickLink[] = [
  { title: "登录页", description: "进入平台并获取工作台、管理后台与文档入口。", href: "/login", icon: BookOpenText },
  { title: "工作台说明", description: "了解客户侧主要功能和操作流程。", href: "/console/docs", icon: Workflow },
  { title: "管理后台说明", description: "了解平台管理员的职责边界与运营路径。", href: "/admin/docs", icon: ShieldCheck },
  { title: "Playground", description: "用真实流式链路做请求验证和调试。", href: "/console/playground", icon: Activity },
  { title: "排障专题", description: "按错误码、鉴权失败、限流和 trace_id 定位问题。", href: "/docs/troubleshooting", icon: FileJson }
];

const sections: DocsSection[] = [
  {
    id: "dev-overview",
    title: "1. 接入概览",
    summary: "开发接入文档面向平台接入方、内部开发者和对接工程师，说明如何从平台获取 Key、使用统一域名并按 OpenAI 风格发起请求。",
    bullets: [
      "客户端统一请求你的商业网关，不直接访问 new-api 或原始上游供应商。",
      "建议先在工作台创建项目级 API Key，再通过 Playground 验证模型可用性。",
      "接入时优先使用逻辑模型名，而不是依赖底层供应商真实模型名。"
    ],
    links: [{ title: "工作台说明", description: "先了解工作台的 Key 和模型管理能力。", href: "/console/docs", icon: Workflow }]
  },
  {
    id: "dev-auth",
    title: "2. 鉴权与请求头",
    summary: "当前开发环境默认采用 Bearer Token 风格鉴权，客户端只需要保存自己的平台 API Key，不直接暴露上游供应商密钥。",
    bullets: [
      "推荐请求头格式为 Authorization: Bearer <YOUR_PLATFORM_API_KEY>。",
      "不要把上游供应商 Key 暴露给客户端，也不要把 new-api 原生 token 发给最终用户。",
      "当前开发环境可直接联调的示例 Key 为 demo_live_sk_platform_dev；如果你的项目启用了 IP 白名单、RPM/TPM 或组织策略，鉴权失败时应先检查工作台中的 Key 配置。"
    ],
    links: [{ title: "API Key 管理", description: "查看 Key 的创建与权限说明。", href: "/console/api-keys", icon: KeyRound }],
    codeExamples: [
      {
        id: "auth-headers",
        title: "鉴权请求头示例",
        description: "以下示例全部使用当前开发环境真实联调地址，可直接复制运行。",
        snippets: {
          curl: `export COMET_DEV_GATEWAY_URL="http://127.0.0.1:8088"\nexport COMET_DEV_API_KEY="demo_live_sk_platform_dev"\n\ncurl -sS "$COMET_DEV_GATEWAY_URL/v1/info" \\\n  -H "Authorization: Bearer $COMET_DEV_API_KEY" \\\n  -H "Content-Type: application/json"`,
          python: `import httpx\nimport os\n\ngateway_url = os.getenv("COMET_DEV_GATEWAY_URL", "http://127.0.0.1:8088")\napi_key = os.getenv("COMET_DEV_API_KEY", "demo_live_sk_platform_dev")\n\nresponse = httpx.get(\n    f"{gateway_url}/v1/info",\n    headers={\n        "Authorization": f"Bearer {api_key}",\n        "Content-Type": "application/json",\n    },\n    timeout=10.0,\n)\nresponse.raise_for_status()\nprint(response.json())`,
          node: `const gatewayUrl = process.env.COMET_DEV_GATEWAY_URL ?? "http://127.0.0.1:8088";\nconst apiKey = process.env.COMET_DEV_API_KEY ?? "demo_live_sk_platform_dev";\n\nconst response = await fetch(\`\${gatewayUrl}/v1/info\`, {\n  headers: {\n    Authorization: \`Bearer \${apiKey}\`,\n    "Content-Type": "application/json",\n  },\n});\n\nif (!response.ok) throw new Error(\`Gateway info failed: \${response.status}\`);\nconsole.log(await response.json());`
        }
      }
    ]
  },
  {
    id: "dev-endpoints",
    title: "3. 常用接口与模型调用方式",
    summary: "当前开发环境已打通 OpenAI 风格聊天补全链路，支持逻辑模型名、请求头透传和真实 SSE 流式输出。",
    bullets: [
      "当前开发环境统一网关地址为 http://127.0.0.1:8088，请通过 /v1/chat/completions 发起聊天请求。",
      "当前开发环境可直接联调的逻辑模型为 chat-pro、reasoning-pro、vision-pro；embedding-large 在该 Groq key 下尚未开通。",
      "如果使用流式输出，请开启 stream=true，并按 SSE 方式逐步消费响应片段。",
      "如果 new-api 尚未配置可用的 provider/channel/model mapping，聊天请求会返回 new_api_error 或 model_not_found，这时请直接跳转到排障专题继续处理。"
    ],
    links: [
      { title: "模型目录", description: "查看当前组织可访问的逻辑模型。", href: "/console/models", icon: BookOpenText },
      { title: "Playground", description: "验证流式请求与成本反馈。", href: "/console/playground", icon: Activity },
      { title: "排障专题", description: "遇到错误码或 trace_id 问题时快速定位。", href: "/docs/troubleshooting", icon: FileJson }
    ],
    codeExamples: [
      {
        id: "gateway-health",
        title: "健康检查与网关信息",
        description: "联调前建议先确认网关和依赖服务都是可用状态。",
        snippets: {
          curl: `curl -sS http://127.0.0.1:8088/healthz\ncurl -sS http://127.0.0.1:8088/readyz\ncurl -sS http://127.0.0.1:8088/v1/info \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev"`,
          python: `import httpx\n\nbase_url = "http://127.0.0.1:8088"\napi_key = "demo_live_sk_platform_dev"\n\nfor path in ("/healthz", "/readyz", "/v1/info"):\n    response = httpx.get(\n        f"{base_url}{path}",\n        headers={"Authorization": f"Bearer {api_key}"} if path == "/v1/info" else {},\n        timeout=10.0,\n    )\n    print(path, response.status_code, response.text)`,
          node: `const baseUrl = "http://127.0.0.1:8088";\nconst apiKey = "demo_live_sk_platform_dev";\n\nfor (const path of ["/healthz", "/readyz", "/v1/info"]) {\n  const response = await fetch(\`\${baseUrl}\${path}\`, {\n    headers: path === "/v1/info" ? { Authorization: \`Bearer \${apiKey}\` } : {},\n  });\n  console.log(path, response.status, await response.text());\n}`
        }
      },
      {
        id: "chat-completions",
        title: "聊天补全调用示例",
        description: "使用逻辑模型名发起标准聊天请求，客户端不需要感知底层供应商；若当前环境尚未完成 new-api 渠道映射，响应会返回真实的 model_not_found 作为排障入口。",
        snippets: {
          curl: `curl -sS http://127.0.0.1:8088/v1/chat/completions \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Request-Id: req-docs-demo-001" \\\n  -H "X-Trace-Id: trace-docs-demo-001" \\\n  -H "Idempotency-Key: idem-docs-demo-001" \\\n  -d '{\n    "model": "chat-pro",\n    "messages": [\n      {"role": "system", "content": "你是彗星科技平台的联调助手。"},\n      {"role": "user", "content": "请用两句话确认当前开发环境的网关链路可用。"}\n    ],\n    "temperature": 0.3,\n    "max_tokens": 160,\n    "stream": false\n  }'`,
          python: `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="http://127.0.0.1:8088/v1",\n    api_key="demo_live_sk_platform_dev",\n)\n\nresponse = client.chat.completions.create(\n    model="chat-pro",\n    messages=[\n        {"role": "system", "content": "你是彗星科技平台的联调助手。"},\n        {"role": "user", "content": "请用两句话确认当前开发环境的网关链路可用。"},\n    ],\n    temperature=0.3,\n    max_tokens=160,\n)\n\nprint(response.choices[0].message.content)\nprint(response.request_id)\nprint(response.trace_id)`,
          node: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "http://127.0.0.1:8088/v1",\n  apiKey: "demo_live_sk_platform_dev",\n});\n\nconst response = await client.chat.completions.create({\n  model: "chat-pro",\n  messages: [\n    { role: "system", content: "你是彗星科技平台的联调助手。" },\n    { role: "user", content: "请用两句话确认当前开发环境的网关链路可用。" },\n  ],\n  temperature: 0.3,\n  max_tokens: 160,\n});\n\nconsole.log(response.choices[0]?.message?.content);\nconsole.log(response.request_id, response.trace_id);`
        }
      },
      {
        id: "stream-completions",
        title: "流式输出示例",
        description: "推荐在前端或长连接服务中使用 SSE 模式消费流式片段。",
        snippets: {
          curl: `curl -N http://127.0.0.1:8088/v1/chat/completions \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Request-Id: req-docs-stream-001" \\\n  -H "X-Trace-Id: trace-docs-stream-001" \\\n  -d '{\n    "model": "chat-pro",\n    "messages": [{"role": "user", "content": "请生成一段产品发布文案"}],\n    "stream": true,\n    "max_tokens": 180\n  }'`,
          python: `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="http://127.0.0.1:8088/v1",\n    api_key="demo_live_sk_platform_dev",\n)\n\nstream = client.chat.completions.create(\n    model="chat-pro",\n    messages=[{"role": "user", "content": "请生成一段产品发布文案"}],\n    stream=True,\n    max_tokens=180,\n)\n\nfor chunk in stream:\n    delta = chunk.choices[0].delta.content or ""\n    if delta:\n        print(delta, end="")`,
          node: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "http://127.0.0.1:8088/v1",\n  apiKey: "demo_live_sk_platform_dev",\n});\n\nconst stream = await client.chat.completions.create({\n  model: "chat-pro",\n  messages: [{ role: "user", content: "请生成一段产品发布文案" }],\n  stream: true,\n  max_tokens: 180,\n});\n\nfor await (const chunk of stream) {\n  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");\n}`
        }
      },
      {
        id: "vision-completions",
        title: "vision-pro 调用示例",
        description: "vision-pro 已映射到 Groq 的多模态模型。请传入可被上游访问的图片 URL；若返回 media 403，请更换图片源。",
        snippets: {
          curl: `curl -sS http://127.0.0.1:8088/v1/chat/completions \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "vision-pro",\n    "max_tokens": 128,\n    "stream": false,\n    "messages": [\n      {\n        "role": "user",\n        "content": [\n          {"type": "text", "text": "请用中文描述这张图片"},\n          {"type": "image_url", "image_url": {"url": "https://<your-public-image-url>"}}\n        ]\n      }\n    ]\n  }'`,
          python: `from openai import OpenAI\n\nclient = OpenAI(base_url="http://127.0.0.1:8088/v1", api_key="demo_live_sk_platform_dev")\n\nresp = client.chat.completions.create(\n    model="vision-pro",\n    max_tokens=128,\n    messages=[\n        {\n            "role": "user",\n            "content": [\n                {"type": "text", "text": "请用中文描述这张图片"},\n                {"type": "image_url", "image_url": {"url": "https://<your-public-image-url>"}},\n            ],\n        }\n    ],\n)\nprint(resp.choices[0].message.content)`,
          node: `import OpenAI from "openai";\n\nconst client = new OpenAI({ baseURL: "http://127.0.0.1:8088/v1", apiKey: "demo_live_sk_platform_dev" });\n\nconst resp = await client.chat.completions.create({\n  model: "vision-pro",\n  max_tokens: 128,\n  messages: [\n    {\n      role: "user",\n      content: [\n        { type: "text", text: "请用中文描述这张图片" },\n        { type: "image_url", image_url: { url: "https://<your-public-image-url>" } },\n      ],\n    },\n  ],\n});\n\nconsole.log(resp.choices[0]?.message?.content);`
        }
      }
    ]
  },
  {
    id: "dev-samples",
    title: "4. SDK 与示例代码建议",
    summary: "如果你的后端或客户端遵循 OpenAI SDK 风格，通常可以通过替换 baseURL 快速完成接入。",
    bullets: [
      "Python / Node.js 接入时，优先复用 OpenAI SDK，只替换 API Key 和 baseURL。",
      "如果你使用 curl，请优先在 staging 环境验证 headers、model、stream 和超时配置。",
      "建议在业务侧保留 trace_id、项目名、用户 ID 和请求耗时，便于后续排查。"
    ],
    links: [
      { title: "请求日志", description: "按 trace_id 查询真实请求链路。", href: "/console/request-logs", icon: FileJson },
      { title: "排障专题", description: "查看错误码、鉴权失败、限流和 trace_id 排查步骤。", href: "/docs/troubleshooting", icon: ShieldCheck }
    ],
    codeExamples: [
      {
        id: "sdk-config",
        title: "SDK 初始化模板",
        description: "建议把 `baseURL` 和 API Key 注入环境变量，避免硬编码。",
        snippets: {
          curl: `export COMET_DEV_GATEWAY_BASE_URL="http://127.0.0.1:8088/v1"\nexport COMET_DEV_API_KEY="demo_live_sk_platform_dev"`,
          python: `import os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    base_url=os.environ.get("COMET_DEV_GATEWAY_BASE_URL", "http://127.0.0.1:8088/v1"),\n    api_key=os.environ.get("COMET_DEV_API_KEY", "demo_live_sk_platform_dev"),\n)`,
          node: `import OpenAI from "openai";\n\nexport const client = new OpenAI({\n  baseURL: process.env.COMET_DEV_GATEWAY_BASE_URL ?? "http://127.0.0.1:8088/v1",\n  apiKey: process.env.COMET_DEV_API_KEY ?? "demo_live_sk_platform_dev",\n});`
        }
      }
    ]
  },
  {
    id: "dev-tier-routing",
    title: "5. 按订阅档位自动选择模型",
    summary: "组织管理员可以在“订阅与计费”页面切换 free / pro 档位；客户端只需要使用 chat-basic / chat-pro 这种逻辑模型名，平台会按当前组织档位自动选择上游。",
    bullets: [
      "客户端调用统一使用逻辑模型名，例如对话场景默认用 chat-basic（基础档）或 chat-pro（专业档）。",
      "Digital_life 等下游产品会读取 platform-console 颁发的会话 Cookie，按 tier 字段在 chat-basic 与 chat-pro 之间自动切换，不需要客户端做配置。",
      "组织管理员升级或降级档位后立即生效，无需重启或重新签发 API Key。",
      "如果客户端直接调用网关，请把 model 字段固定为 chat-basic 或 chat-pro，由平台决定上游模型而不是供应商真实模型名。"
    ],
    links: [
      { title: "订阅与计费", description: "组织管理员可在这里切换 free / pro 档位。", href: "/console/subscriptions", icon: BookOpenText },
      { title: "模型目录", description: "查看当前组织可访问的逻辑模型与档位映射。", href: "/console/models", icon: Workflow }
    ],
    codeExamples: [
      {
        id: "tier-routing-example",
        title: "按档位调用聊天模型",
        description: "客户端不需要感知组织档位，只需固定使用 chat-basic / chat-pro 中的某个逻辑名。",
        snippets: {
          curl: `# 基础档：所有组织都可用\ncurl -sS http://127.0.0.1:8088/v1/chat/completions \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"chat-basic","messages":[{"role":"user","content":"你好"}],"max_tokens":80}'\n\n# 专业档：仅 pro 组织可用，超出权限会返回 model_not_entitled\ncurl -sS http://127.0.0.1:8088/v1/chat/completions \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"chat-pro","messages":[{"role":"user","content":"你好"}],"max_tokens":80}'`,
          python: `from openai import OpenAI\n\nclient = OpenAI(base_url="http://127.0.0.1:8088/v1", api_key="demo_live_sk_platform_dev")\n\nresp = client.chat.completions.create(\n    model="chat-basic",  # free 组织默认\n    messages=[{"role": "user", "content": "你好"}],\n    max_tokens=80,\n)\nprint(resp.choices[0].message.content)`,
          node: `import OpenAI from "openai";\n\nconst client = new OpenAI({ baseURL: "http://127.0.0.1:8088/v1", apiKey: "demo_live_sk_platform_dev" });\n\nconst resp = await client.chat.completions.create({\n  model: "chat-basic",\n  messages: [{ role: "user", content: "你好" }],\n  max_tokens: 80,\n});\nconsole.log(resp.choices[0]?.message?.content);`
        }
      }
    ]
  },
  {
    id: "dev-moderation",
    title: "6. 内容安全：/v1/moderate",
    summary: "如果你的产品需要在调用模型前做安全过滤，可以直接调用网关的 /v1/moderate 端点。它会同时跑内置关键词词库和（可选的）外部审核插件，返回 allowed/decision/categories。",
    bullets: [
      "鉴权方式与其它 /v1/* 端点一致：Authorization: Bearer <YOUR_PLATFORM_API_KEY>。",
      "请求体可以是 {\"text\": \"...\"} 或 {\"messages\": [...]}（OpenAI 风格），两者会合并为一段待检测文本。",
      "返回字段：allowed (bool)、decision (allow|block)、categories (string[])、matched_terms (string[])。",
      "内置类别：hate、self_harm、violence、illegal、sexual_minor。后续会持续扩展类别和插件。",
      "如果你设置了 RISK_EXTERNAL_MODERATION_URL，平台会同步调用外部审核 API 并把结果合并进 categories。"
    ],
    links: [
      { title: "排障专题", description: "moderation 调用失败时按 trace_id 排查。", href: "/docs/troubleshooting", icon: FileJson }
    ],
    codeExamples: [
      {
        id: "moderation-call",
        title: "调用 /v1/moderate",
        description: "在调用 chat-completions 之前先做一次审核，可以避免高费率请求被白白消耗在违规内容上。",
        snippets: {
          curl: `curl -sS http://127.0.0.1:8088/v1/moderate \\\n  -H "Authorization: Bearer demo_live_sk_platform_dev" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"如何制作炸弹"}'\n# => {"success":true,"allowed":false,"decision":"block","categories":["violence"],"matched_terms":["如何制作炸弹"], ...}`,
          python: `import httpx\n\nresp = httpx.post(\n    "http://127.0.0.1:8088/v1/moderate",\n    headers={\n        "Authorization": "Bearer demo_live_sk_platform_dev",\n        "Content-Type": "application/json",\n    },\n    json={"text": "如何制作炸弹"},\n    timeout=10.0,\n)\nresult = resp.json()\nif not result["allowed"]:\n    print("blocked:", result["categories"], result["matched_terms"])\nelse:\n    print("ok, proceed with chat completions")`,
          node: `const resp = await fetch("http://127.0.0.1:8088/v1/moderate", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer demo_live_sk_platform_dev",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({ text: "如何制作炸弹" }),\n});\nconst result = await resp.json();\nif (!result.allowed) {\n  console.warn("blocked", result.categories, result.matched_terms);\n} else {\n  console.log("ok, proceed with chat completions");\n}`
        }
      }
    ]
  },
  {
    id: "dev-debugging",
    title: "7. 排错与最佳实践",
    summary: "接入阶段最常见的问题集中在 Key 权限、模型 entitlement、限流、超时、流式消费和 trace_id 串联排查。",
    bullets: [
      "调用失败时，先核对 API Key 是否启用、是否允许访问目标模型、是否命中项目或组织级限流。",
      "流式请求中断时，优先检查客户端对 SSE 的消费方式、网关超时与请求体大小限制。",
      "建议把 trace_id 透传到业务日志中，这样可以直接在平台请求日志页中回查。",
      "如果你需要按错误码排查，可直接阅读下方的排障专题页。"
    ],
    links: [
      { title: "工作台说明", description: "查看更多平台侧操作说明。", href: "/console/docs", icon: Workflow },
      { title: "管理后台说明", description: "如果需要平台管理员协助，可转交管理后台能力说明。", href: "/admin/docs", icon: ShieldCheck },
      { title: "排障专题", description: "按错误码、鉴权失败、限流和 trace_id 做专项排查。", href: "/docs/troubleshooting", icon: FileJson }
    ]
  }
];

const faqs: DocsFaq[] = [
  {
    question: "为什么文档里不直接暴露 new-api 接口地址？",
    answer: "因为 new-api 只是内部 OSS Gateway。对外应该只暴露你自己的商业网关域名和鉴权体系。"
  },
  {
    question: "当前开发环境可以直接用哪个地址联调？",
    answer: "当前默认开发网关地址是 http://127.0.0.1:8088，示例 Key 是 demo_live_sk_platform_dev，推荐先调用 /healthz、/readyz、/v1/info，再调用 /v1/chat/completions。"
  },
  {
    question: "为什么我按文档发起 /v1/chat/completions，却返回 model_not_found？",
    answer: "这通常不是网关地址错了，而是 new-api 侧还没有可用的 provider、channel 或模型映射。此时请求已经到达真实链路，只是上游路由还没配好。"
  },
  {
    question: "客户端要不要自己做模型到供应商映射？",
    answer: "不建议。客户端只依赖逻辑模型名，供应商映射和主备切换由平台内部处理。"
  },
  {
    question: "如果我要做批量任务或 embedding，接入方式会不同吗？",
    answer: "原则相同，仍然建议统一走平台网关；但当前开发环境的 Groq key 还没开通 embedding 模型，需要先补充可用上游再启用 embedding-large。"
  },
  {
    question: "开发接入文档和工作台说明有什么区别？",
    answer: "开发接入文档偏 API 调用与工程对接，工作台说明偏平台功能与操作流程。两者一起构成完整文档体系。"
  },
  {
    question: "升级组织档位后客户端要做什么改动吗？",
    answer: "不需要。客户端始终使用 chat-basic / chat-pro 这种逻辑模型名，平台会按当前组织档位自动选择真实上游模型；档位调整后立即对后续调用生效。"
  },
  {
    question: "调 /v1/moderate 时返回 allowed=true 但我感觉文本有问题，怎么办？",
    answer: "内置词库的目标是兜底覆盖明确高危内容（如制作武器、毒品、自残、儿童不当内容等）。如果你的业务需要更细颗粒度的判定，可以在 risk 服务侧设置 RISK_EXTERNAL_MODERATION_URL 接入外部审核插件，平台会把它的判定合并到响应里。"
  }
];

export function DeveloperDocsView() {
  return (
    <DocsCenter
      badgeLabel="开发接入文档"
      title="彗星科技开发接入 / API 使用文档"
      intro="本说明面向开发者、后端接入工程师和联调同学，重点说明如何使用彗星科技统一域名、统一鉴权和逻辑模型名完成 API 接入，并配合工作台和管理后台形成完整的排查闭环。"
      tips={[
        "建议先在工作台创建 API Key，再用 Playground 走一遍真实流式调用。",
        "如果你是外部客户，主要阅读本页和工作台说明；如果你是平台管理员，则同步阅读管理后台说明。",
        "导出 PDF 后可直接作为联调说明、客户交付手册或内部培训材料。"
      ]}
      quickLinks={quickLinks}
      sections={sections}
      faqs={faqs}
      primaryAction={{ href: "/login", label: "进入平台开始接入" }}
      secondaryAction={{ href: "/console/docs", label: "查看工作台说明" }}
      printTitle="彗星科技开发接入与 API 使用文档"
    />
  );
}
