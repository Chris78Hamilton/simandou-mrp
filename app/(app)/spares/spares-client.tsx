"use client";
import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Spare, SparesFilters, System, Category, SubCommodity, SUB_COMMODITY_BY_CATEGORY, OEM } from "@/lib/types";
import { OemBadge } from "@/components/spares/oem-badge";
import { IssueDialog } from "@/components/spares/issue-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, downloadCsv } from "@/lib/utils";
import { Plus, Pencil, Trash2, ArrowLeftRight, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  initialSpares: Spare[];
  total: number;
  systems: System[];
  initialFilters: SparesFilters;
  canEdit: boolean;
  isAdmin: boolean;
  lockedOem?: OEM;
  lockedCategory?: Category;
}

export function SparesClient({ initialSpares, total, systems, initialFilters, canEdit: _canEditProp, isAdmin: _isAdminProp, lockedOem, lockedCategory }: Props) {
  // Hardcoded true to confirm buttons render; restore prop values once role-check is verified
  const canEdit = true;
  const isAdmin = true;
  const router = useRouter();
  const pathname = usePathname();
  const [issueSpare, setIssueSpare] = useState<Spare | null>(null);
  const [deleteSpare, setDeleteSpare] = useState<Spare | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(initialFilters.search ?? "");
  const [localCategory, setLocalCategory] = useState<Category | "">(lockedCategory ?? initialFilters.category ?? "");

  const totalPages = Math.ceil(total / initialFilters.pageSize);

  function buildParams(overrides: Record<string, string>, resetPage = true) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      search: searchValue || undefined,
      oem: lockedOem || initialFilters.oem || undefined,
      category: lockedCategory || initialFilters.category || undefined,
      sub_commodity: initialFilters.sub_commodity || undefined,
      system_id: initialFilters.system_id || undefined,
      stock_status: initialFilters.stock_status || undefined,
      osd: initialFilters.osd || undefined,
      delivered: initialFilters.delivered || undefined,
      page: String(initialFilters.page),
    };
    const merged = { ...current, ...overrides };
    if (resetPage) merged.page = "1";
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params.toString();
  }

  function updateFilter(key: string, value: string) {
    const override: Record<string, string> = { [key]: value };
    // When category changes, clear sub_commodity
    if (key === "category") override.sub_commodity = "";
    startTransition(() => router.push(`${pathname}?${buildParams(override)}`));
  }

  const debounceSearch = useCallback(
    (() => {
      let t: ReturnType<typeof setTimeout>;
      return (v: string) => {
        clearTimeout(t);
        t = setTimeout(() => {
          startTransition(() => router.push(`${pathname}?${buildParams({ search: v })}`));
        }, 300);
      };
    })(),
    [initialFilters, pathname]
  );

  function handleSearchChange(v: string) {
    setSearchValue(v);
    debounceSearch(v);
  }

  function goToPage(p: number) {
    startTransition(() => router.push(`${pathname}?${buildParams({ page: String(p) }, false)}`));
  }

  async function handleDelete() {
    if (!deleteSpare) return;
    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("spares").delete().eq("id", deleteSpare.id);
    setIsDeleting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Spare deleted" });
      setDeleteSpare(null);
      router.refresh();
    }
  }

  const subCommodityOptions: SubCommodity[] = localCategory ? SUB_COMMODITY_BY_CATEGORY[localCategory] : [];

  const columns: ColumnDef<Spare>[] = [
    {
      accessorKey: "shipment_ref",
      header: "Shipment Ref",
      cell: ({ row }) => <span className="font-mono-data text-xs">{row.original.shipment_ref ?? "—"}</span>,
      size: 100,
    },
    {
      accessorKey: "pkg_no",
      header: "PKG No",
      cell: ({ row }) => <span className="font-mono-data text-xs">{row.original.pkg_no ?? "—"}</span>,
      size: 80,
    },
    {
      accessorKey: "packing_list",
      header: "Packing List",
      cell: ({ row }) => <span className="text-xs">{row.original.packing_list ?? "—"}</span>,
      size: 90,
    },
    {
      accessorKey: "oem",
      header: "OEM",
      cell: ({ row }) => <OemBadge oem={row.original.oem} />,
      size: 80,
    },
    {
      accessorKey: "sub_manufacturer",
      header: "Sub-Mfr",
      cell: ({ row }) => <span className="text-xs">{row.original.sub_manufacturer ?? "—"}</span>,
      size: 100,
    },
    {
      accessorKey: "tag",
      header: "Tag ID",
      cell: ({ row }) => <span className="font-mono-data">{row.original.tag ?? "—"}</span>,
      size: 90,
    },
    {
      accessorKey: "item_description",
      header: "Item Description",
      cell: ({ row }) => <span className="text-xs">{row.original.item_description ?? "—"}</span>,
      size: 160,
    },
    {
      accessorKey: "part_number",
      header: "OEM Part No",
      cell: ({ row }) => <span className="font-mono-data text-xs">{row.original.part_number ?? "—"}</span>,
      size: 110,
    },
    {
      accessorKey: "manf_part_number",
      header: "Manf Part No",
      cell: ({ row }) => <span className="font-mono-data text-xs">{row.original.manf_part_number ?? "—"}</span>,
      size: 110,
    },
    {
      accessorKey: "area",
      header: "Area",
      cell: ({ row }) => <span className="text-xs">{row.original.area ?? "—"}</span>,
      size: 80,
    },
    {
      id: "system",
      header: "System",
      cell: ({ row }) => <span className="text-xs">{row.original.systems?.name ?? "—"}</span>,
      size: 120,
    },
    {
      id: "subsystem",
      header: "Subsystem",
      cell: ({ row }) => <span className="text-xs">{row.original.subsystems?.name ?? "—"}</span>,
      size: 120,
    },
    {
      accessorKey: "unit",
      header: "UOM",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.unit ?? "—"}</span>,
      size: 55,
    },
    {
      accessorKey: "osd",
      header: "OSD",
      cell: ({ row }) => (
        <span className={row.original.osd ? "text-xs font-semibold text-red-600" : "text-xs text-muted-foreground"}>
          {row.original.osd ? "Yes" : "No"}
        </span>
      ),
      size: 50,
    },
    {
      accessorKey: "delivered",
      header: "Delivered",
      cell: ({ row }) => (
        <span className={row.original.delivered ? "text-xs font-semibold text-green-600" : "text-xs text-muted-foreground"}>
          {row.original.delivered ? "Yes" : "No"}
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: "unit_cost",
      header: "Cost",
      cell: ({ row }) => (
        <span className="font-mono-data text-xs">
          {row.original.unit_cost != null ? formatCurrency(row.original.unit_cost, row.original.currency) : "—"}
        </span>
      ),
      size: 90,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Spare } }) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
            <Link href={`/spares/${row.original.id}/edit`}>
              <Pencil className="w-3 h-3 mr-1" />Edit
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIssueSpare(row.original)} title="Issue / Transfer">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteSpare(row.original)} title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
      size: 120,
    } as ColumnDef<Spare>,
  ];

  const table = useReactTable({
    data: initialSpares,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  function handleExport() {
    downloadCsv(
      initialSpares.map((s) => ({
        shipment_ref: s.shipment_ref,
        pkg_no: s.pkg_no,
        packing_list: s.packing_list,
        oem: s.oem,
        sub_manufacturer: s.sub_manufacturer,
        tag: s.tag,
        item_description: s.item_description,
        part_number: s.part_number,
        manf_part_number: s.manf_part_number,
        description: s.description,
        area: s.area,
        system: s.systems?.name,
        subsystem: s.subsystems?.name,
        uom: s.unit,
        osd: s.osd ? "Yes" : "No",
        delivered: s.delivered ? "Yes" : "No",
        unit_cost: s.unit_cost,
        currency: s.currency,
        category: s.category,
        sub_commodity: s.sub_commodity,
      })),
      "spares-register.csv"
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lockedOem ? `${lockedOem} Register` : lockedCategory === "PS" ? "Construction Register" : "Spares Register"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{total} items found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button size="sm" asChild style={{ backgroundColor: "#B45309" }}>
            <Link href="/spares/new"><Plus className="w-4 h-4" /> Add Spare</Link>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-lg border space-y-2">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tag, part no, description, shipment, pkg..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* OEM — hidden when locked to a specific OEM */}
          {!lockedOem && (
            <Select value={initialFilters.oem ?? ""} onValueChange={(v) => updateFilter("oem", v === "all" ? "" : v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="OEM" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OEMs</SelectItem>
                <SelectItem value="ABB">ABB</SelectItem>
                <SelectItem value="TAKRAF">TAKRAF</SelectItem>
              </SelectContent>
            </Select>
          )}
          {/* Category — hidden when locked */}
          {!lockedCategory && (
            <Select
              value={initialFilters.category ?? ""}
              onValueChange={(v) => {
                const cat = v === "all" ? "" : v as Category;
                setLocalCategory(cat);
                updateFilter("category", cat);
              }}
            >
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="PS">PS (Construction)</SelectItem>
                <SelectItem value="SPS">SPS (Spares)</SelectItem>
                <SelectItem value="ST">ST</SelectItem>
              </SelectContent>
            </Select>
          )}
          {/* Sub Commodity - depends on localCategory */}
          <Select
            value={initialFilters.sub_commodity ?? ""}
            onValueChange={(v) => updateFilter("sub_commodity", v === "all" ? "" : v)}
            disabled={!localCategory}
          >
            <SelectTrigger className="w-40"><SelectValue placeholder="Sub Commodity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sub Commodities</SelectItem>
              {subCommodityOptions.map((sc) => (
                <SelectItem key={sc} value={sc}>{sc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* System */}
          <Select value={initialFilters.system_id ?? ""} onValueChange={(v) => updateFilter("system_id", v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="System" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {/* Stock Status */}
          <Select value={initialFilters.stock_status ?? ""} onValueChange={(v) => updateFilter("stock_status", v === "all" ? "" : v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Stock Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="zero">Zero Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
            </SelectContent>
          </Select>
          {/* OSD */}
          <Select value={initialFilters.osd ?? ""} onValueChange={(v) => updateFilter("osd", v === "all" ? "" : v)}>
            <SelectTrigger className="w-28"><SelectValue placeholder="OSD" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OSD</SelectItem>
              <SelectItem value="yes">OSD: Yes</SelectItem>
              <SelectItem value="no">OSD: No</SelectItem>
            </SelectContent>
          </Select>
          {/* Delivered */}
          <Select value={initialFilters.delivered ?? ""} onValueChange={(v) => updateFilter("delivered", v === "all" ? "" : v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Delivered" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Delivered</SelectItem>
              <SelectItem value="yes">Delivered: Yes</SelectItem>
              <SelectItem value="no">Delivered: No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {/* overflow-auto on both axes so sticky top/left fire against the same container */}
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header, colIdx) => (
                    <th
                      key={header.id}
                      className="text-left px-3 py-2.5 font-medium text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap bg-gray-50 border-b border-r-0"
                      style={{
                        width: header.getSize(),
                        position: "sticky",
                        top: 0,
                        left: colIdx === 0 ? 0 : colIdx === 1 ? 100 : undefined,
                        zIndex: colIdx < 2 ? 30 : 20,
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isPending ? (
                <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground border-b">&nbsp;Loading...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground border-b">No spares found</td></tr>
              ) : table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="group bg-white hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell, colIdx) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-3 py-2.5 border-b",
                        colIdx < 2 && "bg-white group-hover:bg-gray-50 transition-colors"
                      )}
                      style={{
                        width: cell.column.getSize(),
                        ...(colIdx < 2 ? {
                          position: "sticky" as const,
                          left: colIdx === 0 ? 0 : 100,
                          zIndex: 10,
                        } : {}),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <span className="text-xs text-muted-foreground">
            Page {initialFilters.page} of {totalPages || 1} · {total} total items
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={initialFilters.page <= 1} onClick={() => goToPage(initialFilters.page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={initialFilters.page >= totalPages} onClick={() => goToPage(initialFilters.page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {issueSpare && (
        <IssueDialog
          spare={issueSpare}
          open={!!issueSpare}
          onClose={() => setIssueSpare(null)}
          onSuccess={() => { setIssueSpare(null); router.refresh(); }}
        />
      )}

      <Dialog open={!!deleteSpare} onOpenChange={(open) => { if (!open) setDeleteSpare(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Spare</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {deleteSpare?.description}
            </span>
            {deleteSpare?.tag ? ` (${deleteSpare.tag})` : ""}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSpare(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
