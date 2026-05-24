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
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Loader2, Printer } from "lucide-react";

const schema = z
  .object({
    receipt_date: z.string().min(1, "Required"),
    quantity: z.number({ invalid_type_error: "Required" }).int().positive("Must be > 0"),
    shipment_ref: z.string().optional(),
    pkg_no: z.string().optional(),
    packing_list: z.string().optional(),
    osd: z.boolean().default(false),
    osd_notes: z.string().optional(),
    received_by: z.string().min(1, "Required"),
    remarks: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.osd && !d.osd_notes?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required when OSD is Yes", path: ["osd_notes"] });
    }
  });

type FormData = z.infer<typeof schema>;

interface SuccessData { tx: StockTransaction; form: FormData }

interface Props {
  spare: Spare;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function buildGrnHtml(spare: Spare, s: SuccessData): string {
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const dateFmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const receiptNo = s.tx?.id ? s.tx.id.slice(0, 8).toUpperCase() : "—";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>GRN ${receiptNo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:16mm}
.hdr{text-align:center;padding-bottom:10px;border-bottom:2.5px solid #166534;margin-bottom:14px}
.hdr-main{font-size:13pt;font-weight:700;letter-spacing:.8px;color:#166534;text-transform:uppercase}
.hdr-sub{font-size:9pt;color:#555;margin-top:3px}
.meta{display:flex;justify-content:space-between;font-size:10pt;margin-bottom:14px}
.meta strong{font-size:11pt}
.lbl{font-size:8pt;text-transform:uppercase;color:#6b7280}
.sec{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#166534;border-bottom:1px solid #d1fae5;padding-bottom:3px;margin:14px 0 8px}
table{width:100%;border-collapse:collapse}
th{background:#f0fdf4;font-size:8.5pt;font-weight:700;text-align:left;padding:5px 8px;border:1px solid #d1d5db}
td{font-size:10pt;padding:5px 8px;border:1px solid #d1d5db;vertical-align:top}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.fl{font-size:7.5pt;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:2px}
.fv{font-size:10.5pt;border-bottom:1px solid #e5e7eb;padding-bottom:2px;min-height:18px}
.osd{color:#dc2626;font-weight:700}
.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:32px}
.sig .line{height:38px;border-bottom:1px solid #374151}
.sig .name{font-size:8pt;color:#6b7280;text-transform:uppercase;font-weight:700;margin-top:4px}
.footer{text-align:center;font-size:8pt;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:24px;letter-spacing:.5px}
@page{size:A4 portrait;margin:10mm}@media print{body{padding:0}}
</style></head><body>
<div class="hdr">
  <div class="hdr-main">Rio Tinto — Simandou MRP System — Goods Receipt Note</div>
  <div class="hdr-sub">Warehouse Management System &nbsp;|&nbsp; Simandou Iron Ore Project, Guinea</div>
</div>
<div class="meta">
  <div><span class="lbl">Receipt No:&nbsp;</span><strong>${receiptNo}</strong></div>
  <div><span class="lbl">Receipt Date:&nbsp;</span><strong>${dateFmt(s.form.receipt_date)}</strong></div>
  <div><span class="lbl">Printed:&nbsp;</span>${today}</div>
</div>
<div class="sec">Item Details</div>
<table><tr><th>Description</th><th>Tag ID</th><th>OEM</th><th>OEM Part No</th></tr>
<tr><td>${spare.description || "—"}</td><td>${spare.tag || "—"}</td><td>${spare.oem || "—"}</td><td>${spare.part_number || "—"}</td></tr>
</table>
<div class="sec">Receipt Details</div>
<table><tr><th>PKG No</th><th>Shipment Ref</th><th>Packing List No</th><th>Qty Received</th><th>UOM</th></tr>
<tr>
  <td>${s.form.pkg_no || "—"}</td>
  <td>${s.form.shipment_ref || "—"}</td>
  <td>${s.form.packing_list || "—"}</td>
  <td><strong>${s.form.quantity}</strong></td>
  <td>${spare.unit || "EA"}</td>
</tr></table>
<div class="grid2">
  <div>
    <div class="fl">Received By</div><div class="fv">${s.form.received_by}</div>
    <div class="fl" style="margin-top:10px">OSD Status</div>
    <div class="fv ${s.form.osd ? "osd" : ""}">${s.form.osd ? "YES — Over, Short or Damaged" : "No"}</div>
    ${s.form.osd && s.form.osd_notes ? `<div class="fl" style="margin-top:10px">OSD Notes</div><div class="fv osd">${s.form.osd_notes}</div>` : ""}
  </div>
  <div>
    <div class="fl">Remarks</div><div class="fv">${s.form.remarks || "—"}</div>
  </div>
</div>
<div class="sigs">
  <div class="sig"><div class="line"></div><div class="name">Received By</div></div>
  <div class="sig"><div class="line"></div><div class="name">Checked By</div></div>
  <div class="sig"><div class="line"></div><div class="name">Warehouse</div></div>
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

export function ReceiptDialog({ spare, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { receipt_date: new Date().toISOString().split("T")[0], quantity: 1, osd: false },
  });

  const osd = watch("osd");

  async function onSubmit(data: FormData) {
    console.log('[GR] form submitted', data);
    setLoading(true);
    const supabase = createClient();
    const { data: tx, error } = await supabase.rpc("receipt_stock", {
      p_spare_id:     spare.id,
      p_quantity:     data.quantity,
      p_receipt_date: data.receipt_date,
      p_shipment_ref: data.shipment_ref || null,
      p_pkg_no:       data.pkg_no || null,
      p_packing_list: data.packing_list || null,
      p_osd:          data.osd,
      p_osd_notes:    data.osd ? (data.osd_notes || null) : null,
      p_received_by:  data.received_by,
      p_remarks:      data.remarks || null,
    });
    setLoading(false);
    if (error) { toast({ title: "Receipt failed", description: error.message, variant: "destructive" }); return; }
    setSuccess({ tx: tx as StockTransaction, form: data });
    toast({ title: "Goods received", description: `${data.quantity} ${spare.unit ?? "units"} added to stock` });
    onSuccess();
  }

  function handleClose() {
    reset({ receipt_date: new Date().toISOString().split("T")[0], quantity: 1, osd: false });
    setSuccess(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Goods Receipt</DialogTitle>
        </DialogHeader>

        {/* Item details — always visible */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
          <div className="font-medium">{spare.description}</div>
          <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
            {spare.tag && <span>Tag ID: <span className="font-mono-data text-foreground">{spare.tag}</span></span>}
            {spare.part_number && <span>OEM Part No: <span className="font-mono-data text-foreground">{spare.part_number}</span></span>}
            {spare.oem && <span>OEM: <span className="text-foreground">{spare.oem}</span></span>}
            {spare.sub_manufacturer && <span>Sub-Mfr: <span className="text-foreground">{spare.sub_manufacturer}</span></span>}
          </div>
          <div className="text-xs">Current Stock: <strong>{spare.qty_stock} {spare.unit ?? ""}</strong></div>
        </div>

        {success ? (
          <>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-800 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Receipt recorded successfully
              </div>
              <p className="text-sm text-green-700">
                {success.form.quantity} {spare.unit ?? "units"} received &nbsp;·&nbsp; New stock:{" "}
                <strong>{success.tx?.qty_after ?? spare.qty_stock + success.form.quantity}</strong>
              </p>
              <Button
                onClick={() => openPrint(buildGrnHtml(spare, success))}
                className="bg-green-700 hover:bg-green-800"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print Goods Receipt Note
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
                <Label>Receipt Date *</Label>
                <Input type="date" {...register("receipt_date")} />
                {errors.receipt_date && <p className="text-red-500 text-xs">{errors.receipt_date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Quantity Received *</Label>
                <Input type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
                {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Shipment Ref</Label>
                <Input placeholder="e.g. SHIP-2024-001" {...register("shipment_ref")} />
              </div>
              <div className="space-y-1">
                <Label>PKG No</Label>
                <Input placeholder="e.g. PKG-042" {...register("pkg_no")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Packing List No</Label>
              <Input placeholder="e.g. PL-2024-001" {...register("packing_list")} />
            </div>

            <div className="flex items-center gap-3 py-1">
              <Label className="min-w-fit" htmlFor="osd-switch">OSD</Label>
              <Switch id="osd-switch" checked={osd} onCheckedChange={(v) => setValue("osd", v)} />
              <span className={`text-sm ${osd ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                {osd ? "Yes — Over, Short or Damaged" : "No"}
              </span>
            </div>

            {osd && (
              <div className="space-y-1">
                <Label>OSD Notes *</Label>
                <Textarea placeholder="Describe the over, short or damage..." {...register("osd_notes")} rows={2} />
                {errors.osd_notes && <p className="text-red-500 text-xs">{errors.osd_notes.message}</p>}
              </div>
            )}

            <div className="space-y-1">
              <Label>Received By *</Label>
              <Input placeholder="Full name of receiver..." {...register("received_by")} />
              {errors.received_by && <p className="text-red-500 text-xs">{errors.received_by.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea placeholder="Optional notes..." {...register("remarks")} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Receiving...</> : "Receive Stock"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
