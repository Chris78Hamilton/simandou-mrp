import { createClient } from "@/lib/supabase/server";
import { Spare, System, Subsystem } from "@/lib/types";
import { SpareForm } from "@/components/spares/spare-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getData(id: string) {
  const supabase = createClient();
  const [{ data: spare }, { data: systems }, { data: subsystems }] = await Promise.all([
    supabase.from("spares").select("*").eq("id", id).single(),
    supabase.from("systems").select("id, name, code").order("name"),
    supabase.from("subsystems").select("id, system_id, name, code").order("name"),
  ]);
  return {
    spare: spare as Spare | null,
    systems: (systems ?? []) as System[],
    subsystems: (subsystems ?? []) as Subsystem[],
  };
}

export default async function EditSparePage({ params }: { params: { id: string } }) {
  const { spare, systems, subsystems } = await getData(params.id);
  if (!spare) notFound();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Spare</h1>
      <SpareForm spare={spare} systems={systems} subsystems={subsystems} />
    </div>
  );
}
