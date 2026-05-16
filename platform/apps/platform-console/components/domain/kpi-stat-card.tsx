import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export function KpiStatCard({
  label,
  value,
  hint,
  trend
}: {
  label: string;
  value: string;
  hint: string;
  trend?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          {trend ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trend}
            </div>
          ) : null}
        </div>
        <CardTitle className="font-display text-3xl">{value}</CardTitle>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
