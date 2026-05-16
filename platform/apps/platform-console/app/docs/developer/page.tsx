import type { Metadata } from "next";
import { DeveloperDocsView } from "@/modules/public/developer-docs-view";

export const metadata: Metadata = {
  title: "开发接入文档"
};

export default function DeveloperDocsPage() {
  return <DeveloperDocsView />;
}
