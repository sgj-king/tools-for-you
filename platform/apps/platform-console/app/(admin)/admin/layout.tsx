import type { ReactNode } from "react";
import { RouteGuard } from "@/components/layout/route-guard";
import { AdminShell } from "@/layouts/admin-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard minimumRole="ops_admin">
      <AdminShell title="管理后台" subtitle="用于用户、组织、定价、风控、路由与审计的内部运营视角。" docsHref="/admin/docs">
        {children}
      </AdminShell>
    </RouteGuard>
  );
}
