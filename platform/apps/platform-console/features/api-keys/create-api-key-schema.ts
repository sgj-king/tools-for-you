import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z.string().min(2, "名称至少 2 个字符").max(64, "名称不能超过 64 个字符"),
  projectId: z.string().min(1, "请选择项目"),
  allowedModels: z.array(z.string()).min(1, "至少选择一个模型"),
  rpmLimit: z.number().min(1).max(100000),
  tpmLimit: z.number().min(100).max(10000000),
  expiresAt: z.string().optional(),
  ipAllowlist: z.array(z.string()).default([]),
  notes: z.string().max(240).optional()
});

export type CreateApiKeyValues = z.infer<typeof createApiKeySchema>;
