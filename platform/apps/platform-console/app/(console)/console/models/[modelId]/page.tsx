import { ModelDetailView } from "@/modules/console/model-detail-view";

export default function ConsoleModelDetailPage({ params }: { params: { modelId: string } }) {
  return <ModelDetailView modelId={params.modelId} />;
}
