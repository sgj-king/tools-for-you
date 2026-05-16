import { z } from "zod";

export const registerFormSchema = z.object({
  adminName: z.string().min(2, "管理员姓名至少 2 个字符"),
  email: z.string().email("请输入有效邮箱"),
  organizationName: z.string().min(2, "组织名称至少 2 个字符"),
  password: z.string().min(8, "密码至少 8 位").regex(/[a-z]/, "密码需包含小写字母").regex(/[A-Z]/, "密码需包含大写字母").regex(/\d/, "密码需包含数字"),
  confirmPassword: z.string().min(8, "请再次输入密码")
}).refine((values) => values.password === values.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"]
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
