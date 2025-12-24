"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface MealServesDisplayProps {
  count: number;
  editable?: boolean;
  onUpdate?: (newCount: number) => Promise<void>;
  disabled?: boolean;
  label?: string;
}

export function MealServesDisplay({
  count,
  editable = false,
  onUpdate,
  disabled = false,
  label = "serves",
}: MealServesDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(count.toString());
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setValue(count.toString());
    }
  }, [count, isEditing]);

  const handleSave = async () => {
    const newCount = parseInt(value);
    if (isNaN(newCount) || newCount < 0) {
      setValue(count.toString());
      setIsEditing(false);
      return;
    }

    if (newCount !== count && onUpdate) {
      setIsPending(true);
      try {
        await onUpdate(newCount);
      } finally {
        setIsPending(false);
      }
    }
    setIsEditing(false);
  };

  if (isEditing && editable) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setValue(count.toString());
              setIsEditing(false);
            }
          }}
          className="h-9 w-20 text-center text-lg font-bold"
          disabled={isPending}
          autoFocus
        />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => editable && !disabled && setIsEditing(true)}
      className={cn(
        "flex flex-col items-end group",
        editable && !disabled && "cursor-pointer"
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-2xl font-bold text-olive-900">{count}</span>
        {editable && !disabled && (
          <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
