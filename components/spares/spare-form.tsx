"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Spare, System, Subsystem, Category, SubCommodity, SUB_COMMODITY_BY_CATEGORY, UOM_OPTIONS } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const schema = z.object({
  description: z.string().min(1, "Required"),
  tag: z.string().optional(),
  item_description: z.string().optional(),
  part_number: z.string().optional(),
  manf_part_number: z.string().optional(),
  pkg_no: z.string().optional(),
  category: z.enum(["PS", "SPS", "ST"]).optional().nullable(),
  sub_commodity: z.string().optional().nullable(),
  oem: z.enum(["ABB", "TAKRAF"]).optional().nullable(),
  sub_manufacturer: z.string().optional(),
  area: z.string().optional(),
  system_id: z.string().uuid().optional().nullable(),
  subsystem_id: z.string().uuid().optional().nullable(),
  shipment_ref: z.string().optional(),
  packing_list: z.string().optional(),
  osd: z.boolean().default(false),
  delivered: z.boolean().default(false),
  received_date: z.string().optional(),
  qty_stock: z.number().int().min(0).default(0),
  qty_min: z.number().int().min(0).default(0),
  qty_max: z.number().int().min(0).optional().nullable(),
  unit: z.string().optional(),
  warehouse: z.string().optional(),
  bin_location: z.string().optional(),
  site_location: z.string().optional(),
  unit_cost: z.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  lead_time_weeks: z.number().int().min(0).optional().nullable(),
  requires_preservation: z.boolean().default(false),
  preservation_freq_days: z.number().int().min(1).optional().nullable(),
  preservation_doc: z.string().optional(),
  last_preservation_date: z.string().optional(),
  next_preservation_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  spare?: Spare;
  systems: System[];
  subsystems: Subsystem[];
}

function strOrNull(v: string | undefined) {
  return v && v.trim() ? v.trim() : null;
}

const OEM_OPTIONS: ComboboxOption[] = [
  { value: "ABB", label: "ABB" },
  { value: "TAKRAF", label: "TAKRAF" },
];

const CATEGORY_OPTIONS: ComboboxOption[] = [
  { value: "PS", label: "PS (Construction)" },
  { value: "SPS", label: "SPS (Spares)" },
  { value: "ST", label: "ST" },
];

const UOM_COMBOBOX_OPTIONS: ComboboxOption[] = UOM_OPTIONS.map((u) => ({ value: u, label: u }));

export function SpareForm({ spare, systems, subsystems }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!spare;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: spare ? {
      description: spare.description,
      tag: spare.tag ?? "",
      item_description: spare.item_description ?? "",
      part_number: spare.part_number ?? "",
      manf_part_number: spare.manf_part_number ?? "",
      pkg_no: spare.pkg_no ?? "",
      category: spare.category ?? null,
      sub_commodity: spare.sub_commodity ?? null,
      oem: spare.oem ?? null,
      sub_manufacturer: spare.sub_manufacturer ?? "",
      area: spare.area ?? "",
      system_id: spare.system_id ?? null,
      subsystem_id: spare.subsystem_id ?? null,
      shipment_ref: spare.shipment_ref ?? "",
      packing_list: spare.packing_list ?? "",
      osd: spare.osd ?? false,
      delivered: spare.delivered ?? false,
      received_date: spare.received_date ?? "",
      qty_stock: spare.qty_stock,
      qty_min: spare.qty_min,
      qty_max: spare.qty_max ?? undefined,
      unit: spare.unit ?? "",
      warehouse: spare.warehouse ?? "",
      bin_location: spare.bin_location ?? "",
      site_location: spare.site_location ?? "",
      unit_cost: spare.unit_cost ?? undefined,
      currency: spare.currency,
      lead_time_weeks: spare.lead_time_weeks ?? undefined,
      requires_preservation: spare.requires_preservation,
      preservation_freq_days: spare.preservation_freq_days ?? undefined,
      preservation_doc: spare.preservation_doc ?? "",
      last_preservation_date: spare.last_preservation_date ?? "",
      next_preservation_date: spare.next_preservation_date ?? "",
      notes: spare.notes ?? "",
    } : {
      qty_stock: 0,
      qty_min: 0,
      currency: "USD",
      requires_preservation: false,
      osd: false,
    },
  });

  const systemId = watch("system_id");
  const category = watch("category");
  const requiresPreservation = watch("requires_preservation");

  const filteredSubsystems = subsystems.filter((s) => s.system_id === systemId);
  const subCommodityOptions: ComboboxOption[] = category
    ? SUB_COMMODITY_BY_CATEGORY[category].map((sc) => ({ value: sc, label: sc }))
    : [];

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();

    const payload = {
      description: data.description,
      tag: strOrNull(data.tag),
      item_description: strOrNull(data.item_description),
      part_number: strOrNull(data.part_number),
      manf_part_number: strOrNull(data.manf_part_number),
      pkg_no: strOrNull(data.pkg_no),
      category: data.category || null,
      sub_commodity: data.category ? (data.sub_commodity || null) : null,
      oem: data.oem || null,
      sub_manufacturer: strOrNull(data.sub_manufacturer),
      area: strOrNull(data.area),
      system_id: data.system_id || null,
      subsystem_id: data.subsystem_id || null,
      shipment_ref: strOrNull(data.shipment_ref),
      packing_list: strOrNull(data.packing_list),
      osd: data.osd,
      delivered: data.delivered,
      received_date: data.received_date || null,
      qty_stock: data.qty_stock,
      qty_min: data.qty_min,
      qty_max: data.qty_max ?? null,
      unit: strOrNull(data.unit),
      warehouse: strOrNull(data.warehouse),
      bin_location: strOrNull(data.bin_location),
      site_location: strOrNull(data.site_location),
      unit_cost: data.unit_cost ?? null,
      currency: data.currency || "USD",
      lead_time_weeks: data.lead_time_weeks ?? null,
      requires_preservation: data.requires_preservation,
      preservation_freq_days: data.requires_preservation ? (data.preservation_freq_days ?? null) : null,
      preservation_doc: data.requires_preservation ? strOrNull(data.preservation_doc) : null,
      last_preservation_date: data.requires_preservation ? (data.last_preservation_date || null) : null,
      next_preservation_date: data.requires_preservation ? (data.next_preservation_date || null) : null,
      notes: strOrNull(data.notes),
    };

    const { error } = isEdit
      ? await supabase.from("spares").update(payload).eq("id", spare!.id)
      : await supabase.from("spares").insert(payload);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? "Spare updated" : "Spare added" });
    router.push("/spares");
    router.refresh();
  }

  function field(label: string, name: keyof FormData, type = "text", placeholder = "") {
    const registerOptions = type === "number" ? { valueAsNumber: true } : {};
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <Input type={type} placeholder={placeholder} {...register(name, registerOptions)} />
        {errors[name] && <p className="text-red-500 text-xs">{(errors[name] as { message?: string })?.message}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* Identification */}
      <Card>
        <CardHeader><CardTitle className="text-base">Identification</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label>Description *</Label>
            <Input {...register("description")} />
            {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
          </div>
          {field("Tag / Asset ID", "tag")}
          {field("Item Description", "item_description")}
          {field("OEM Part Number", "part_number")}
          {field("Manf Part Number", "manf_part_number")}
          {field("PKG No", "pkg_no")}
          <div className="space-y-1">
            <Label>OEM</Label>
            <Combobox
              options={OEM_OPTIONS}
              value={watch("oem") ?? ""}
              onChange={(v) => setValue("oem", v ? v as FormData["oem"] : null)}
              placeholder="Select OEM..."
              emptyLabel="None"
            />
          </div>
          {field("Sub-Manufacturer", "sub_manufacturer")}
          {field("Area", "area")}
        </CardContent>
      </Card>

      {/* Category & Sub Commodity */}
      <Card>
        <CardHeader><CardTitle className="text-base">Classification</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Category</Label>
            <Combobox
              options={CATEGORY_OPTIONS}
              value={watch("category") ?? ""}
              onChange={(v) => {
                setValue("category", v ? v as Category : null);
                setValue("sub_commodity", null);
              }}
              placeholder="Select category..."
              emptyLabel="None"
            />
          </div>
          <div className="space-y-1">
            <Label>Sub Commodity</Label>
            <Combobox
              options={subCommodityOptions}
              value={watch("sub_commodity") ?? ""}
              onChange={(v) => setValue("sub_commodity", v ? v as SubCommodity : null)}
              placeholder={category ? "Select sub commodity..." : "Select category first"}
              emptyLabel="None"
              disabled={!category}
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment Link */}
      <Card>
        <CardHeader><CardTitle className="text-base">Equipment Link</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>System</Label>
            <Select value={watch("system_id") ?? ""} onValueChange={(v) => { setValue("system_id", v === "none" ? null : v); setValue("subsystem_id", null); }}>
              <SelectTrigger><SelectValue placeholder="Select system..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Subsystem</Label>
            <Select value={watch("subsystem_id") ?? ""} onValueChange={(v) => setValue("subsystem_id", v === "none" ? null : v)} disabled={!systemId || filteredSubsystems.length === 0}>
              <SelectTrigger><SelectValue placeholder="Select subsystem..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredSubsystems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipment */}
      <Card>
        <CardHeader><CardTitle className="text-base">Shipment</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {field("Shipment Ref", "shipment_ref")}
          {field("Packing List", "packing_list")}
          {field("PKG No", "pkg_no")}
          <div className="space-y-1">
            <Label htmlFor="osd">OSD (Over, Short, Damaged)</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch
                id="osd"
                checked={watch("osd") ?? false}
                onCheckedChange={(v) => setValue("osd", v)}
              />
              <span className="text-sm text-muted-foreground">{watch("osd") ? "Yes" : "No"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="delivered">Delivered</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch
                id="delivered"
                checked={watch("delivered") ?? false}
                onCheckedChange={(v) => setValue("delivered", v)}
              />
              <span className="text-sm text-muted-foreground">{watch("delivered") ? "Yes" : "No"}</span>
            </div>
          </div>
          {field("Received Date", "received_date", "date")}
        </CardContent>
      </Card>

      {/* Stock */}
      <Card>
        <CardHeader><CardTitle className="text-base">Stock</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          {field("Qty on Hand", "qty_stock", "number")}
          {field("Min Qty", "qty_min", "number")}
          {field("Max Qty", "qty_max", "number")}
          <div className="space-y-1">
            <Label>UOM</Label>
            <Combobox
              options={UOM_COMBOBOX_OPTIONS}
              value={watch("unit") ?? ""}
              onChange={(v) => setValue("unit", v || "")}
              placeholder="Select UOM..."
              emptyLabel="None"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {field("Warehouse", "warehouse")}
          {field("Bin Location", "bin_location")}
          {field("Site Location", "site_location")}
        </CardContent>
      </Card>

      {/* Cost */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cost</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {field("Unit Cost", "unit_cost", "number")}
          <div className="space-y-1">
            <Label>Currency</Label>
            <Select value={watch("currency") ?? "USD"} onValueChange={(v) => setValue("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="GNF">GNF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {field("Lead Time (weeks)", "lead_time_weeks", "number")}
        </CardContent>
      </Card>

      {/* Preservation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Preservation</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="requires_preservation">Requires Preservation</Label>
              <Switch
                id="requires_preservation"
                checked={requiresPreservation}
                onCheckedChange={(v) => setValue("requires_preservation", v)}
              />
            </div>
          </div>
        </CardHeader>
        {requiresPreservation && (
          <CardContent className="grid grid-cols-2 gap-4">
            {field("Frequency (days)", "preservation_freq_days", "number")}
            {field("Preservation Document", "preservation_doc")}
            {field("Last Performed", "last_preservation_date", "date")}
            {field("Next Due", "next_preservation_date", "date")}
          </CardContent>
        )}
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea {...register("notes")} rows={3} placeholder="Additional notes..." />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-brand hover:bg-brand-dark">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? "Update Spare" : "Add Spare"}
        </Button>
      </div>
    </form>
  );
}
