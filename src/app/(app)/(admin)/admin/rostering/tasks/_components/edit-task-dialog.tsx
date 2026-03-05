"use client";

import { useState, useEffect, useTransition } from "react";
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
import { updateRosterTask } from "../../actions";
import type { RosterTask } from "@/lib/queries/rostering.server";

type Props = {
  task: RosterTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditTaskDialog({ task, open, onOpenChange }: Props) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimated_minutes ? String(task.estimated_minutes) : ""
  );

  // Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setName(task.name);
      setDescription(task.description ?? "");
      setEstimatedMinutes(task.estimated_minutes ? String(task.estimated_minutes) : "");
    }
  }, [open, task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateRosterTask(task.id, {
          name,
          description: description || undefined,
          estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
          sort_order: task.sort_order,
        });
        toast.success("Task updated");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update task");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clean toilet cubicles"
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
            <Label>Estimated time (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={480}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="e.g. 30"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
