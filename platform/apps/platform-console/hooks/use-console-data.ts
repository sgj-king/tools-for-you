"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/sdk/auth-api";
import {
  adminOrgApi,
  adminRiskApi,
  adminRoutingApi,
  adminUserApi,
  adminPricingApi,
  apiKeyApi,
  auditApi,
  billingApi,
  modelApi,
  overviewApi,
  projectApi,
  securityApi,
  supportApi,
  teamApi,
  usageApi
  ,
  webhookApi
} from "@/services/sdk/console-api";

type CommonFilterQuery = {
  search?: string;
  status?: string;
  statuses?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
};

type BillingFilterQuery = CommonFilterQuery & {
  amountMin?: number;
  amountMax?: number;
};

export function useSessionUserQuery() {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: authApi.getMe,
    retry: false
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authApi.register
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword
  });
}

export function useUpdateSessionProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (sessionUser) => {
      queryClient.setQueryData(["session-user"], sessionUser);
    }
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["session-user"] });
    }
  });
}

export function useOverviewQuery() {
  return useQuery({ queryKey: ["overview"], queryFn: overviewApi.getOverview });
}

export function useTrendQuery() {
  return useQuery({ queryKey: ["overview", "trends"], queryFn: overviewApi.getTrends });
}

export function useCostBreakdownQuery() {
  return useQuery({ queryKey: ["overview", "cost-breakdown"], queryFn: overviewApi.getCostBreakdown });
}

export function useApiKeysQuery() {
  return useQuery({ queryKey: ["api-keys"], queryFn: apiKeyApi.list });
}

export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiKeyApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    }
  });
}

export function useRequestLogsQuery(traceId?: string) {
  return useQuery({
    queryKey: ["request-logs", traceId],
    queryFn: () => usageApi.listLogs({ traceId })
  });
}

export function useRequestLogDetailQuery(traceId?: string) {
  return useQuery({
    queryKey: ["request-log-detail", traceId],
    queryFn: () => usageApi.getLogDetail(traceId ?? ""),
    enabled: Boolean(traceId)
  });
}

export function useBillingSummaryQuery() {
  return useQuery({ queryKey: ["billing-summary"], queryFn: billingApi.getSummary });
}

export function usePlansQuery() {
  return useQuery({ queryKey: ["plans"], queryFn: billingApi.listPlans });
}

export function useSubscriptionOverviewQuery() {
  return useQuery({ queryKey: ["subscription-overview"], queryFn: billingApi.getSubscriptionOverview });
}

export function useTopUpPackagesQuery() {
  return useQuery({ queryKey: ["top-up-packages"], queryFn: billingApi.listTopUpPackages });
}

export function useInvoicesQuery(query?: BillingFilterQuery) {
  return useQuery({ queryKey: ["invoices", query], queryFn: () => billingApi.listInvoices(query) });
}

export function useInvoicesPagedQuery(query?: BillingFilterQuery) {
  return useQuery({ queryKey: ["invoices-paged", query], queryFn: () => billingApi.listInvoicesPaged(query) });
}

export function useInvoiceDetailQuery(invoiceId?: string) {
  return useQuery({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: () => billingApi.getInvoiceDetail(invoiceId ?? ""),
    enabled: Boolean(invoiceId)
  });
}

export function useBillsQuery(query?: BillingFilterQuery) {
  return useQuery({ queryKey: ["bills", query], queryFn: () => billingApi.listBills(query) });
}

export function useBillsPagedQuery(query?: BillingFilterQuery) {
  return useQuery({ queryKey: ["bills-paged", query], queryFn: () => billingApi.listBillsPaged(query) });
}

export function useBillDetailQuery(billId?: string) {
  return useQuery({
    queryKey: ["bill-detail", billId],
    queryFn: () => billingApi.getBillDetail(billId ?? ""),
    enabled: Boolean(billId)
  });
}

export function useUpdateBillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, payload }: { billId: string; payload: Record<string, unknown> }) => billingApi.updateBill(billId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
      void queryClient.invalidateQueries({ queryKey: ["bills-paged"] });
      void queryClient.invalidateQueries({ queryKey: ["bill-detail", variables.billId] });
    }
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices-paged"] });
      void queryClient.invalidateQueries({ queryKey: ["bills"] });
      void queryClient.invalidateQueries({ queryKey: ["bills-paged"] });
    }
  });
}

export function useUpdateInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: Record<string, unknown> }) => billingApi.updateInvoice(invoiceId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices-paged"] });
      void queryClient.invalidateQueries({ queryKey: ["invoice-detail", variables.invoiceId] });
    }
  });
}

export function useModelsQuery() {
  return useQuery({ queryKey: ["models"], queryFn: modelApi.listCatalog });
}

export function useModelDetailQuery(modelId?: string) {
  return useQuery({
    queryKey: ["model-detail", modelId],
    queryFn: () => modelApi.getDetail(modelId ?? ""),
    enabled: Boolean(modelId)
  });
}

export function useProvidersQuery() {
  return useQuery({ queryKey: ["providers"], queryFn: adminRoutingApi.listProviders });
}

export function useRiskEventsQuery() {
  return useQuery({ queryKey: ["risk-events"], queryFn: adminRiskApi.listEvents });
}

export function useAdminUsersQuery() {
  return useQuery({ queryKey: ["admin-users"], queryFn: adminUserApi.listUsers });
}

export function useOrganizationsQuery() {
  return useQuery({ queryKey: ["organizations"], queryFn: adminOrgApi.listOrganizations });
}

export function usePricingRulesQuery() {
  return useQuery({ queryKey: ["pricing-rules"], queryFn: adminPricingApi.listRules });
}

export function useAuditLogsQuery() {
  return useQuery({ queryKey: ["audit-logs"], queryFn: auditApi.listLogs });
}

export function useTeamMembersQuery(query?: CommonFilterQuery & { role?: string }) {
  return useQuery({ queryKey: ["team-members", query], queryFn: () => teamApi.listMembers(query) });
}

export function useTeamMembersPagedQuery(query?: CommonFilterQuery & { role?: string }) {
  return useQuery({ queryKey: ["team-members-paged", query], queryFn: () => teamApi.listMembersPaged(query) });
}

export function useInviteTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamApi.invite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
      void queryClient.invalidateQueries({ queryKey: ["team-members-paged"] });
    }
  });
}

export function useUpdateTeamRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: Record<string, unknown> }) => teamApi.updateRole(memberId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
      void queryClient.invalidateQueries({ queryKey: ["team-members-paged"] });
    }
  });
}

export function useWebhooksQuery(query?: CommonFilterQuery) {
  return useQuery({ queryKey: ["webhooks", query], queryFn: () => webhookApi.list(query) });
}

export function useWebhooksPagedQuery(query?: CommonFilterQuery) {
  return useQuery({ queryKey: ["webhooks-paged", query], queryFn: () => webhookApi.listPaged(query) });
}

export function useCreateWebhookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: webhookApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      void queryClient.invalidateQueries({ queryKey: ["webhooks-paged"] });
    }
  });
}

export function useTestWebhookMutation() {
  return useMutation({
    mutationFn: webhookApi.test
  });
}

export function useUpdateWebhookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ webhookId, payload }: { webhookId: string; payload: Record<string, unknown> }) => webhookApi.update(webhookId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      void queryClient.invalidateQueries({ queryKey: ["webhooks-paged"] });
    }
  });
}

export function useWebhookRecentDeliveryDetailQuery(webhookId?: string) {
  return useQuery({
    queryKey: ["webhooks", "recent-delivery", webhookId],
    queryFn: () => webhookApi.getRecentDeliveryDetail(webhookId ?? ""),
    enabled: Boolean(webhookId)
  });
}

export function useWebhookDeliveriesQuery() {
  return useQuery({ queryKey: ["webhook-deliveries"], queryFn: webhookApi.listDeliveries });
}

export function useWebhookDeliveryDetailQuery(deliveryId?: string) {
  return useQuery({
    queryKey: ["webhook-delivery-detail", deliveryId],
    queryFn: () => webhookApi.getDeliveryDetail(deliveryId ?? ""),
    enabled: Boolean(deliveryId)
  });
}

export function useProjectSettingsQuery() {
  return useQuery({ queryKey: ["project-settings"], queryFn: projectApi.getSettings });
}

export function useUpdateProjectSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.updateSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-settings"] });
    }
  });
}

export function useSecuritySettingsQuery() {
  return useQuery({ queryKey: ["security-settings"], queryFn: securityApi.getSettings });
}

export function useUpdateSecuritySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: securityApi.updateSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["security-settings"] });
    }
  });
}

export function useSupportTicketsQuery() {
  return useQuery({ queryKey: ["support-tickets"], queryFn: supportApi.listTickets });
}

export function useSupportTicketDetailQuery(ticketId?: string) {
  return useQuery({
    queryKey: ["support-ticket-detail", ticketId],
    queryFn: () => supportApi.getTicketDetail(ticketId ?? ""),
    enabled: Boolean(ticketId)
  });
}

export function useReplySupportTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: string; payload: Record<string, unknown> }) => supportApi.replyTicket(ticketId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["support-ticket-detail", variables.ticketId] });
    }
  });
}
