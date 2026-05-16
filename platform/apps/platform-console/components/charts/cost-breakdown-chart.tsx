"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostBreakdown } from "@/types/domain";
import { formatUsd } from "@/lib/utils";

export function CostBreakdownChart({ data }: { data: CostBreakdown[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>成本结构</CardTitle>
          <CardDescription>筛选维度：时间 / 模型 / 项目 / 缓存命中 / 供应商</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={3}>
                {data.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                <span className="text-sm font-medium">{entry.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{formatUsd(entry.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
