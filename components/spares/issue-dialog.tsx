"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Spare } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  quantity: z.number({ invalid_type_error: "Must be a number" }).int().positive("Must be greater than 0"),
  issued_to: z.string().min(1, "Required"),
  work_order: z.string().optional(),
  cost_code: z.string().optional(),
  remarks: z.string().optional(),
  transaction_date: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  spare: Spare;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function IssueDialog({ spare, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      transaction_date: new Date().toISOString().split("T")[0],
      quantity: 1,
    },
  });

  const qty = watch("quantity");

  async function onSubmit(data: FormData) {
    if (data.quantity > spare.qty_stock) {
      toast({ title: "Insufficient stock", description: `Only ${spare.qty_stock} available`, variant: "destructive" });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("issue_stock", {
      p_spare_id: spare.id,
      p_quantity: data.quantity,
      p_issued_to: data.issued_to,
      p_work_order: data.work_order || null,
      p_cost_code: data.cost_code || null,
      p_remarks: data.remarks || null,
      p_transaction_date: data.transaction_date,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Issue failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Stock issued successfully" });
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue Stock</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
          <div className="font-medium truncate">{spare.description}</div>
          <div className="flex gap-4 text-muted-foreground text-xs">
            {spare.tag && <span>Tag: <span className="font-mono-data text-foreground">{spare.tag}</span></span>}
            {spare.part_number && <span>Part: <span className="font-mono-data text-foreground">{spare.part_number}</span></span>}
            {spare.bin_location && <span>Bin: <span className="font-mono-data text-foreground">{spare.bin_location}</span></span>}
          </div>
          <div className="flex gap-4 text-xs">
            <span>Current Stock: <strong className={spare.qty_stock === 0 ? "text-red-600" : spare.qty_stock <= spare.qty_min ? "text-amber-600" : "text-green-600"}>{spare.qty_stock} {spare.unit ?? ""}</strong></span>
            {spare.unit_cost && <span>Unit Cost: <strong>{formatCurrency(spare.unit_cost, spare.currency)}</strong></span>}
            {qty > 0 && spare.unit_cost && <span>Issue Value: <strong>{formatCurrency(qty * spare.unit_cost, spare.currency)}</strong></span>}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="transaction_date">Issue Date *</Label>
              <Input id="transaction_date" type="date" {...register("transaction_date")} />
              {errors.transaction_date && <p className="text-red-500 text-xs">{errors.transaction_date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity * (max: {spare.qty_stock})</Label>
              <Input id="quantity" type="number" min={1} max={spare.qty_stock} {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="issued_to">Issued To *</Label>
            <Input id="issued_to" placeholder="Name or team..." {...register("issued_to")} />
            {errors.issued_to && <p className="text-red-500 text-xs">{errors.issued_to.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="work_order">Work Order</Label>
              <Input id="work_order" placeholder="WO-xxxxx" {...register("work_order")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cost_code">Cost Code</Label>
              <Input id="cost_code" placeholder="CC-xxxxx" {...register("cost_code")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" placeholder="Optional notes..." {...register("remarks")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || spare.qty_stock === 0} className="bg-[#B45309] hover:bg-[#92400E]">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</> : "Issue Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
