"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionUserQuery, useUpdateSessionTierMutation } from "@/hooks/use-console-data";
import { getApiErrorMessage } from "@/lib/api-client-error";
import type { PlanTier } from "@/types/domain";

type TierOption = {
  tier: PlanTier;
  label: string;
  caption: string;
  modelAlias: string;
  highlights: string[];
};

const TIER_OPTIONS: TierOption[] = [
  {
    tier: "free",
    label: "Free",
    caption: "免费体验",
    modelAlias: "chat-basic",
    highlights: ["每月有限调用额度", "对话路由到 chat-basic 模型", "适合验证集成与轻量场景"]
  },
  {
    tier: "pro",
    label: "Pro",
    caption: "全功能版",
    modelAlias: "chat-pro",
    highlights: ["更高调用额度与优先排队", "对话路由到 chat-pro 模型", "适合生产业务与长上下文"]
  }
];

export function TierSwitcherCard() {
  const session = useSessionUserQuery();
  const mutation = useUpdateSessionTierMutation();
  const [pendingTier, setPendingTier] = useState<PlanTier | null>(null);

  const currentTier: PlanTier = session.data?.tier ?? "free";
  const isAdmin = session.data?.role === "org_admin" || session.data?.role === "platform_super_admin" || session.data?.role === "ops_admin";

  const handleSelect = (tier: PlanTier) => {
    if (tier === currentTier || mutation.isPending) return;
    setPendingTier(tier);
    mutation.mutate(
      { tier },
      {
        onSettled: () => setPendingTier(null)
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>订阅等级</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>当前等级</span>
          <Badge tone={currentTier === "pro" ? "info" : "muted"}>{currentTier === "pro" ? "Pro" : "Free"}</Badge>
          <span className="text-xs">影响 Digital Life 等下游应用的模型路由：免费用户调 chat-basic，付费用户调 chat-pro。</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {TIER_OPTIONS.map((option) => {
            const isCurrent = option.tier === currentTier;
            const isPending = pendingTier === option.tier && mutation.isPending;
            return (
              <div
                key={option.tier}
                className={`rounded-2xl border p-4 ${isCurrent ? "border-primary/50 bg-primary/5" : "border-border/70 bg-card/70"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.caption} · 模型 {option.modelAlias}</div>
                  </div>
                  {isCurrent ? <Badge tone="success">当前</Badge> : null}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {option.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant={isCurrent ? "secondary" : "default"}
                    className="w-full"
                    disabled={isCurrent || !isAdmin || mutation.isPending}
                    onClick={() => handleSelect(option.tier)}
                  >
                    {isCurrent ? "已选用" : isPending ? "切换中…" : option.tier === "pro" ? "升级到 Pro" : "切换到 Free"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {!isAdmin ? (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            只有组织管理员可以变更订阅等级。
          </div>
        ) : null}
        {mutation.error ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {getApiErrorMessage(mutation.error, "切换订阅等级失败，请稍后重试。")}
          </div>
        ) : null}
        {mutation.isSuccess && !mutation.isPending ? (
          <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3 text-sm text-accent">订阅等级已更新，下次对话即生效。</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
