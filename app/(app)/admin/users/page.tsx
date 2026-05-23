import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";
import { UsersClient } from "./users-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getUsers() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data } = await supabase.from("profiles").select("*").order("full_name");
  return (data ?? []) as Profile[];
}

export default async function UsersPage() {
  const users = await getUsers();
  return <UsersClient users={users} />;
}
