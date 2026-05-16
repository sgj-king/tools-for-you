import type { Metadata } from "next";
import { ConsoleDocsView } from "@/modules/console/console-docs-view";

export const metadata: Metadata = {
  title: "工作台说明"
};

export default function ConsoleDocsPage() {
  return <ConsoleDocsView />;
}
