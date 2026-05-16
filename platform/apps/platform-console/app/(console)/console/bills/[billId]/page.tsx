import { BillDetailView } from "@/modules/console/bill-detail-view";

export default function ConsoleBillDetailPage({ params }: { params: { billId: string } }) {
  return <BillDetailView billId={params.billId} />;
}
