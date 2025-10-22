import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
};

export interface ComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyState?: string;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select option",
  emptyState = "No results",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      [option.label, option.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [options, search]);

  const selected = value ? options.find((option) => option.value === value) : null;

  React.useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", listener);
    }
    return () => document.removeEventListener("mousedown", listener);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <span aria-hidden className="text-xs text-olive-500">▾</span>
      </Button>
      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-olive-100 bg-white p-3 shadow-soft">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="mb-2 w-full rounded-lg border border-olive-200 px-3 py-2 text-sm text-olive-900 placeholder:text-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500"
          />
          <div className="max-h-60 space-y-1 overflow-auto">
            {filtered.length === 0 ? (
              <p className="rounded-lg bg-olive-50 px-3 py-2 text-sm text-olive-600">{emptyState}</p>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const next = isSelected ? null : option.value;
                      onChange(next);
                      setSearch("");
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm",
                      isSelected
                        ? "bg-olive-100 font-semibold text-olive-900"
                        : "text-olive-700 hover:bg-olive-50"
                    )}
                  >
                    <span className="block text-sm">{option.label}</span>
                    {option.description ? (
                      <span className="block text-xs text-olive-500">{option.description}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
