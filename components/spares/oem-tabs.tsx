"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "All",                 value: ""    },
  { label: "SCO - Commissioning", value: "SCO" },
  { label: "S2Y - 2 Year Ops",    value: "S2Y" },
  { label: "SCA - Capital",       value: "SCA" },
];

export function OemTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("spare_type") ?? "";

  return (
    <div className="flex gap-1 border-b border-gray-200 mb-0 px-6 pt-4 bg-white">
      {TABS.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.value) params.set("spare_type", tab.value);
        else params.delete("spare_type");
        params.delete("page");
        return (
          <Link
            key={tab.value}
            href={`${pathname}?${params.toString()}`}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors whitespace-nowrap",
              active === tab.value
                ? "bg-white border-gray-200 text-gray-900 -mb-px z-10"
                : "bg-gray-50 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
