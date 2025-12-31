// @ts-nocheck
"use client";

import { useState } from "react";
import { Tables } from "@/lib/database.types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { Check, Pencil, Trash2, X, Plus } from "lucide-react";
import { updateCaterer, createCaterer, deleteCaterer } from "../actions";
import { useToast } from "@/components/ui/use-toast";

interface CaterersTabProps {
  caterers: Tables<"caterers">[];
}

export function CaterersTab({ caterers }: CaterersTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const columns: ColumnDef<Tables<"caterers">>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableNameCell
              caterer={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="font-medium text-text">{row.original.name}</span>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableEmailCell
              caterer={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">{row.original.email || "—"}</span>
        );
      },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditablePhoneCell
              caterer={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">{row.original.phone || "—"}</span>
        );
      },
    },
    {
      accessorKey: "color",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Color" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableColorCell
              caterer={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <div
            className="h-6 w-6 rounded border border-olive-100"
            style={{ backgroundColor: row.original.color ?? "#3788d8" }}
            title={row.original.color ?? "#3788d8"}
          />
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
              onClick={async () => {
                if (confirm("Are you sure you want to delete this caterer?")) {
                  await deleteCaterer(row.original.id);
                }
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

  // Prepend a "Create New" row if creating
  const dataWithCreateRow = isCreating
    ? [
        {
          id: "__creating__",
          name: "",
          email: null,
          phone: null,
          color: "#3788d8",
          active: true,
          user_id: null,
        } as Tables<"caterers">,
        ...caterers,
      ]
    : caterers;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          Add Caterer
        </Button>
      </div>
      <DataTable
        columns={columns.map((col) => {
          if (col.id === "actions" && isCreating) {
            return {
              ...col,
              cell: ({ row }) => {
                if (row.original.id === "__creating__") {
                  return (
                    <CreateCatererActions onDone={() => setIsCreating(false)} />
                  );
                }
                return col.cell ? col.cell({ row } as any) : null;
              },
            };
          }
          if (
            isCreating &&
            (col.accessorKey === "name" ||
              col.accessorKey === "email" ||
              col.accessorKey === "phone" ||
              col.accessorKey === "color")
          ) {
            return {
              ...col,
              cell: ({ row }) => {
                if (row.original.id === "__creating__") {
                  if (col.accessorKey === "name") return <CreateNameCell />;
                  if (col.accessorKey === "email") return <CreateEmailCell />;
                  if (col.accessorKey === "phone") return <CreatePhoneCell />;
                  if (col.accessorKey === "color") return <CreateColorCell />;
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

// Create mode cells - store state globally
let createState = { name: "", email: "", phone: "", color: "#3788d8" };

function CreateNameCell() {
  return (
    <Input
      value={createState.name}
      onChange={(e) => (createState.name = e.target.value)}
      placeholder="Caterer Name"
      autoFocus
    />
  );
}

function CreateEmailCell() {
  return (
    <Input
      value={createState.email}
      onChange={(e) => (createState.email = e.target.value)}
      placeholder="Email"
    />
  );
}

function CreatePhoneCell() {
  return (
    <Input
      value={createState.phone}
      onChange={(e) => (createState.phone = e.target.value)}
      placeholder="Phone"
    />
  );
}

function CreateColorCell() {
  const [value, setValue] = useState(createState.color);
  return (
    <ColorPicker
      value={value}
      onChange={(color) => {
        setValue(color);
        createState.color = color;
      }}
    />
  );
}

function CreateCatererActions({ onDone }: { onDone: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!createState.name) return;
    setIsLoading(true);
    try {
      await createCaterer({
        name: createState.name,
        email: createState.email,
        phone: createState.phone,
        color: createState.color,
        active: true,
      });
      createState = { name: "", email: "", phone: "", color: "#3788d8" }; // Reset
      onDone();
      toast({ title: "Caterer created" });
    } catch (error) {
      toast({ title: "Error creating caterer", variant: "destructive" });
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

// Editable cells with individual state
function EditableNameCell({
  caterer,
  onDone,
}: {
  caterer: Tables<"caterers">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(caterer.name);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateCaterer(caterer.id, { name: value });
      onDone();
      toast({ title: "Caterer updated" });
    } catch (error) {
      toast({ title: "Error updating caterer", variant: "destructive" });
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

function EditableEmailCell({
  caterer,
  onDone,
}: {
  caterer: Tables<"caterers">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(caterer.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateCaterer(caterer.id, { email: value });
      onDone();
      toast({ title: "Caterer updated" });
    } catch (error) {
      toast({ title: "Error updating caterer", variant: "destructive" });
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

function EditablePhoneCell({
  caterer,
  onDone,
}: {
  caterer: Tables<"caterers">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(caterer.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateCaterer(caterer.id, { phone: value });
      onDone();
      toast({ title: "Caterer updated" });
    } catch (error) {
      toast({ title: "Error updating caterer", variant: "destructive" });
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

function EditableColorCell({
  caterer,
  onDone,
}: {
  caterer: Tables<"caterers">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(caterer.color ?? "#3788d8");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateCaterer(caterer.id, { color: value });
      onDone();
      toast({ title: "Caterer color updated" });
    } catch (error) {
      toast({ title: "Error updating color", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <ColorPicker value={value} onChange={setValue} disabled={isLoading} />
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
