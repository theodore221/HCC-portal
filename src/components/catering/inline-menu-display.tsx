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
        <SelectTrigger className="h-9 bg-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {availableItems.length > 0 ? (
            availableItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
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
        "flex items-center gap-2 group min-h-[36px] py-1",
        !disabled && "cursor-pointer"
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
