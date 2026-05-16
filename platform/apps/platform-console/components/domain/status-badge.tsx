import { AlertTriangle, CheckCircle2, Clock3, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  if (["active", "success", "healthy", "resolved"].includes(status)) {
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {status}
      </Badge>
    );
  }

  if (["failed", "blocked", "down", "high"].includes(status)) {
    return (
      <Badge tone="danger">
        <ShieldX className="h-3.5 w-3.5" />
        {status}
      </Badge>
    );
  }

  if (["degraded", "medium", "warning"].includes(status)) {
    return (
      <Badge tone="warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        {status}
      </Badge>
    );
  }

  return (
    <Badge tone="muted">
      <Clock3 className="h-3.5 w-3.5" />
      {status}
    </Badge>
  );
}
