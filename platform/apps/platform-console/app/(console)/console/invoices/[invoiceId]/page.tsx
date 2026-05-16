import { InvoiceDetailView } from "@/modules/console/invoice-detail-view";

export default function ConsoleInvoiceDetailPage({ params }: { params: { invoiceId: string } }) {
  return <InvoiceDetailView invoiceId={params.invoiceId} />;
}
