"use client";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface Props {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({ options, value, onChange, placeholder = "Select...", emptyLabel = "None", disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-white p-0 shadow-md" align="start" sideOffset={4}>
          <div className="p-2 border-b">
            <Input
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            <button
              type="button"
              className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-100", !value && "bg-gray-100")}
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
              {emptyLabel}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-100", value === opt.value && "bg-gray-100")}
                onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
              >
                <Check className={cn("h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No results</p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
