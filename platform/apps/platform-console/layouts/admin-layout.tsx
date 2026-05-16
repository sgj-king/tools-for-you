import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AdminShell({
  children,
  title,
  subtitle,
  docsHref
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  docsHref?: string;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} docsHref={docsHref} />
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
