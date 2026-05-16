"use client";

import { useMemo, useState } from "react";
import { ModelCapabilityCard } from "@/components/domain/model-capability-card";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { useModelsQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ModelsView() {
  const models = useModelsQuery();
  const [keyword, setKeyword] = useState("");

  const rows = useMemo(
    () =>
      (models.data ?? []).filter(
        (row) =>
          !keyword ||
          row.publicName.toLowerCase().includes(keyword.toLowerCase()) ||
          row.summary.toLowerCase().includes(keyword.toLowerCase()) ||
          row.modalities.join(" ").toLowerCase().includes(keyword.toLowerCase())
      ),
    [keyword, models.data]
  );

  if (!models.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载模型目录…</div>;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <CardTitle>模型目录</CardTitle>
            <p className="text-sm text-muted-foreground">
              对外展示稳定模型名、上下文窗口、模态、定价和可用性。Desktop 主方案为顶部筛选 + 卡片网格，Tablet 改为 2 列紧凑布局。
            </p>
          </div>
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索模型名 / 能力 / 模态" className="lg:max-w-sm" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock title="筛选维度" value="模型名 / 模态 / 上下文窗口 / 是否可流式 / 权限可见性" />
          <InfoBlock title="接口" value="modelApi.listCatalog / modelApi.getDetail / policyApi.entitlements" />
          <InfoBlock title="运营视角" value="展示稳定公开模型名，而不是暴露内部 provider/model mapping。" />
        </CardContent>
      </Card>
      {rows.length === 0 ? (
        <EmptyStateBlock title="没有找到模型" description="尝试调整搜索词，或检查模型目录接口返回。" />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((model) => (
            <ModelCapabilityCard key={model.id} model={model} />
          ))}
        </section>
      )}
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="mt-2 text-sm">{value}</div>
    </div>
  );
}
