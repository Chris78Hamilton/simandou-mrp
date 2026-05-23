export type UserRole = "viewer" | "editor" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OEM = "ABB" | "TAKRAF";
export type Category = "PS" | "SPS" | "ST";
export type SubCommodityPS = "BLUE LINE" | "RED LINE" | "ST";
export type SubCommoditySPS = "COMM" | "CI" | "2YR" | "ST";
export type SubCommodityST = "ABB" | "TAKRAF";
export type SubCommodity = SubCommodityPS | SubCommoditySPS | SubCommodityST;
export type MovementType = "receipt" | "issue" | "adjustment" | "return";
export type PreservationStatus = "OVERDUE" | "DUE_SOON" | "OK" | "N/A";

export const UOM_OPTIONS = ["EA", "SET", "KG", "DRM", "LTR", "MTR", "PKT", "BOX", "PAR", "ROL", "NOS", "BAG", "CAN", "TUB", "SHT"] as const;
export type UOM = typeof UOM_OPTIONS[number];

export const SUB_COMMODITY_BY_CATEGORY: Record<Category, SubCommodity[]> = {
  PS: ["BLUE LINE", "RED LINE", "ST"],
  SPS: ["COMM", "CI", "2YR", "ST"],
  ST: ["ABB", "TAKRAF"],
};

export interface System {
  id: string;
  name: string;
  code: string;
}

export interface Subsystem {
  id: string;
  system_id: string;
  name: string;
  code: string;
}

export interface Spare {
  id: string;
  tag: string | null;
  item_description: string | null;
  part_number: string | null;
  manf_part_number: string | null;
  pkg_no: string | null;
  description: string;
  category: Category | null;
  sub_commodity: SubCommodity | null;
  oem: OEM | null;
  sub_manufacturer: string | null;
  area: string | null;
  system_id: string | null;
  subsystem_id: string | null;
  shipment_ref: string | null;
  packing_list: string | null;
  osd: boolean;
  delivered: boolean;
  received_date: string | null;
  qty_stock: number;
  qty_min: number;
  qty_max: number | null;
  unit: string | null;
  warehouse: string | null;
  bin_location: string | null;
  site_location: string | null;
  unit_cost: number | null;
  currency: string;
  lead_time_weeks: number | null;
  requires_preservation: boolean;
  preservation_freq_days: number | null;
  preservation_doc: string | null;
  last_preservation_date: string | null;
  next_preservation_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  systems?: System | null;
  subsystems?: Subsystem | null;
}

export interface StockTransaction {
  id: string;
  spare_id: string | null;
  movement_type: MovementType;
  quantity: number;
  qty_before: number;
  qty_after: number;
  issued_to: string | null;
  work_order: string | null;
  cost_code: string | null;
  remarks: string | null;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
  spare_tag: string | null;
  spare_description: string | null;
  spare_part_number: string | null;
  spare_oem: OEM | null;
  spare_bin: string | null;
}

export interface PreservationLog {
  id: string;
  spare_id: string;
  performed_date: string;
  performed_by: string;
  condition_found: string | null;
  action_taken: string | null;
  next_due_date: string | null;
  certificate_ref: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
  ip_address: string | null;
}

export interface DashboardMetrics {
  total_spares: number;
  total_abb: number;
  total_takraf: number;
  total_value_usd: number;
  zero_stock: number;
  low_stock: number;
  preservation_due: number;
  comm_count: number;
  ci_count: number;
  tyr_count: number;
  st_count: number;
  transactions_today: number;
}

export interface SparesFilters {
  search?: string;
  oem?: OEM | "";
  category?: Category | "";
  sub_commodity?: SubCommodity | "";
  system_id?: string;
  stock_status?: "zero" | "low" | "ok" | "";
  osd?: "yes" | "no" | "";
  delivered?: "yes" | "no" | "";
  page: number;
  pageSize: number;
}

export interface TransactionFilters {
  search?: string;
  movement_type?: MovementType | "";
  oem?: OEM | "";
  date_from?: string;
  date_to?: string;
  page: number;
  pageSize: number;
}
