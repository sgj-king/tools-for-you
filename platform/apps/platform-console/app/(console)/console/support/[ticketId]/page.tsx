import { SupportTicketDetailView } from "@/modules/console/support-ticket-detail-view";

export default function ConsoleSupportTicketDetailPage({ params }: { params: { ticketId: string } }) {
  return <SupportTicketDetailView ticketId={params.ticketId} />;
}
