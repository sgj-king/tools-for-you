export const siteConfig = {
  name: "彗星科技",
  description: "彗星科技商业化 AI API 开发者平台",
  consoleBasePath: "/console",
  adminBasePath: "/admin",
  customerConsoleUrl: process.env.NEXT_PUBLIC_CUSTOMER_CONSOLE_URL ?? "",
  adminConsoleUrl: process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ?? "",
  digitalLifeUrl: process.env.NEXT_PUBLIC_DIGITAL_LIFE_PUBLIC_URL ?? "",
  itToolsUrl: process.env.NEXT_PUBLIC_IT_TOOLS_PUBLIC_URL ?? "",
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? "/docs",
  statusUrl: process.env.NEXT_PUBLIC_STATUS_URL ?? "/status"
};
