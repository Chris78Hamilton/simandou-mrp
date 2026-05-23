import { createClient } from "@/lib/supabase/server";
import { StockTransaction, TransactionFilters } from "@/lib/types";
import { TransactionsClient } from "./transactions-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    search?: string;
    movement_type?: string;
    oem?: string;
    date_from?: string;
    date_to?: string;
    page?: string;
  };
}

async function getTransactions(filters: TransactionFilters) {
  const supabase = createClient();
  const { page, pageSize, search, movement_type, oem, date_from, date_to } = filters;

  let query = supabase
    .from("stock_transactions")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`spare_description.ilike.%${search}%,spare_tag.ilike.%${search}%,spare_part_number.ilike.%${search}%,issued_to.ilike.%${search}%,work_order.ilike.%${search}%`);
  }
  if (movement_type) query = query.eq("movement_type", movement_type);
  if (oem) query = query.eq("spare_oem", oem);
  if (date_from) query = query.gte("transaction_date", date_from);
  if (date_to) query = query.lte("transaction_date", date_to);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { transactions: (data ?? []) as StockTransaction[], total: count ?? 0 };
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const filters: TransactionFilters = {
    search: searchParams.search ?? "",
    movement_type: (searchParams.movement_type as TransactionFilters["movement_type"]) ?? "",
    oem: (searchParams.oem as TransactionFilters["oem"]) ?? "",
    date_from: searchParams.date_from ?? "",
    date_to: searchParams.date_to ?? "",
    page,
    pageSize: 50,
  };

  const { transactions, total } = await getTransactions(filters);

  return <TransactionsClient initialTransactions={transactions} total={total} initialFilters={filters} />;
}
