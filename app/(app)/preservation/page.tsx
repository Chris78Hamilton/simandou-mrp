import { createClient } from "@/lib/supabase/server";
import { Spare } from "@/lib/types";
import { PreservationClient } from "./preservation-client";

export const dynamic = "force-dynamic";

async function getPreservationItems() {
  const supabase = createClient();
  const { data } = await supabase
    .from("spares")
    .select("id, tag, description, oem, bin_location, requires_preservation, preservation_freq_days, preservation_doc, last_preservation_date, next_preservation_date")
    .eq("requires_preservation", true)
    .order("next_preservation_date", { ascending: true });
  return (data ?? []) as Partial<Spare>[];
}

export default async function PreservationPage() {
  const items = await getPreservationItems();
  return <PreservationClient items={items} />;
}
