"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Spare, StockTransaction } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  transaction_date:   z.string().min(1, "Required"),
  quantity:           z.number({ invalid_type_error: "Required" }).int().positive("Must be > 0"),
  area:               z.string().optional(),
  system:             z.string().optional(),
  subsystem:          z.string().optional(),
  description_of_use: z.string().min(1, "Required"),
  issued_to:          z.string().min(1, "Required"),
  issued_by:          z.string().min(1, "Required"),
  work_order:         z.string().optional(),
  cost_code:          z.string().optional(),
  remarks:            z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SuccessData { tx: StockTransaction; form: FormData }

interface Props {
  spare: Spare;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function buildIssueHtml(spare: Spare, s: SuccessData): string {
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const dateFmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const issueNo = s.tx?.id ? s.tx.id.slice(0, 8).toUpperCase() : "—";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>MIV ${issueNo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:16mm}
.hdr{text-align:center;padding-bottom:10px;border-bottom:2.5px solid #92400e;margin-bottom:14px}
.hdr-main{font-size:13pt;font-weight:700;letter-spacing:.8px;color:#92400e;text-transform:uppercase}
.hdr-sub{font-size:9pt;color:#555;margin-top:3px}
.meta{display:flex;justify-content:space-between;font-size:10pt;margin-bottom:14px}
.meta strong{font-size:11pt}
.lbl{font-size:8pt;text-transform:uppercase;color:#6b7280}
.sec{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#92400e;border-bottom:1px solid #fde68a;padding-bottom:3px;margin:14px 0 8px}
table{width:100%;border-collapse:collapse}
th{background:#fffbeb;font-size:8.5pt;font-weight:700;text-align:left;padding:5px 8px;border:1px solid #d1d5db}
td{font-size:10pt;padding:5px 8px;border:1px solid #d1d5db;vertical-align:top}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.fl{font-size:7.5pt;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:2px}
.fv{font-size:10.5pt;border-bottom:1px solid #e5e7eb;padding-bottom:2px;min-height:18px}
.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:32px}
.sig .line{height:38px;border-bottom:1px solid #374151}
.sig .name{font-size:8pt;color:#6b7280;text-transform:uppercase;font-weight:700;margin-top:4px}
.footer{text-align:center;font-size:8pt;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:24px;letter-spacing:.5px}
@page{size:A4 portrait;margin:10mm}@media print{body{padding:0}}
</style></head><body>
<div class="hdr">
  <div class="hdr-main">Rio Tinto — Simandou MRP System — Material Issue Voucher</div>
  <div class="hdr-sub">Warehouse Management System &nbsp;|&nbsp; Simandou Iron Ore Project, Guinea</div>
</div>
<div class="meta">
  <div><span class="lbl">Issue No:&nbsp;</span><strong>${issueNo}</strong></div>
  <div><span class="lbl">Issue Date:&nbsp;</span><strong>${dateFmt(s.form.transaction_date)}</strong></div>
  <div><span class="lbl">Printed:&nbsp;</span>${today}</div>
</div>
<div class="sec">Item Details</div>
<table><tr><th>Description</th><th>Tag ID</th><th>OEM</th><th>OEM Part No</th></tr>
<tr><td>${spare.description || "—"}</td><td>${spare.tag || "—"}</td><td>${spare.oem || "—"}</td><td>${spare.part_number || "—"}</td></tr>
</table>
<div class="sec">Issue Details</div>
<table>
  <tr><th>Qty Issued</th><th>UOM</th><th>Stock Before</th><th>Stock After</th><th>Work Order</th></tr>
  <tr>
    <td><strong>${s.form.quantity}</strong></td>
    <td>${spare.unit || "EA"}</td>
    <td>${s.tx?.qty_before ?? "—"}</td>
    <td>${s.tx?.qty_after ?? "—"}</td>
    <td>${s.form.work_order || "—"}</td>
  </tr>
</table>
<div class="grid2">
  <div>
    <div class="fl">Area</div><div class="fv">${s.form.area || "—"}</div>
    <div class="fl" style="margin-top:10px">System</div><div class="fv">${s.form.system || "—"}</div>
    <div class="fl" style="margin-top:10px">Subsystem</div><div class="fv">${s.form.subsystem || "—"}</div>
  </div>
  <div>
    <div class="fl">Description of Use</div>
    <div class="fv" style="white-space:pre-wrap">${s.form.description_of_use}</div>
  </div>
</div>
<div class="grid2" style="margin-top:14px">
  <div>
    <div class="fl">Issued To</div><div class="fv">${s.form.issued_to}</div>
    <div class="fl" style="margin-top:10px">Issued By</div><div class="fv">${s.form.issued_by}</div>
  </div>
  <div>
    <div class="fl">Cost Code</div><div class="fv">${s.form.cost_code || "—"}</div>
    <div class="fl" style="margin-top:10px">Remarks</div><div class="fv">${s.form.remarks || "—"}</div>
  </div>
</div>
<div class="sigs">
  <div class="sig"><div class="line"></div><div class="name">Issued By</div></div>
  <div class="sig"><div class="line"></div><div class="name">Approved By</div></div>
  <div class="sig"><div class="line"></div><div class="name">Received By</div></div>
</div>
<div class="footer">CONFIDENTIAL — UNCONTROLLED WHEN PRINTED</div>
</body></html>`;
}

function openPrint(html: string) {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) { alert("Please allow pop-ups to print."); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export function IssueDialog({ spare, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { transaction_date: new Date().toISOString().split("T")[0], quantity: 1 },
  });

  const qty = watch("quantity");
  const isZero = spare.qty_stock === 0;
  const isLow  = spare.qty_stock > 0 && spare.qty_stock <= spare.qty_min;

  async function onSubmit(data: FormData) {
    if (data.quantity > spare.qty_stock) {
      toast({ title: "Insufficient stock", description: `Only ${spare.qty_stock} available`, variant: "destructive" });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: tx, error } = await supabase.rpc("issue_stock", {
      p_spare_id:            spare.id,
      p_quantity:            data.quantity,
      p_issued_to:           data.issued_to,
      p_work_order:          data.work_order || null,
      p_cost_code:           data.cost_code || null,
      p_remarks:             data.remarks || null,
      p_transaction_date:    data.transaction_date,
      p_area:                data.area || null,
      p_system_name:         data.system || null,
      p_subsystem_name:      data.subsystem || null,
      p_description_of_use:  data.description_of_use,
      p_issued_by:           data.issued_by,
    });
    setLoading(false);
    if (error) { toast({ title: "Issue failed", description: error.message, variant: "destructive" }); return; }
    const txData = tx as StockTransaction;
    setSuccess({ tx: txData, form: data });
    toast({
      title: "Stock issued",
      description: `${data.quantity} ${spare.unit ?? "units"} issued · New stock: ${txData?.qty_after ?? spare.qty_stock - data.quantity}`,
    });
    onSuccess();
  }

  function handleClose() {
    reset({ transaction_date: new Date().toISOString().split("T")[0], quantity: 1 });
    setSuccess(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Stock</DialogTitle>
        </DialogHeader>

        {/* Item details */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
          <div className="font-medium">{spare.description}</div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {spare.tag && <span>Tag: <span className="font-mono-data text-foreground">{spare.tag}</span></span>}
            {spare.part_number && <span>Part: <span className="font-mono-data text-foreground">{spare.part_number}</span></span>}
            {spare.bin_location && <span>Bin: <span className="font-mono-data text-foreground">{spare.bin_location}</span></span>}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span>
              Current Stock:{" "}
              <strong className={isZero ? "text-red-600" : isLow ? "text-amber-600" : "text-green-600"}>
                {spare.qty_stock} {spare.unit ?? ""}
              </strong>
              {isZero && <span className="ml-1 text-red-600 font-medium">(Out of stock)</span>}
              {isLow  && <span className="ml-1 text-amber-600 font-medium">(Low stock)</span>}
            </span>
            {spare.unit_cost && <span>Unit Cost: <strong>{formatCurrency(spare.unit_cost, spare.currency)}</strong></span>}
            {qty > 0 && spare.unit_cost && (
              <span>Issue Value: <strong>{formatCurrency(qty * spare.unit_cost, spare.currency)}</strong></span>
            )}
          </div>
        </div>

        {success ? (
          <>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Stock issued successfully
              </div>
              <p className="text-sm text-amber-700">
                {success.form.quantity} {spare.unit ?? "units"} issued to {success.form.issued_to} &nbsp;·&nbsp;
                New stock: <strong>{success.tx?.qty_after ?? spare.qty_stock - success.form.quantity}</strong>
              </p>
              <Button
                onClick={() => openPrint(buildIssueHtml(spare, success))}
                className="bg-brand hover:bg-brand-dark"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print Issue Voucher
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Issue Date *</Label>
                <Input type="date" {...register("transaction_date")} />
                {errors.transaction_date && <p className="text-red-500 text-xs">{errors.transaction_date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Qty to Issue * <span className="text-muted-foreground font-normal text-xs">(max: {spare.qty_stock})</span></Label>
                <Input type="number" min={1} max={spare.qty_stock} {...register("quantity", { valueAsNumber: true })} />
                {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Area</Label>
                <Input placeholder="e.g. C07" {...register("area")} />
              </div>
              <div className="space-y-1">
                <Label>System</Label>
                <Input placeholder="e.g. Conveyor" {...register("system")} />
              </div>
              <div className="space-y-1">
                <Label>Subsystem</Label>
                <Input placeholder="e.g. Drive" {...register("subsystem")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description of Use *</Label>
              <Textarea placeholder="Describe how this item will be used..." {...register("description_of_use")} rows={2} />
              {errors.description_of_use && <p className="text-red-500 text-xs">{errors.description_of_use.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Issued To *</Label>
                <Input placeholder="Name of recipient..." {...register("issued_to")} />
                {errors.issued_to && <p className="text-red-500 text-xs">{errors.issued_to.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Issued By *</Label>
                <Input placeholder="Name of issuer..." {...register("issued_by")} />
                {errors.issued_by && <p className="text-red-500 text-xs">{errors.issued_by.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Work Order</Label>
                <Input placeholder="WO-xxxxx" {...register("work_order")} />
              </div>
              <div className="space-y-1">
                <Label>Cost Code</Label>
                <Input placeholder="CC-xxxxx" {...register("cost_code")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea placeholder="Optional notes..." {...register("remarks")} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={loading || isZero} className="bg-brand hover:bg-brand-dark">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Issuing...</> : "Issue Stock"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
