import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DashboardMetrics, Spare, StockTransaction } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Activity,
  Shield,
  Boxes,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createClient();
  const serviceClient = createServiceClient();

  const [metricsResult, transactionsResult, preservationResult] = await Promise.all([
    serviceClient.rpc("get_dashboard_metrics"),
    supabase
      .from("stock_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("spares")
      .select("id, tag, description, oem, bin_location, next_preservation_date, requires_preservation")
      .eq("requires_preservation", true)
      .not("next_preservation_date", "is", null)
      .lte("next_preservation_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("next_preservation_date", { ascending: true })
      .limit(20),
  ]);

  // RETURNS json comes back wrapped as [{...}] from PostgREST — unwrap if needed
  const rawMetrics = metricsResult.data;
  const metricsData = (Array.isArray(rawMetrics) ? rawMetrics[0] : rawMetrics) as DashboardMetrics | null;

  return {
    metrics: metricsData,
    transactions: (transactionsResult.data ?? []) as StockTransaction[],
    preservation: (preservationResult.data ?? []) as Partial<Spare>[],
  };
}

function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass = "text-foreground",
  bgClass = "bg-white",
  subtext,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string;
  bgClass?: string;
  subtext?: string;
}) {
  return (
    <Card className={`${bgClass} border-0 shadow-sm`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${colorClass}`}>{value}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className={`p-2 rounded-lg ${bgClass === "bg-white" ? "bg-gray-100" : "bg-white/20"}`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const oem_movement_color: Record<string, string> = {
  issue: "bg-red-100 text-red-700",
  receipt: "bg-green-100 text-green-700",
  adjustment: "bg-blue-100 text-blue-700",
  return: "bg-purple-100 text-purple-700",
};

export default async function DashboardPage() {
  const { metrics, transactions, preservation } = await getDashboardData();

  const today = new Date().toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Rio Tinto Simandou — Materials Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Spares"
          value={metrics?.total_spares ?? 0}
          icon={Boxes}
          subtext={`ABB: ${metrics?.total_abb ?? 0} · TAKRAF: ${metrics?.total_takraf ?? 0}`}
        />
        <MetricCard
          title="Stock Value (USD)"
          value={formatCurrency(metrics?.total_value_usd ?? 0)}
          icon={DollarSign}
          subtext="Total inventory value"
        />
        <MetricCard
          title="Zero Stock"
          value={metrics?.zero_stock ?? 0}
          icon={AlertCircle}
          colorClass={metrics?.zero_stock ? "text-red-600" : "text-foreground"}
          bgClass={metrics?.zero_stock ? "bg-red-50" : "bg-white"}
          subtext="Items with no stock"
        />
        <MetricCard
          title="Low Stock"
          value={metrics?.low_stock ?? 0}
          icon={TrendingDown}
          colorClass={metrics?.low_stock ? "text-amber-600" : "text-foreground"}
          bgClass={metrics?.low_stock ? "bg-amber-50" : "bg-white"}
          subtext="Below minimum level"
        />
        <MetricCard
          title="Preservation Due (7d)"
          value={metrics?.preservation_due ?? 0}
          icon={Shield}
          colorClass={metrics?.preservation_due ? "text-orange-600" : "text-foreground"}
          bgClass={metrics?.preservation_due ? "bg-orange-50" : "bg-white"}
          subtext="Actions required soon"
        />
        <MetricCard
          title="Transactions Today"
          value={metrics?.transactions_today ?? 0}
          icon={Activity}
          subtext="Issues & receipts"
        />
        <MetricCard
          title="ABB Items"
          value={metrics?.total_abb ?? 0}
          icon={Package}
          colorClass="text-abb-blue"
          subtext={`COMM: ${metrics?.comm_count ?? 0} · CI: ${metrics?.ci_count ?? 0}`}
        />
        <MetricCard
          title="TAKRAF Items"
          value={metrics?.total_takraf ?? 0}
          icon={Package}
          colorClass="text-takraf-red"
          subtext={`2YR: ${metrics?.tyr_count ?? 0} · ST: ${metrics?.st_count ?? 0}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Description</th>
                    <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">Qty</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Issued To</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-xs">No recent transactions</td></tr>
                  ) : transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 font-mono-data whitespace-nowrap">{formatDate(tx.transaction_date)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${oem_movement_color[tx.movement_type] ?? "bg-gray-100 text-gray-700"}`}>
                          {tx.movement_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs truncate max-w-[160px]">{tx.spare_description ?? "—"}</td>
                      <td className="px-4 py-2 font-mono-data text-right">{tx.quantity}</td>
                      <td className="px-4 py-2 text-xs truncate max-w-[120px]">{tx.issued_to ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Preservation Due (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Tag</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Due Date</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preservation.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">No items due within 30 days</td></tr>
                  ) : preservation.map((item) => {
                    const isOverdue = item.next_preservation_date! <= today;
                    const isDueSoon = !isOverdue && item.next_preservation_date! <= in7Days;
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 font-mono-data text-xs">{item.tag ?? "—"}</td>
                        <td className="px-4 py-2 text-xs truncate max-w-[160px]">{item.description}</td>
                        <td className="px-4 py-2 font-mono-data text-xs whitespace-nowrap">{formatDate(item.next_preservation_date ?? null)}</td>
                        <td className="px-4 py-2">
                          {isOverdue ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">OVERDUE</span>
                          ) : isDueSoon ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">DUE SOON</span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">UPCOMING</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
