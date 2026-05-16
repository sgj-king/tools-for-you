import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("请输入有效邮箱")
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
