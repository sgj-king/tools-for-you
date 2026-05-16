import { RouteGuard } from "@/components/layout/route-guard";
import { TeamView } from "@/modules/console/team-view";

export default function TeamPage() {
  return (
    <RouteGuard minimumRole="member">
      <TeamView />
    </RouteGuard>
  );
}
