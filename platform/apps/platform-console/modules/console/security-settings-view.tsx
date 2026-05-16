"use client";

import { SecuritySettingsModal } from "@/components/domain/security-settings-modal";
import { useSecuritySettingsQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SecuritySettingsView() {
  const settings = useSecuritySettingsQuery();

  if (!settings.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载安全设置…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader>
          <CardTitle>安全设置</CardTitle>
          <p className="text-sm text-muted-foreground">组织级安全策略：MFA、会话超时、IP 白名单、Webhook 签名与 Key 轮换周期。</p>
        </CardHeader>
        <CardContent className="pt-0">
          <SecuritySettingsModal settings={settings.data} />
        </CardContent>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Info label="强制 MFA" value={settings.data.mfaRequired ? "已开启" : "未开启"} />
          <Info label="会话超时" value={`${settings.data.sessionTimeoutMinutes} 分钟`} />
          <Info label="Webhook 签名" value={settings.data.webhookSignatureRequired ? "必需" : "可选"} />
          <Info label="Key 轮换周期" value={`${settings.data.keyRotationDays} 天`} />
          <Info label="最近安全检查" value={settings.data.lastSecurityReviewAt} />
          <Info label="IP 白名单" value={settings.data.ipAllowlist.join(", ")} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm">{value}</div>
    </div>
  );
}
