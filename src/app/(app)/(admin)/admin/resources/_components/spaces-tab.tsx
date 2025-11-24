"use client";

import { useState } from "react";
import { Tables } from "@/lib/database.types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Pencil, X } from "lucide-react";
import { updateSpace } from "../actions";
import { useToast } from "@/components/ui/use-toast";

interface SpacesTabProps {
  spaces: Tables<"spaces">[];
}

export function SpacesTab({ spaces }: SpacesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const columns: ColumnDef<Tables<"spaces">>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-text">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Capacity" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableCapacityCell
              space={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {row.original.capacity || "—"}
          </span>
        );
      },
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
              space={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {row.original.price
              ? `$${Number(row.original.price).toFixed(2)}`
              : "$0.00"}
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
          return null; // Actions handled within editable cells
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
      <DataTable columns={columns} data={spaces} zebra />
    </div>
  );
}

function EditableCapacityCell({
  space,
  onDone,
}: {
  space: Tables<"spaces">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(space.capacity?.toString() || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSpace(space.id, { capacity: parseInt(value) || null });
      onDone();
      toast({ title: "Space updated" });
    } catch (error) {
      toast({ title: "Error updating space", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
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

function EditablePriceCell({
  space,
  onDone,
}: {
  space: Tables<"spaces">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(space.price?.toString() || "0");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSpace(space.id, { price: parseFloat(value) || 0 });
      onDone();
      toast({ title: "Space updated" });
    } catch (error) {
      toast({ title: "Error updating space", variant: "destructive" });
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
