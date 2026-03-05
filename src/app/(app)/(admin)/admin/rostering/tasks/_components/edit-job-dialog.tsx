"use client";

import { useState, useEffect, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { updateRosterJob, deleteRosterJob } from "../../actions";
import type { RosterJob } from "@/lib/queries/rostering.server";

const COLOR_OPTIONS = [
  "#6c8f36", "#72a83c", "#169e66", "#2a8a7a",
  "#c49910", "#d63d2e", "#8840c4", "#6b7280",
];

type Props = {
  job: RosterJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditJobDialog({ job, open, onOpenChange }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [name, setName] = useState(job.name);
  const [description, setDescription] = useState(job.description ?? "");
  const [color, setColor] = useState(job.color);

  // Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setName(job.name);
      setDescription(job.description ?? "");
      setColor(job.color);
    }
  }, [open, job]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateRosterJob(job.id, {
          name,
          description: description || undefined,
          color,
          sort_order: job.sort_order,
        });
        toast.success("Job updated");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update job");
      }
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteRosterJob(job.id);
        toast.success("Job deleted");
        setDeleteOpen(false);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete job");
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit roster job</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Toilets + Bathrooms"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`size-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                className="text-status-clay hover:text-status-clay hover:bg-status-clay/10"
                onClick={() => setDeleteOpen(true)}
                disabled={pending || deletePending}
              >
                <Trash2 className="size-4 mr-1.5" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !name}>
                  {pending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete roster job"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">"{job.name}"</span>? All tasks within this
            job will also be deleted. If any tasks are assigned to shifts, the deletion will fail.
          </>
        }
        onConfirm={handleDelete}
        pending={deletePending}
      />
    </>
  );
}
