"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { hasRole } from "@/lib/permissions";
import { useSessionUserQuery } from "@/hooks/use-console-data";

export function RouteGuard({
  minimumRole,
  children,
  fallback
}: {
  minimumRole: Parameters<typeof hasRole>[1];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const session = useSessionUserQuery();

  if (session.isPending) {
    return <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">正在校验权限…</div>;
  }

  if (session.isError || !session.data) {
    return (
      <div className="rounded-3xl border border-warning/30 bg-warning/10 p-6 text-sm text-warning">
        会话已失效或尚未登录，请重新登录后再访问。
        <Link href="/login" className="ml-2 underline-offset-4 hover:underline">
          去登录
        </Link>
      </div>
    );
  }

  if (!hasRole(session.data.role, minimumRole)) {
    return fallback ?? <div className="rounded-3xl border border-danger/30 bg-danger/10 p-6 text-sm text-danger">你没有访问该页面的权限。</div>;
  }

  return <>{children}</>;
}
