"use client";

import { ProviderHealthWidget } from "@/components/domain/provider-health-widget";
import { JsonViewer } from "@/components/domain/json-viewer";
import { useProvidersQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const routeMapping = {
  "chat-pro": {
    primary: "groq-primary-dev:openai/gpt-oss-120b",
    secondary: "groq-secondary-dev:openai/gpt-oss-120b",
    routeProfileCode: "chat-pro-global",
    policy: "region-first + cost-guard"
  },
  "vision-pro": {
    primary: "groq-primary-dev:meta-llama/llama-4-scout-17b-16e-instruct",
    secondary: "groq-secondary-dev:meta-llama/llama-4-scout-17b-16e-instruct",
    routeProfileCode: "vision-default",
    policy: "availability-first + timeout-guard"
  }
};

export function RoutingView() {
  const providers = useProvidersQuery();

  if (!providers.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载路由与渠道信息…</div>;
  }

  return (
    <div className="section-shell">
      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <ProviderHealthWidget providers={providers.data} />
        <Card>
          <CardHeader>
            <CardTitle>模型映射与路由策略</CardTitle>
          </CardHeader>
          <CardContent>
            <JsonViewer value={routeMapping} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
