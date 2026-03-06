"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, Leaf } from "lucide-react";
import { createDietaryLabel, updateDietaryLabel, deleteDietaryLabel } from "./actions";

type DietaryLabel = {
  id: string;
  label: string;
  is_allergy: boolean;
  sort_order: number;
  active: boolean;
};

interface DietariesClientProps {
  labels: DietaryLabel[];
}

export default function DietariesClient({ labels }: DietariesClientProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIsAllergy, setNewIsAllergy] = useState(false);

  const sortedLabels = [...labels].sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      try {
        await createDietaryLabel({
          label: newLabel.trim(),
          is_allergy: newIsAllergy,
          sort_order: labels.length + 1,
        });
        setNewLabel("");
        setNewIsAllergy(false);
        setIsAdding(false);
        toast.success("Dietary label added");
      } catch {
        toast.error("Failed to add dietary label");
      }
    });
  };

  const handleToggleAllergy = (id: string, is_allergy: boolean) => {
    startTransition(async () => {
      try {
        await updateDietaryLabel(id, { is_allergy: !is_allergy });
      } catch {
        toast.error("Failed to update dietary label");
      }
    });
  };

  const handleToggleActive = (id: string, active: boolean) => {
    startTransition(async () => {
      try {
        await updateDietaryLabel(id, { active: !active });
        toast.success(active ? "Label deactivated" : "Label activated");
      } catch {
        toast.error("Failed to update dietary label");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" />
          Add Label
        </Button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">New Dietary Label</h4>
          <div className="flex gap-3">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Gluten Free, Vegan..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setNewIsAllergy(!newIsAllergy)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                newIsAllergy
                  ? "border-status-clay/30 bg-status-clay/10 text-status-clay"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              <AlertTriangle className="size-3.5" />
              {newIsAllergy ? "Allergy" : "Preference"}
            </button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending || !newLabel.trim()}>
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setIsAdding(false); setNewLabel(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Labels list */}
      <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {sortedLabels.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No dietary labels configured.</p>
        ) : (
          sortedLabels.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${!item.active ? "opacity-50" : ""}`}
            >
              <span className="text-xs font-mono text-gray-300 w-6 text-right shrink-0">
                {item.sort_order}
              </span>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">{item.label}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${
                    item.is_allergy
                      ? "border-status-clay/30 bg-status-clay/10 text-status-clay"
                      : "border-primary/20 bg-primary/5 text-primary"
                  }`}
                >
                  {item.is_allergy ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="size-2.5" /> Allergy
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Leaf className="size-2.5" /> Preference
                    </span>
                  )}
                </Badge>
                {!item.active && (
                  <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-400">
                    Inactive
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle allergy/preference */}
                <button
                  onClick={() => handleToggleAllergy(item.id, item.is_allergy)}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs"
                  title={item.is_allergy ? "Switch to preference" : "Switch to allergy"}
                >
                  <AlertTriangle className="size-3.5" />
                </button>

                {/* Toggle active */}
                <button
                  onClick={() => handleToggleActive(item.id, item.active)}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title={item.active ? "Deactivate" : "Activate"}
                >
                  {item.active ? (
                    <ToggleRight className="size-4 text-status-forest" />
                  ) : (
                    <ToggleLeft className="size-4" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => { setDeletingId(item.id); setDeletingLabel(item.label); }}
                  className="rounded-lg p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open: boolean) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dietary label?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingLabel}</strong>. Any meal jobs referencing
              this label will retain their stored count data, but the label won&apos;t appear in future
              job creation.
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
                    await deleteDietaryLabel(deletingId);
                    toast.success("Dietary label deleted");
                  } catch {
                    toast.error("Failed to delete dietary label");
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
