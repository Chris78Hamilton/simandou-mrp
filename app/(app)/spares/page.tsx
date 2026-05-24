import { createClient, createServiceClient, getUserRole } from "@/lib/supabase/server";
import { Spare, SparesFilters, System } from "@/lib/types";
import { SparesClient } from "./spares-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    search?: string;
    oem?: string;
    category?: string;
    sub_commodity?: string;
    system_id?: string;
    stock_status?: string;
    osd?: string;
    delivered?: string;
    page?: string;
  };
}

async function getSpares(filters: SparesFilters) {
  const supabase = createServiceClient();
  const { page, pageSize, search, oem, category, sub_commodity, system_id, stock_status, osd, delivered } = filters;

  let query = supabase
    .from("spares")
    .select("*, systems(name, code), subsystems(name, code)", { count: "exact" });

  if (search) {
    query = query.or(
      `tag.ilike.%${search}%,part_number.ilike.%${search}%,manf_part_number.ilike.%${search}%,description.ilike.%${search}%,shipment_ref.ilike.%${search}%,pkg_no.ilike.%${search}%`
    );
  }
  if (oem) query = query.eq("oem", oem);
  if (category) query = query.eq("category", category);
  if (sub_commodity) query = query.eq("sub_commodity", sub_commodity);
  if (system_id) query = query.eq("system_id", system_id);
  if (osd === "yes") query = query.eq("osd", true);
  else if (osd === "no") query = query.eq("osd", false);
  if (delivered === "yes") query = query.eq("delivered", true);
  else if (delivered === "no") query = query.eq("delivered", false);
  if (stock_status === "zero") query = query.eq("qty_stock", 0);
  else if (stock_status === "low") query = query.gt("qty_stock", 0).filter("qty_stock", "lte", "qty_min");
  else if (stock_status === "ok") query = query.filter("qty_stock", "gt", "qty_min");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("description", { ascending: true })
    .range(from, to);

  return { spares: (data ?? []) as Spare[], total: count ?? 0, error };
}

async function getSystems() {
  const supabase = createClient();
  const { data } = await supabase.from("systems").select("id, name, code").order("name");
  return (data ?? []) as System[];
}

export default async function SparesPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const filters: SparesFilters = {
    search: searchParams.search ?? "",
    oem: (searchParams.oem as SparesFilters["oem"]) ?? "",
    category: (searchParams.category as SparesFilters["category"]) ?? "",
    sub_commodity: (searchParams.sub_commodity as SparesFilters["sub_commodity"]) ?? "",
    system_id: searchParams.system_id ?? "",
    stock_status: (searchParams.stock_status as SparesFilters["stock_status"]) ?? "",
    osd: (searchParams.osd as SparesFilters["osd"]) ?? "",
    delivered: (searchParams.delivered as SparesFilters["delivered"]) ?? "",
    page,
    pageSize: 50,
  };

  const [{ spares, total }, systems, { canEdit, isAdmin }] = await Promise.all([
    getSpares(filters),
    getSystems(),
    getUserRole(),
  ]);

  return (
    <SparesClient
      initialSpares={spares}
      total={total}
      systems={systems}
      initialFilters={filters}
      canEdit={canEdit}
      isAdmin={isAdmin}
    />
  );
}
