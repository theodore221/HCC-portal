"use client";
import { toast } from 'sonner';

import { useState } from "react";
import { Tables } from "@/lib/database.types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil, X } from "lucide-react";
import { updateMealPrice } from "../actions";

import { MEAL_ORDER } from "@/lib/catering";

interface MealsTabProps {
  mealPrices: Tables<"meal_prices">[];
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  Breakfast: "Breakfast",
  "Morning Tea": "Morning Tea",
  Lunch: "Lunch",
  "Afternoon Tea": "Afternoon Tea",
  Dinner: "Dinner",
  Dessert: "Dessert",
  Supper: "Supper",
};

export function MealsTab({ mealPrices }: MealsTabProps) {
  const sortedMealPrices = [...mealPrices].sort((a, b) => {
    const indexA = MEAL_ORDER.indexOf(a.meal_type);
    const indexB = MEAL_ORDER.indexOf(b.meal_type);
    return indexA - indexB;
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const columns: ColumnDef<Tables<"meal_prices">>[] = [
    {
      accessorKey: "meal_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Meal Type" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-border/70 bg-white px-2.5 py-1 text-xs font-medium text-text"
          >
            {MEAL_TYPE_LABELS[row.original.meal_type] || row.original.meal_type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price ($)" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditablePriceCell
              mealPrice={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm font-semibold text-text">
            ${Number(row.original.price).toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase text-text-light">
          Actions
        </span>
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return null;
        }
        return (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditingId(row.original.id)}
            className="text-text-light hover:text-text"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        );
      },
      meta: "text-right",
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={sortedMealPrices} zebra />
    </div>
  );
}

function EditablePriceCell({
  mealPrice,
  onDone,
}: {
  mealPrice: Tables<"meal_prices">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(mealPrice.price.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMealPrice(mealPrice.id, { price: parseFloat(value) || 0 });
      onDone();
      toast.success("Meal price updated");
    } catch (error) {
      toast.error("Error updating meal price");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24"
        disabled={isLoading}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
