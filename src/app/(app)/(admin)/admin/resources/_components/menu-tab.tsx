"use client";

import { useState } from "react";
import { Tables } from "@/lib/database.types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil, Trash2, X, Plus } from "lucide-react";
import { updateMenuItem, createMenuItem, deleteMenuItem } from "../actions";
import { useToast } from "@/components/ui/use-toast";

interface MenuTabProps {
  menuItems: (Tables<"menu_items"> & { caterers: { name: string } | null })[];
  caterers: Tables<"caterers">[];
  mealPrices: Tables<"meal_prices">[];
}

export function MenuTab({ menuItems, caterers, mealPrices }: MenuTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteMenuItem(id);
      toast({ title: "Menu item deleted" });
    } catch (error) {
      toast({ title: "Error deleting menu item", variant: "destructive" });
    }
  };

  const columns: ColumnDef<
    Tables<"menu_items"> & { caterers: { name: string } | null }
  >[] = [
    {
      accessorKey: "label",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Label" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableLabelCell
              item={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="font-medium text-text">{row.original.label}</span>
        );
      },
    },
    {
      accessorKey: "meal_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Meal Type" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableMealTypeCell
              item={row.original}
              mealPrices={mealPrices}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return row.original.meal_type ? (
          <Badge variant="outline" className="border-border/70 bg-white">
            {row.original.meal_type}
          </Badge>
        ) : (
          <span className="text-sm text-text-light">—</span>
        );
      },
    },
    {
      id: "caterer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Default Caterer" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableCatererCell
              item={row.original}
              caterers={caterers}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {row.original.caterers?.name || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "allergens",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Allergens" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableAllergensCell
              item={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {row.original.allergens?.map((a) => (
              <Badge key={a} variant="outline" className="text-xs">
                {a}
              </Badge>
            )) || <span className="text-sm text-text-light">—</span>}
          </div>
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
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditingId(row.original.id)}
              className="text-text-light hover:text-text"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(row.original.id)}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      meta: "text-right",
    },
  ];

  // Prepend create row if creating
  const dataWithCreateRow = isCreating
    ? [
        {
          id: "__creating__",
          label: "",
          meal_type: null,
          default_caterer_id: null,
          allergens: [],
          caterers: null,
          created_at: "",
          updated_at: "",
        } as any,
        ...menuItems,
      ]
    : menuItems;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>
      <DataTable
        columns={columns.map((col) => {
          if (isCreating && col.id !== "actions") {
            return {
              ...col,
              cell: ({ row }) => {
                if (row.original.id === "__creating__") {
                  if (col.accessorKey === "label") return <CreateLabelCell />;
                  if (col.accessorKey === "meal_type")
                    return <CreateMealTypeCell mealPrices={mealPrices} />;
                  if (col.id === "caterer")
                    return <CreateCatererCell caterers={caterers} />;
                  if (col.accessorKey === "allergens")
                    return <CreateAllergensCell />;
                }
                return col.cell ? col.cell({ row } as any) : null;
              },
            };
          }
          if (col.id === "actions" && isCreating) {
            return {
              ...col,
              cell: ({ row }) => {
                if (row.original.id === "__creating__") {
                  return <CreateActions onDone={() => setIsCreating(false)} />;
                }
                return col.cell ? col.cell({ row } as any) : null;
              },
            };
          }
          return col;
        })}
        data={dataWithCreateRow}
        zebra
      />
    </div>
  );
}

// Create mode cells
let createState = {
  label: "",
  meal_type: null as any,
  default_caterer_id: null as string | null,
  allergens: "",
};

function CreateLabelCell() {
  return (
    <Input
      value={createState.label}
      onChange={(e) => (createState.label = e.target.value)}
      placeholder="Item Name"
      autoFocus
    />
  );
}

function CreateMealTypeCell({
  mealPrices,
}: {
  mealPrices: Tables<"meal_prices">[];
}) {
  return (
    <Select
      value={createState.meal_type || ""}
      onValueChange={(val: any) => (createState.meal_type = val)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        {mealPrices.map((mp) => (
          <SelectItem key={mp.id} value={mp.meal_type}>
            {mp.meal_type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreateCatererCell({ caterers }: { caterers: Tables<"caterers">[] }) {
  return (
    <Select
      value={createState.default_caterer_id || "none"}
      onValueChange={(val) =>
        (createState.default_caterer_id = val === "none" ? null : val)
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select caterer" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {caterers.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreateAllergensCell() {
  return (
    <Input
      value={createState.allergens}
      onChange={(e) => (createState.allergens = e.target.value)}
      placeholder="Comma separated"
    />
  );
}

function CreateActions({ onDone }: { onDone: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!createState.label) return;
    setIsLoading(true);
    try {
      await createMenuItem({
        label: createState.label,
        meal_type: createState.meal_type,
        default_caterer_id: createState.default_caterer_id,
        allergens: createState.allergens
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      createState = {
        label: "",
        meal_type: null,
        default_caterer_id: null,
        allergens: "",
      };
      onDone();
      toast({ title: "Menu item created" });
    } catch (error) {
      toast({ title: "Error creating menu item", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-end">
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

// Editable cells
function EditableLabelCell({
  item,
  onDone,
}: {
  item: Tables<"menu_items">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(item.label);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, { label: value });
      onDone();
      toast({ title: "Menu item updated" });
    } catch (error) {
      toast({ title: "Error updating menu item", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
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

function EditableMealTypeCell({
  item,
  mealPrices,
  onDone,
}: {
  item: Tables<"menu_items">;
  mealPrices: Tables<"meal_prices">[];
  onDone: () => void;
}) {
  const [value, setValue] = useState(item.meal_type || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, { meal_type: value as any });
      onDone();
      toast({ title: "Menu item updated" });
    } catch (error) {
      toast({ title: "Error updating menu item", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={setValue} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {mealPrices.map((mp) => (
            <SelectItem key={mp.id} value={mp.meal_type}>
              {mp.meal_type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

function EditableCatererCell({
  item,
  caterers,
  onDone,
}: {
  item: Tables<"menu_items">;
  caterers: Tables<"caterers">[];
  onDone: () => void;
}) {
  const [value, setValue] = useState(item.default_caterer_id || "none");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, {
        default_caterer_id: value === "none" ? null : value,
      });
      onDone();
      toast({ title: "Menu item updated" });
    } catch (error) {
      toast({ title: "Error updating menu item", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={setValue} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder="Select caterer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {caterers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

function EditableAllergensCell({
  item,
  onDone,
}: {
  item: Tables<"menu_items">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(item.allergens?.join(", ") || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, {
        allergens: value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      onDone();
      toast({ title: "Menu item updated" });
    } catch (error) {
      toast({ title: "Error updating menu item", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Comma separated"
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
