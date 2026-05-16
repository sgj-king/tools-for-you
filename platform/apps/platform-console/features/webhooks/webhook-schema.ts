import { z } from "zod";

export const createWebhookSchema = z.object({
  name: z.string().min(2, "名称至少 2 个字符"),
  endpoint: z.string().url("请输入有效的 HTTPS endpoint"),
  events: z.array(z.string()).min(1, "至少选择一个事件"),
  retryPolicy: z.string().min(2, "请输入重试策略")
});

export const testWebhookSchema = z.object({
  webhookId: z.string().min(1, "请选择 Webhook"),
  event: z.string().min(1, "请选择测试事件")
});

export type CreateWebhookValues = z.infer<typeof createWebhookSchema>;
export type TestWebhookValues = z.infer<typeof testWebhookSchema>;
