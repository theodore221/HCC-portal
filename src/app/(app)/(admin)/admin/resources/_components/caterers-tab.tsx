"use client";
import { toast } from 'sonner';

import { useState } from "react";
import { Tables } from "@/lib/database.types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Mail, Phone, Palette, User } from "lucide-react";
import { updateCaterer, createCaterer, deleteCaterer } from "../actions";

interface CaterersTabProps {
  caterers: Tables<"caterers">[];
}

type CatererFormData = {
  name: string;
  email: string;
  phone: string;
  color: string;
};

export function CaterersTab({ caterers }: CaterersTabProps) {
  const [editingCaterer, setEditingCaterer] = useState<Tables<"caterers"> | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const columns: ColumnDef<Tables<"caterers">>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full border border-olive-200 flex-shrink-0"
            style={{ backgroundColor: row.original.color ?? "#3788d8" }}
          />
          <span className="font-medium text-text">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-text">{row.original.email || "—"}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-text">{row.original.phone || "—"}</span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase text-text-light">
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditingCaterer(row.original);
              setIsEditOpen(true);
            }}
            className="text-text-light hover:text-text"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => {
              if (
                confirm(
                  `Are you sure you want to delete ${row.original.name}? This cannot be undone.`
                )
              ) {
                try {
                  await deleteCaterer(row.original.id);
                  toast.success("Caterer deleted successfully");
                } catch (error) {
                  toast.error("Error deleting caterer");
                }
              }
            }}
            className="text-red-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      meta: "text-right",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Caterer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <CatererForm
              mode="create"
              onSuccess={() => {
                setIsCreateOpen(false);
                toast.success("Caterer created successfully");
              }}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={caterers} zebra />

      {editingCaterer && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <CatererForm
              mode="edit"
              caterer={editingCaterer}
              onSuccess={() => {
                setIsEditOpen(false);
                setEditingCaterer(null);
                toast.success("Caterer updated successfully");
              }}
              onCancel={() => {
                setIsEditOpen(false);
                setEditingCaterer(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Separate form component for create/edit
function CatererForm({
  mode,
  caterer,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  caterer?: Tables<"caterers">;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CatererFormData>({
    name: caterer?.name ?? "",
    email: caterer?.email ?? "",
    phone: caterer?.phone ?? "",
    color: caterer?.color ?? "#3788d8",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "create") {
        await createCaterer({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          color: formData.color,
          active: true,
        });
      } else if (caterer) {
        await updateCaterer(caterer.id, {
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          color: formData.color,
        });
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.message || `Error ${mode === "create" ? "creating" : "updating"} caterer`;
      setError(errorMessage);
      toast.error(`Error ${mode === "create" ? "creating" : "updating"} caterer`, {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === "create" ? "Add New Caterer" : "Edit Caterer"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Add a new caterer to the system. If you provide an email, they will receive an invitation to access the portal."
            : "Update the caterer's information."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Caterer name"
            required
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
            {mode === "create" && (
              <span className="text-xs text-text-light font-normal">
                (will receive invitation)
              </span>
            )}
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="caterer@example.com"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color
          </Label>
          <div className="flex items-center gap-3">
            <ColorPicker
              value={formData.color}
              onChange={(color) =>
                setFormData((prev) => ({ ...prev, color }))
              }
              disabled={isLoading}
            />
            <span className="text-sm text-text-light">
              Used for calendar events
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
              ? "Create Caterer"
              : "Update Caterer"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
