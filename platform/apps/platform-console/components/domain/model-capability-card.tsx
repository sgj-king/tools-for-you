import Link from "next/link";
import type { ModelCard } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildPlaygroundHref } from "@/lib/playground-links";

export function ModelCapabilityCard({ model }: { model: ModelCard }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{model.publicName}</div>
            <div className="mt-1 text-sm text-muted-foreground">{model.summary}</div>
          </div>
          <Badge tone={model.available ? "success" : "warning"}>{model.available ? "available" : "limited"}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {model.modalities.map((modality) => (
            <Badge key={modality} tone="muted">
              {modality}
            </Badge>
          ))}
          <Badge tone="info">{model.contextWindow}</Badge>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{model.pricingText}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="w-full">
            <Link href={buildPlaygroundHref(model)}>在线验证</Link>
          </Button>
          <Button asChild className="w-full" variant="secondary">
            <Link href={`/console/models/${model.id}`}>查看模型详情</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
