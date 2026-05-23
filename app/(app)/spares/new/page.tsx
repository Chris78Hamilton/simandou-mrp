import { createClient } from "@/lib/supabase/server";
import { System, Subsystem } from "@/lib/types";
import { SpareForm } from "@/components/spares/spare-form";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = createClient();
  const [{ data: systems }, { data: subsystems }] = await Promise.all([
    supabase.from("systems").select("id, name, code").order("name"),
    supabase.from("subsystems").select("id, system_id, name, code").order("name"),
  ]);
  return {
    systems: (systems ?? []) as System[],
    subsystems: (subsystems ?? []) as Subsystem[],
  };
}

export default async function NewSparePage() {
  const { systems, subsystems } = await getData();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Spare</h1>
      <SpareForm systems={systems} subsystems={subsystems} />
    </div>
  );
}
