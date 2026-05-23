"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Profile, UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Props { users: Profile[] }

const roleBadge: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-700",
};

export function UsersClient({ users: initialUsers }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [saving, setSaving] = useState<string | null>(null);

  async function updateRole(userId: string, role: UserRole) {
    setSaving(userId + "-role");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    setSaving(null);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    toast({ title: "Role updated" });
  }

  async function toggleActive(userId: string, current: boolean) {
    setSaving(userId + "-active");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ is_active: !current }).eq("id", userId);
    setSaving(null);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !current } : u));
    toast({ title: !current ? "User reactivated" : "User deactivated" });
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} users</p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {["Name", "Email", "Role", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={cn("border-b hover:bg-gray-50 transition-colors", !user.is_active && "opacity-50")}>
                <td className="px-4 py-3 font-medium">{user.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Select value={user.role} onValueChange={(v) => updateRole(user.id, v as UserRole)}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      {saving === user.id + "-role" ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">viewer</SelectItem>
                      <SelectItem value="editor">editor</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono-data">{formatDateTime(user.created_at)}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={saving === user.id + "-active"}
                    onClick={() => toggleActive(user.id, user.is_active)}
                  >
                    {saving === user.id + "-active" ? <Loader2 className="w-3 h-3 animate-spin" /> : user.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
