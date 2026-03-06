"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Tables } from "@/lib/database.types";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Pencil, Trash2, Plus, Mail, Phone, Palette, User, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { createCaterer, updateCaterer, deleteCaterer, reinviteCaterer } from "./actions";

interface CaterersClientProps {
  caterers: Tables<"caterers">[];
}

type CatererFormData = {
  name: string;
  email: string;
  phone: string;
  color: string;
};

export default function CaterersClient({ caterers }: CaterersClientProps) {
  const [editingCaterer, setEditingCaterer] = useState<Tables<"caterers"> | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<Tables<"caterers">>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="h-3.5 w-3.5 rounded-full border border-gray-200 shrink-0"
            style={{ backgroundColor: row.original.color ?? "#3788d8" }}
          />
          <span className="font-medium text-gray-900">{row.original.name}</span>
          {row.original.active === false && (
            <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-400">
              Inactive
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.email || "—"}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.phone || "—"}</span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase text-gray-400">Actions</span>
      ),
      cell: ({ row }) => {
        const caterer = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            {/* Toggle active */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                startTransition(async () => {
                  try {
                    await updateCaterer(caterer.id, { active: !caterer.active });
                    toast.success(caterer.active ? "Caterer deactivated" : "Caterer activated");
                  } catch {
                    toast.error("Failed to update caterer");
                  }
                });
              }}
              className="text-gray-400 hover:text-gray-700"
              title={caterer.active !== false ? "Deactivate" : "Activate"}
              disabled={isPending}
            >
              {caterer.active !== false ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </Button>
            {/* Re-invite */}
            {caterer.email && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await reinviteCaterer(caterer.id);
                      toast.success("Invitation sent");
                    } catch {
                      toast.error("Failed to send invitation");
                    }
                  });
                }}
                className="text-gray-400 hover:text-primary"
                title="Re-send invitation"
                disabled={isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {/* Edit */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditingCaterer(caterer);
                setIsEditOpen(true);
              }}
              className="text-gray-400 hover:text-gray-700"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {/* Delete */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setDeletingId(caterer.id);
                setDeletingName(caterer.name);
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open: boolean) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete caterer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingName}</strong> and cannot be undone.
              Any meal jobs assigned to this caterer will lose their assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!deletingId) return;
                startTransition(async () => {
                  try {
                    await deleteCaterer(deletingId);
                    toast.success("Caterer deleted");
                  } catch {
                    toast.error("Failed to delete caterer");
                  } finally {
                    setDeletingId(null);
                  }
                });
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
    } catch (err: any) {
      const msg = err?.message || `Error ${mode === "create" ? "creating" : "updating"} caterer`;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Add New Caterer" : "Edit Caterer"}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Add a new caterer. If you provide an email, they will receive an invitation to the portal."
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
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
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
              <span className="text-xs text-gray-400 font-normal">(will receive invitation)</span>
            )}
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
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
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+61 4xx xxx xxx"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colour
          </Label>
          <div className="flex items-center gap-3">
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData((p) => ({ ...p, color }))}
              disabled={isLoading}
            />
            <span className="text-sm text-gray-400">Used for calendar events</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? mode === "create" ? "Creating..." : "Updating..."
              : mode === "create" ? "Create Caterer" : "Update Caterer"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
