import { createClient } from "@/lib/supabase/server";
import { AuditLog } from "@/lib/types";
import { AuditClient } from "./audit-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { page?: string; table?: string; action?: string };
}

async function getAuditLogs(page: number, tableFilter: string, actionFilter: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  let query = supabase.from("audit_logs").select("*", { count: "exact" });
  if (tableFilter) query = query.eq("table_name", tableFilter);
  if (actionFilter) query = query.eq("action", actionFilter);

  const from = (page - 1) * 50;
  const { data, count } = await query.order("changed_at", { ascending: false }).range(from, from + 49);

  return { logs: (data ?? []) as AuditLog[], total: count ?? 0 };
}

export default async function AuditPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const { logs, total } = await getAuditLogs(page, searchParams.table ?? "", searchParams.action ?? "");
  return <AuditClient logs={logs} total={total} page={page} tableFilter={searchParams.table ?? ""} actionFilter={searchParams.action ?? ""} />;
}
