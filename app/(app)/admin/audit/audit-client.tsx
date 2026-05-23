"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  logs: AuditLog[];
  total: number;
  page: number;
  tableFilter: string;
  actionFilter: string;
}

const actionColor: Record<string, string> = {
  INSERT: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

function DiffView({ oldData, newData }: { oldData: Record<string, unknown> | null; newData: Record<string, unknown> | null }) {
  const keys = new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]);
  const changed = Array.from(keys).filter((k) => JSON.stringify((oldData ?? {})[k]) !== JSON.stringify((newData ?? {})[k]));

  if (changed.length === 0) return <p className="text-muted-foreground text-sm">No field changes detected</p>;

  return (
    <div className="space-y-2">
      {changed.map((k) => (
        <div key={k} className="text-xs border rounded overflow-hidden">
          <div className="bg-gray-100 px-2 py-1 font-mono font-semibold">{k}</div>
          {oldData && (
            <div className="px-2 py-1 bg-red-50 text-red-800 font-mono border-t">
              - {JSON.stringify((oldData)[k])}
            </div>
          )}
          {newData && (
            <div className="px-2 py-1 bg-green-50 text-green-800 font-mono border-t">
              + {JSON.stringify((newData)[k])}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AuditClient({ logs, total, page, tableFilter, actionFilter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const totalPages = Math.ceil(total / 50);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams();
    if (key !== "table" && tableFilter) params.set("table", tableFilter);
    if (key !== "action" && actionFilter) params.set("action", actionFilter);
    if (value) params.set(key, value);
    params.set("page", "1");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (tableFilter) params.set("table", tableFilter);
    if (actionFilter) params.set("action", actionFilter);
    params.set("page", String(p));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} audit records</p>
      </div>

      <div className="flex gap-3 bg-white p-3 rounded-lg border">
        <Select value={tableFilter} onValueChange={(v) => updateFilter("table", v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Tables" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            <SelectItem value="spares">spares</SelectItem>
            <SelectItem value="stock_transactions">stock_transactions</SelectItem>
            <SelectItem value="preservation_logs">preservation_logs</SelectItem>
            <SelectItem value="profiles">profiles</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => updateFilter("action", v === "all" ? "" : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {["Timestamp", "Table", "Action", "Record ID", "Changed By"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No audit records</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedLog(log)}>
                  <td className="px-3 py-2.5 font-mono-data text-xs whitespace-nowrap">{formatDateTime(log.changed_at)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{log.table_name}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", actionColor[log.action] ?? "bg-gray-100 text-gray-700")}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{log.record_id.slice(0, 8)}...</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{log.changed_by?.slice(0, 8) ?? "system"}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} records</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Audit Detail — {selectedLog?.action} on {selectedLog?.table_name}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Timestamp:</span> <span className="font-mono">{formatDateTime(selectedLog.changed_at)}</span></div>
                <div><span className="text-muted-foreground">Record ID:</span> <span className="font-mono">{selectedLog.record_id}</span></div>
                <div><span className="text-muted-foreground">Changed By:</span> <span className="font-mono">{selectedLog.changed_by ?? "system"}</span></div>
                <div><span className="text-muted-foreground">IP:</span> <span className="font-mono">{selectedLog.ip_address ?? "—"}</span></div>
              </div>
              <DiffView oldData={selectedLog.old_data} newData={selectedLog.new_data} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
