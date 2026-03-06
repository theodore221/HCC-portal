// @ts-nocheck
"use client";

import { toast } from "sonner";
import { useState } from "react";
import type { Tables } from "@/lib/database.types";
import type { ColumnDef } from "@tanstack/react-table";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Pencil, Trash2, X, Plus } from "lucide-react";
import { updateMenuItem, createMenuItem, deleteMenuItem } from "./actions";
import { MEAL_ORDER } from "@/lib/catering";

interface MenuClientProps {
  menuItems: (Tables<"menu_items"> & { caterers: { name: string } | null })[];
  caterers: Tables<"caterers">[];
  mealPrices: Tables<"meal_prices">[];
}

export default function MenuClient({ menuItems, caterers, mealPrices }: MenuClientProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string>("");

  const columns: ColumnDef<Tables<"menu_items"> & { caterers: { name: string } | null }>[] = [
    {
      accessorKey: "label",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Label" />,
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return <EditableLabelCell item={row.original} onDone={() => setEditingId(null)} />;
        }
        return <span className="font-medium text-gray-900">{row.original.label}</span>;
      },
    },
    {
      accessorKey: "meal_type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Meal Type" />,
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
          <Badge variant="outline" className="border-gray-200 bg-white">
            {row.original.meal_type}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      },
    },
    {
      id: "caterer",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Default Caterer" />,
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
          <span className="text-sm text-gray-700">{row.original.caterers?.name || "—"}</span>
        );
      },
    },
    {
      accessorKey: "allergens",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Allergens" />,
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return <EditableAllergensCell item={row.original} onDone={() => setEditingId(null)} />;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {row.original.allergens?.map((a) => (
              <Badge key={a} variant="outline" className="text-xs">
                {a}
              </Badge>
            )) || <span className="text-sm text-gray-400">—</span>}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase text-gray-400">Actions</span>
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) return null;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditingId(row.original.id)}
              className="text-gray-400 hover:text-gray-700"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setDeletingId(row.original.id);
                setDeletingLabel(row.original.label);
              }}
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

  const [newItem, setNewItem] = useState({
    label: "",
    meal_type: null as any,
    default_caterer_id: null as string | null,
    allergens: "",
  });

  const handleCreate = async () => {
    if (!newItem.label) return;
    try {
      await createMenuItem({
        label: newItem.label,
        meal_type: newItem.meal_type,
        default_caterer_id: newItem.default_caterer_id,
        allergens: newItem.allergens.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setNewItem({ label: "", meal_type: null, default_caterer_id: null, allergens: "" });
      setIsCreating(false);
      toast.success("Menu item created");
    } catch {
      toast.error("Error creating menu item");
    }
  };

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
                  if (col.accessorKey === "label")
                    return (
                      <Input
                        value={newItem.label}
                        onChange={(e) => setNewItem((p) => ({ ...p, label: e.target.value }))}
                        placeholder="Item Name"
                        autoFocus
                      />
                    );
                  if (col.accessorKey === "meal_type")
                    return (
                      <Select value={newItem.meal_type || ""} onValueChange={(v) => setNewItem((p) => ({ ...p, meal_type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {[...mealPrices].sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)).map((mp) => (
                            <SelectItem key={mp.id} value={mp.meal_type}>{mp.meal_type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  if (col.id === "caterer")
                    return (
                      <Select value={newItem.default_caterer_id || "none"} onValueChange={(v) => setNewItem((p) => ({ ...p, default_caterer_id: v === "none" ? null : v }))}>
                        <SelectTrigger><SelectValue placeholder="Select caterer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {caterers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    );
                  if (col.accessorKey === "allergens")
                    return (
                      <Input
                        value={newItem.allergens}
                        onChange={(e) => setNewItem((p) => ({ ...p, allergens: e.target.value }))}
                        placeholder="Comma separated"
                      />
                    );
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
                  return (
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="icon" variant="ghost" onClick={handleCreate} disabled={!newItem.label}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setIsCreating(false)}>
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  );
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open: boolean) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingLabel}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deletingId) return;
                try {
                  await deleteMenuItem(deletingId);
                  toast.success("Menu item deleted");
                } catch {
                  toast.error("Error deleting menu item");
                } finally {
                  setDeletingId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditableLabelCell({ item, onDone }: { item: Tables<"menu_items">; onDone: () => void }) {
  const [value, setValue] = useState(item.label);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, { label: value });
      onDone();
      toast.success("Menu item updated");
    } catch {
      toast.error("Error updating menu item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} disabled={isLoading} />
      <Button size="icon" variant="ghost" onClick={handleSave} disabled={isLoading}>
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditableMealTypeCell({
  item, mealPrices, onDone,
}: {
  item: Tables<"menu_items">;
  mealPrices: Tables<"meal_prices">[];
  onDone: () => void;
}) {
  const [value, setValue] = useState(item.meal_type || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, { meal_type: value as any });
      onDone();
      toast.success("Menu item updated");
    } catch {
      toast.error("Error updating menu item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={setValue} disabled={isLoading}>
        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
        <SelectContent>
          {[...mealPrices].sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)).map((mp) => (
            <SelectItem key={mp.id} value={mp.meal_type}>{mp.meal_type}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" onClick={handleSave} disabled={isLoading}>
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditableCatererCell({
  item, caterers, onDone,
}: {
  item: Tables<"menu_items">;
  caterers: Tables<"caterers">[];
  onDone: () => void;
}) {
  const [value, setValue] = useState(item.default_caterer_id || "none");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, { default_caterer_id: value === "none" ? null : value });
      onDone();
      toast.success("Menu item updated");
    } catch {
      toast.error("Error updating menu item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={setValue} disabled={isLoading}>
        <SelectTrigger><SelectValue placeholder="Select caterer" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {caterers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" onClick={handleSave} disabled={isLoading}>
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditableAllergensCell({ item, onDone }: { item: Tables<"menu_items">; onDone: () => void }) {
  const [value, setValue] = useState(item.allergens?.join(", ") || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMenuItem(item.id, {
        allergens: value.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onDone();
      toast.success("Menu item updated");
    } catch {
      toast.error("Error updating menu item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Comma separated" disabled={isLoading} />
      <Button size="icon" variant="ghost" onClick={handleSave} disabled={isLoading}>
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
