import type { Metadata } from "next";
import { TroubleshootingDocsView } from "@/modules/public/troubleshooting-docs-view";

export const metadata: Metadata = {
  title: "排障手册"
};

export default function TroubleshootingDocsPage() {
  return <TroubleshootingDocsView />;
}
