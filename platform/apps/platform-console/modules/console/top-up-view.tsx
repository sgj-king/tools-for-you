"use client";

import { BillingSummaryCard } from "@/components/domain/billing-summary-card";
import { TopUpPackageCard } from "@/components/domain/top-up-package-card";
import { useBillingSummaryQuery, useTopUpPackagesQuery } from "@/hooks/use-console-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TopUpView() {
  const summary = useBillingSummaryQuery();
  const packages = useTopUpPackagesQuery();

  if (!summary.data || !packages.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载充值页…</div>;
  }

  return (
    <div className="section-shell">
      <BillingSummaryCard summary={summary.data} />
      <Card>
        <CardHeader>
          <CardTitle>充值说明</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Info title="Desktop 主方案" value="顶部余额与风险提示，下方充值套餐卡片，右侧支付方式与说明。" />
          <Info title="Tablet 兼容" value="充值卡片改为单列，支付方式收进抽屉或折叠块。" />
          <Info title="接口" value="billingApi.listTopUpPackages / paymentApi.createOrder / invoiceApi.listInvoices" />
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-3">
        {packages.data.map((pack) => (
          <TopUpPackageCard key={pack.id} pack={pack} />
        ))}
      </section>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="mt-2 text-sm">{value}</div>
    </div>
  );
}
