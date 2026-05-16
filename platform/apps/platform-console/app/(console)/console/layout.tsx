import type { ReactNode } from "react";
import { RouteGuard } from "@/components/layout/route-guard";
import { ConsoleShell } from "@/layouts/console-layout";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard minimumRole="member">
      <ConsoleShell title="工作台" subtitle="围绕调用量、成本、收费、错误率、模型权限与团队协作构建。" docsHref="/console/docs">
        {children}
      </ConsoleShell>
    </RouteGuard>
  );
}
