"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PercolatedCoffeeToggleProps {
  checked: boolean;
  quantity: number | null;
  onToggle: (checked: boolean, quantity: number | null) => Promise<void>;
  disabled?: boolean;
}

export function PercolatedCoffeeToggle({
  checked,
  quantity,
  onToggle,
  disabled = false,
}: PercolatedCoffeeToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);
  const [qty, setQty] = useState(quantity?.toString() ?? "20");
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async (newChecked: boolean) => {
    setIsChecked(newChecked);
    setIsPending(true);
    try {
      const qtyNum = parseInt(qty);
      await onToggle(newChecked, newChecked ? (isNaN(qtyNum) ? 20 : qtyNum) : null);
    } catch {
      setIsChecked(!newChecked);
    } finally {
      setIsPending(false);
    }
  };

  const handleQuantityBlur = async () => {
    if (!isChecked) return;

    const qtyNum = parseInt(qty);
    if (isNaN(qtyNum) || qtyNum < 1) {
      setQty(quantity?.toString() ?? "20");
      return;
    }

    if (qtyNum !== quantity) {
      setIsPending(true);
      try {
        await onToggle(true, qtyNum);
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 text-sm",
        disabled && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        <Switch
          id="percolated-coffee"
          checked={isChecked}
          onCheckedChange={handleToggle}
          disabled={disabled || isPending}
        />
        <Label htmlFor="percolated-coffee" className="text-sm text-text-light">
          ☕ Percolated Coffee
        </Label>
      </div>
      {isChecked && (
        <Input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={handleQuantityBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="h-7 w-16 text-center text-xs"
          disabled={disabled || isPending}
          placeholder="Qty"
        />
      )}
      {isPending && (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
