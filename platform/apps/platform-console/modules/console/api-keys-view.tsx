"use client";

import { ApiKeyTable } from "@/components/domain/api-key-table";
import { CopySecretField } from "@/components/domain/copy-secret-field";
import { CreateApiKeyModal } from "@/components/domain/create-api-key-modal";
import { EmptyStateBlock } from "@/components/feedback/empty-state-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiKeysQuery } from "@/hooks/use-console-data";

export function ApiKeysView() {
  const apiKeys = useApiKeysQuery();

  if (!apiKeys.data) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">正在加载 API Key 列表…</div>;
  }

  if (apiKeys.data.length === 0) {
    return <EmptyStateBlock title="还没有 API Key" description="创建项目级密钥，配置模型权限、RPM、TPM、过期时间和 IP 白名单。" actionLabel="创建第一个 Key" />;
  }

  return (
    <div className="section-shell">
      <Card>
        <CardHeader className="flex-col gap-3 lg:flex-row lg:items-center">
          <div>
            <CardTitle>API Key 管理</CardTitle>
            <p className="text-sm text-muted-foreground">支持搜索、筛选、排序、分页与批量禁用。筛选维度：项目 / 状态 / 模型 / 风险状态 / 最后使用时间</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 md:flex-row lg:justify-end">
            <Input placeholder="搜索名称 / key prefix / 项目" className="md:max-w-xs" />
            <CreateApiKeyModal />
          </div>
        </CardHeader>
      </Card>
      <ApiKeyTable rows={apiKeys.data} />
      <Card>
        <CardHeader>
          <CardTitle>创建成功后的明文展示示例</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">真实交互中明文 Key 只展示一次，关闭弹窗后仅能看到 masked prefix。</p>
          <CopySecretField value="ns_live_xxx_example_only_show_once" />
        </CardContent>
      </Card>
    </div>
  );
}
