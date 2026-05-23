"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Spare } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OemBadge } from "@/components/spares/oem-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck, Loader2 } from "lucide-react";

interface Props {
  items: Partial<Spare>[];
}

const schema = z.object({
  performed_date: z.string().min(1, "Required"),
  performed_by: z.string().min(1, "Required"),
  condition_found: z.string().optional(),
  action_taken: z.string().optional(),
  next_due_date: z.string().optional(),
  certificate_ref: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function getStatus(nextDate: string | null | undefined) {
  if (!nextDate) return "N/A";
  const today = new Date().toISOString().split("T")[0];
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  if (nextDate <= today) return "OVERDUE";
  if (nextDate <= in14) return "DUE_SOON";
  return "OK";
}

export function PreservationClient({ items }: Props) {
  const router = useRouter();
  const [logItem, setLogItem] = useState<Partial<Spare> | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { performed_date: new Date().toISOString().split("T")[0] },
  });

  async function onSubmit(data: FormData) {
    if (!logItem) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("preservation_logs").insert({
      spare_id: logItem.id,
      performed_date: data.performed_date,
      performed_by: data.performed_by,
      condition_found: data.condition_found || null,
      action_taken: data.action_taken || null,
      next_due_date: data.next_due_date || null,
      certificate_ref: data.certificate_ref || null,
      notes: data.notes || null,
      created_by: user?.id ?? null,
    });

    if (!error && data.next_due_date) {
      await supabase.from("spares").update({
        last_preservation_date: data.performed_date,
        next_preservation_date: data.next_due_date,
      }).eq("id", logItem.id!);
    }

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Preservation logged" });
    setLogItem(null);
    reset();
    router.refresh();
  }

  const today = new Date().toISOString().split("T")[0];
  const overdue = items.filter((i) => i.next_preservation_date && i.next_preservation_date <= today);
  const dueSoon = items.filter((i) => {
    if (!i.next_preservation_date || i.next_preservation_date <= today) return false;
    const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    return i.next_preservation_date <= in14;
  });
  const ok = items.filter((i) => {
    if (!i.next_preservation_date) return true;
    const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    return i.next_preservation_date > in14;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Preservation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {overdue.length} overdue · {dueSoon.length} due within 14 days · {ok.length} OK
        </p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {["Status", "Tag", "Description", "OEM", "Bin", "Freq (days)", "Last Performed", "Next Due", "Action"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No preservation items</td></tr>
              ) : items.map((item) => {
                const status = getStatus(item.next_preservation_date);
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5">
                      {status === "OVERDUE" && <Badge variant="overdue">OVERDUE</Badge>}
                      {status === "DUE_SOON" && <Badge variant="due_soon">DUE SOON</Badge>}
                      {status === "OK" && <Badge variant="ok">OK</Badge>}
                      {status === "N/A" && <Badge variant="secondary">N/A</Badge>}
                    </td>
                    <td className="px-3 py-2.5 font-mono-data text-xs">{item.tag ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs max-w-[200px] truncate">{item.description}</td>
                    <td className="px-3 py-2.5"><OemBadge oem={item.oem} /></td>
                    <td className="px-3 py-2.5 font-mono-data text-xs">{item.bin_location ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono-data text-xs">{item.preservation_freq_days ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono-data text-xs whitespace-nowrap">{formatDate(item.last_preservation_date ?? null)}</td>
                    <td className="px-3 py-2.5 font-mono-data text-xs whitespace-nowrap">{formatDate(item.next_preservation_date ?? null)}</td>
                    <td className="px-3 py-2.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setLogItem(item); reset({ performed_date: new Date().toISOString().split("T")[0] }); }}>
                        <ClipboardCheck className="w-3 h-3" /> Log
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!logItem} onOpenChange={(o) => !o && setLogItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Preservation</DialogTitle>
          </DialogHeader>
          {logItem && (
            <div className="bg-gray-50 rounded p-3 text-sm mb-2">
              <div className="font-medium">{logItem.description}</div>
              <div className="text-xs text-muted-foreground">{logItem.tag} · {logItem.bin_location}</div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date Performed *</Label>
                <Input type="date" {...register("performed_date")} />
                {errors.performed_date && <p className="text-red-500 text-xs">{errors.performed_date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Performed By *</Label>
                <Input placeholder="Name..." {...register("performed_by")} />
                {errors.performed_by && <p className="text-red-500 text-xs">{errors.performed_by.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Condition Found</Label>
              <Input {...register("condition_found")} placeholder="e.g. Good condition, corrosion noted..." />
            </div>
            <div className="space-y-1">
              <Label>Action Taken</Label>
              <Input {...register("action_taken")} placeholder="e.g. Greased, cleaned, rotated..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Next Due Date</Label>
                <Input type="date" {...register("next_due_date")} />
              </div>
              <div className="space-y-1">
                <Label>Certificate Ref</Label>
                <Input {...register("certificate_ref")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLogItem(null)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-[#B45309] hover:bg-[#92400E]">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Log Preservation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
