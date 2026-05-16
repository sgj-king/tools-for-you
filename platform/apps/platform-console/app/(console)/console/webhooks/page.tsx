import { RouteGuard } from "@/components/layout/route-guard";
import { WebhooksView } from "@/modules/console/webhooks-view";

export default function WebhooksPage() {
  return (
    <RouteGuard minimumRole="project_admin">
      <WebhooksView />
    </RouteGuard>
  );
}
