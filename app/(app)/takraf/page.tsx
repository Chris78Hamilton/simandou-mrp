import { createClient, createServiceClient, getUserRole } from "@/lib/supabase/server";
import { Spare, SparesFilters, System } from "@/lib/types";
import { SparesClient } from "@/app/(app)/spares/spares-client";
import { Suspense } from "react";
import { OemTabs } from "@/components/spares/oem-tabs";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    search?: string;
    category?: string;
    sub_commodity?: string;
    system_id?: string;
    stock_status?: string;
    osd?: string;
    delivered?: string;
    spare_type?: string;
    page?: string;
  };
}

async function getSpares(filters: SparesFilters) {
  const supabase = createServiceClient();
  const { page, pageSize, search, category, sub_commodity, system_id, stock_status, osd, delivered, spare_type } = filters;

  let query = supabase
    .from("spares")
    .select("*, systems(name, code), subsystems(name, code)", { count: "exact" })
    .eq("oem", "TAKRAF");

  if (search) {
    query = query.or(
      `tag.ilike.%${search}%,part_number.ilike.%${search}%,manf_part_number.ilike.%${search}%,description.ilike.%${search}%,shipment_ref.ilike.%${search}%,pkg_no.ilike.%${search}%`
    );
  }
  if (category)      query = query.eq("category", category);
  if (sub_commodity) query = query.
