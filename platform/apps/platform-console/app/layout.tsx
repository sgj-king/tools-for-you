import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "彗星科技",
    template: "%s | 彗星科技"
  },
  applicationName: "彗星科技",
  description: "彗星科技 AI API 平台工作台与内部管理后台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
