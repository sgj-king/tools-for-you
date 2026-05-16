import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyStateBlock({
  title,
  description,
  actionLabel
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">Empty</div>
        <h3 className="font-display text-2xl">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        {actionLabel ? <Button variant="secondary">{actionLabel}</Button> : null}
      </CardContent>
    </Card>
  );
}
