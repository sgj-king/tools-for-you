"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-client-error";
import { useCreateInvoiceMutation, useUpdateInvoiceMutation } from "@/hooks/use-console-data";
import type { InvoiceRecord } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreateInvoiceModal() {
  const mutation = useCreateInvoiceMutation();
  const fieldErrors = getApiFieldErrors(mutation.error);
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    billId: "",
    billingEntityName: "Demo Organization",
    taxId: "",
    dueDate: "",
    amountUsd: "",
    notes: ""
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({
      billId: formValues.billId.trim(),
      billingEntityName: formValues.billingEntityName.trim(),
      taxId: formValues.taxId.trim() || undefined,
      dueDate: formValues.dueDate.trim() || undefined,
      amountUsd: formValues.amountUsd ? Number(formValues.amountUsd) : undefined,
      notes: formValues.notes.trim() || undefined
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>创建发票</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">创建发票</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">根据账单号生成或覆盖发票记录。</DialogDescription>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">账单 ID</span>
              <Input value={formValues.billId} onChange={(event) => setFormValues((current) => ({ ...current, billId: event.target.value }))} placeholder="bill_202604" />
              <FieldError message={fieldErrors.billId} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">开票抬头</span>
                <Input value={formValues.billingEntityName} onChange={(event) => setFormValues((current) => ({ ...current, billingEntityName: event.target.value }))} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">税号</span>
                <Input value={formValues.taxId} onChange={(event) => setFormValues((current) => ({ ...current, taxId: event.target.value }))} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">到期日</span>
                <Input value={formValues.dueDate} onChange={(event) => setFormValues((current) => ({ ...current, dueDate: event.target.value }))} placeholder="2026-04-28" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">金额（USD）</span>
                <Input value={formValues.amountUsd} onChange={(event) => setFormValues((current) => ({ ...current, amountUsd: event.target.value }))} placeholder="0.00" />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">备注</span>
              <Input value={formValues.notes} onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))} />
            </label>
            {mutation.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {getApiErrorMessage(mutation.error, "创建发票失败，请检查参数后重试。")}
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "创建中…" : "创建发票"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditInvoiceModal({
  invoice,
  open,
  onOpenChange
}: {
  invoice?: InvoiceRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateInvoiceMutation();
  const fieldErrors = getApiFieldErrors(mutation.error);
  const [status, setStatus] = useState<InvoiceRecord["status"]>("issued");
  const [billingEntityName, setBillingEntityName] = useState("Demo Organization");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!invoice) return;
    setStatus(invoice.status);
    setBillingEntityName("Demo Organization");
    setTaxId("");
    setNotes("");
  }, [invoice, open]);

  if (!invoice) return null;
  const targetInvoice = invoice;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({
      invoiceId: targetInvoice.id,
      payload: {
        status,
        billingEntityName: billingEntityName.trim(),
        taxId: taxId.trim() || undefined,
        notes: notes.trim() || undefined
      }
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">编辑发票</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              {targetInvoice.invoiceNumber} · {targetInvoice.periodStart} - {targetInvoice.periodEnd}
            </DialogDescription>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">状态</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as InvoiceRecord["status"])} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm">
                <option value="draft">draft</option>
                <option value="issued">issued</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
                <option value="void">void</option>
              </select>
              <FieldError message={fieldErrors.status} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">开票抬头</span>
                <Input value={billingEntityName} onChange={(event) => setBillingEntityName(event.target.value)} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">税号</span>
                <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">备注</span>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            {mutation.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {getApiErrorMessage(mutation.error, "更新发票失败，请稍后重试。")}
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "保存中…" : "保存修改"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="text-xs text-danger">{message}</div>;
}
