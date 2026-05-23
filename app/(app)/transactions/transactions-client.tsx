"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { StockTransaction, TransactionFilters } from "@/lib/types";
import { formatDate, downloadCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OemBadge } from "@/components/spares/oem-badge";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialTransactions: StockTransaction[];
  total: number;
  initialFilters: TransactionFilters;
}

const movementColor: Record<string, string> = {
  issue: "bg-red-100 text-red-700",
  receipt: "bg-green-100 text-green-700",
  adjustment: "bg-blue-100 text-blue-700",
  return: "bg-purple-100 text-purple-700",
};

export function TransactionsClient({ initialTransactions, total, initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(initialFilters.search ?? "");

  const totalPages = Math.ceil(total / initialFilters.pageSize);

  function buildParams(overrides: Record<string, string>) {
    const base: Record<string, string> = {};
    if (searchValue) base.search = searchValue;
    if (initialFilters.movement_type) base.movement_type = initialFilters.movement_type;
    if (initialFilters.oem) base.oem = initialFilters.oem;
    if (initialFilters.date_from) base.date_from = initialFilters.date_from;
    if (initialFilters.date_to) base.date_to = initialFilters.date_to;
    const merged = { ...base, ...overrides };
    return new URLSearchParams(merged).toString();
  }

  function updateFilter(key: string, value: string) {
    const overrides: Record<string, string> = {};
    if (value) overrides[key] = value;
    const params = buildParams({ ...overrides, page: "1" });
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  function handleSearchChange(v: string) {
    setSearchValue(v);
    const t = setTimeout(() => {
      const params = buildParams({ search: v, page: "1" });
      startTransition(() => router.push(`${pathname}?${params}`));
    }, 300);
    return () => clearTimeout(t);
  }

  function goToPage(p: number) {
    startTransition(() => router.push(`${pathname}?${buildParams({ page: String(p) })}`));
  }

  function handleExport() {
    downloadCsv(
      initialTransactions.map((tx) => ({
        date: tx.transaction_date,
        time: new Date(tx.created_at).toLocaleTimeString("en-AU"),
        movement_type: tx.movement_type,
        tag: tx.spare_tag,
        part_number: tx.spare_part_number,
        description: tx.spare_description,
        bin: tx.spare_bin,
        oem: tx.spare_oem,
        quantity: tx.quantity,
        qty_before: tx.qty_before,
        qty_after: tx.qty_after,
        issued_to: tx.issued_to,
        work_order: tx.work_order,
        cost_code: tx.cost_code,
        remarks: tx.remarks,
      })),
      "transactions.csv"
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} records found</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 bg-white p-3 rounded-lg border">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search description, tag, issued to, WO..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={initialFilters.movement_type ?? ""} onValueChange={(v) => updateFilter("movement_type", v === "all" ? "" : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Movement Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="issue">Issue</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="return">Return</SelectItem>
          </SelectContent>
        </Select>
        <Select value={initialFilters.oem ?? ""} onValueChange={(v) => updateFilter("oem", v === "all" ? "" : v)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="OEM" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All OEMs</SelectItem>
            <SelectItem value="ABB">ABB</SelectItem>
            <SelectItem value="TAKRAF">TAKRAF</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={initialFilters.date_from ?? ""}
          onChange={(e) => updateFilter("date_from", e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          value={initialFilters.date_to ?? ""}
          onChange={(e) => updateFilter("date_to", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {["Date", "Time", "Type", "Tag", "Part No.", "Description", "Bin", "OEM", "Qty", "Before", "After", "Issued To", "Work Order", "Cost Code", "Remarks"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr><td colSpan={15} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : initialTransactions.length === 0 ? (
                <tr><td colSpan={15} className="px-4 py-8 text-center text-muted-foreground">No transactions found</td></tr>
              ) : initialTransactions.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-mono-data whitespace-nowrap">{formatDate(tx.transaction_date)}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs whitespace-nowrap">{new Date(tx.created_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", movementColor[tx.movement_type] ?? "bg-gray-100 text-gray-700")}>
                      {tx.movement_type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono-data text-xs">{tx.spare_tag ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs">{tx.spare_part_number ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs max-w-[180px] truncate">{tx.spare_description ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs">{tx.spare_bin ?? "—"}</td>
                  <td className="px-3 py-2.5"><OemBadge oem={tx.spare_oem} /></td>
                  <td className="px-3 py-2.5 font-mono-data font-semibold">{tx.quantity}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs text-muted-foreground">{tx.qty_before}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs">{tx.qty_after}</td>
                  <td className="px-3 py-2.5 text-xs max-w-[120px] truncate">{tx.issued_to ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs">{tx.work_order ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs">{tx.cost_code ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs max-w-[120px] truncate">{tx.remarks ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <span className="text-xs text-muted-foreground">Page {initialFilters.page} of {totalPages} · {total} total records</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={initialFilters.page <= 1} onClick={() => goToPage(initialFilters.page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" disabled={initialFilters.page >= totalPages} onClick={() => goToPage(initialFilters.page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
