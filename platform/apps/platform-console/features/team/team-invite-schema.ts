import { z } from "zod";

export const teamInviteSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  role: z.enum(["member", "project_admin", "org_admin", "finance"]),
  projectScope: z.array(z.string()).min(1, "至少选择一个项目范围")
});

export type TeamInviteValues = z.infer<typeof teamInviteSchema>;
