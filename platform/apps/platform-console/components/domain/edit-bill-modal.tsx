"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api-client-error";
import { useUpdateBillMutation } from "@/hooks/use-console-data";
import type { BillRecord } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function EditBillModal({
  bill,
  open,
  onOpenChange
}: {
  bill?: BillRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateBillMutation();
  const fieldErrors = getApiFieldErrors(mutation.error);
  const [status, setStatus] = useState<BillRecord["status"]>("open");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!bill) return;
    setStatus(bill.status);
    setNotes("");
  }, [bill, open]);

  if (!bill) return null;
  const targetBill = bill;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({
      billId: targetBill.id,
      payload: {
        status,
        notes
      }
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="space-y-5">
          <div>
            <DialogTitle className="text-xl font-semibold">编辑账单状态</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">{targetBill.billNumber} 的状态与备注将写入账单覆盖表。</DialogDescription>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">状态</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as BillRecord["status"])} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm">
                <option value="open">open</option>
                <option value="settled">settled</option>
                <option value="partial">partial</option>
                <option value="overdue">overdue</option>
              </select>
              <FieldError message={fieldErrors.status} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">备注</span>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="例如：人工复核中" />
              <FieldError message={fieldErrors.notes} />
            </label>
            {mutation.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {getApiErrorMessage(mutation.error, "更新账单失败，请稍后重试。")}
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
