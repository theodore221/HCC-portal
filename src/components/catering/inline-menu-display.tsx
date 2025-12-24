"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
}

interface InlineMenuDisplayProps {
  selectedIds: string[];
  selectedLabel: string | null;
  availableItems: MenuItem[];
  placeholder: string;
  onSelect: (itemIds: string[]) => Promise<void>;
  disabled?: boolean;
}

export function InlineMenuDisplay({
  selectedIds,
  selectedLabel,
  availableItems,
  placeholder,
  onSelect,
  disabled = false,
}: InlineMenuDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSelect = async (value: string) => {
    setIsPending(true);
    try {
      await onSelect(value === "none" ? [] : [value]);
    } finally {
      setIsPending(false);
      setIsEditing(false);
    }
  };

  if (isEditing && !disabled) {
    return (
      <Select
        value={selectedIds[0] ?? "none"}
        onValueChange={handleSelect}
        disabled={isPending}
        defaultOpen={true}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false);
        }}
      >
        <SelectTrigger className="h-10 w-full border-border/60 bg-white/95 shadow-soft">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          align="start"
          sideOffset={6}
          className="w-[var(--radix-select-trigger-width)] max-w-[420px] border-border/60 bg-white shadow-lg"
        >
          <SelectItem
            value="none"
            className="rounded-md py-2 leading-snug focus:bg-olive-100 focus:text-olive-900 data-[highlighted]:bg-olive-100 data-[highlighted]:text-olive-900 data-[state=checked]:bg-olive-50 data-[state=checked]:text-olive-900 data-[state=checked]:font-semibold"
          >
            None
          </SelectItem>
          {availableItems.length > 0 ? (
            availableItems.map((item) => (
              <SelectItem
                key={item.id}
                value={item.id}
                className="whitespace-normal rounded-md py-2 leading-snug focus:bg-olive-100 focus:text-olive-900 data-[highlighted]:bg-olive-100 data-[highlighted]:text-olive-900 data-[state=checked]:bg-olive-50 data-[state=checked]:text-olive-900 data-[state=checked]:font-semibold"
              >
                {item.label}
              </SelectItem>
            ))
          ) : (
            <div className="py-2 px-2 text-sm text-muted-foreground text-center">
              No items found
            </div>
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-border/60 bg-white/90 px-3 py-2 shadow-soft transition-colors",
        !disabled && "cursor-pointer hover:border-olive-200"
      )}
    >
      <span
        className={cn(
          "truncate text-sm",
          selectedLabel
            ? "text-olive-900 font-semibold"
            : "text-neutral-300 font-medium"
        )}
      >
        {selectedLabel || placeholder}
      </span>
      {!disabled && (
        <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}
