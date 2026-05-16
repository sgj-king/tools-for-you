import type { Metadata } from "next";
import { AdminDocsView } from "@/modules/admin/admin-docs-view";

export const metadata: Metadata = {
  title: "管理后台说明"
};

export default function AdminDocsPage() {
  return <AdminDocsView />;
}
