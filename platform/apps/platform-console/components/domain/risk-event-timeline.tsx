import type { RiskEvent } from "@/types/domain";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RiskEventTimeline({ events }: { events: RiskEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>风控事件中心</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="relative border-l border-border pl-4">
            <div className="absolute left-[-5px] top-2 h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{event.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{event.summary}</div>
                <div className="mt-2 text-xs text-muted-foreground">{event.createdAt}</div>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={event.severity} />
                <StatusBadge status={event.status} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
