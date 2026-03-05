"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ShiftDetail, StaffMember, RosterJob } from "@/lib/queries/rostering.server";
import { updateShift, deleteShift } from "../actions";
import { StaffAvailabilityList } from "./staff-availability-list";
import { JobTaskPicker } from "./job-task-picker";

type Props = {
  shift: ShiftDetail;
  staff: StaffMember[];
  jobs: RosterJob[];
  onUpdated?: () => void;
  onDeleted?: () => void;
};

export function EditShiftDialog({ shift, staff, jobs, onUpdated, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(shift.title);
  const [date, setDate] = useState(shift.shift_date);
  const [startTime, setStartTime] = useState(shift.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(shift.end_time.slice(0, 5));
  const [notes, setNotes] = useState(shift.notes ?? "");
  const [selectedStaff, setSelectedStaff] = useState<string[]>(
    shift.assignments.map((a) => a.staff_profile_id)
  );
  const [unavailableStaffIds, setUnavailableStaffIds] = useState<Set<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    shift.tasks.map((t) => t.roster_task_id)
  );

  function toggleStaff(id: string) {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const conflicting = selectedStaff.filter((id) => unavailableStaffIds.has(id));
    if (conflicting.length > 0) {
      const names = staff
        .filter((s) => conflicting.includes(s.id))
        .map((s) => s.full_name ?? s.email)
        .join(", ");
      toast.error(`${names} ${conflicting.length === 1 ? "is" : "are"} unavailable during this shift`);
      return;
    }
    startTransition(async () => {
      try {
        await updateShift(shift.id, {
          title,
          shift_date: date,
          start_time: startTime,
          end_time: endTime,
          notes: notes || null,
          staff_profile_ids: selectedStaff,
          roster_task_ids: selectedTaskIds,
        });
        toast.success("Shift updated");
        setOpen(false);
        onUpdated?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update shift");
      }
    });
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      try {
        await deleteShift(shift.id);
        toast.success("Shift deleted");
        setConfirmDeleteOpen(false);
        setOpen(false);
        onDeleted?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete shift");
      }
    });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit shift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-shift-title">Title</Label>
            <Input
              id="edit-shift-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-shift-date">Date</Label>
            <Input
              id="edit-shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>End time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {staff.length > 0 && (
            <div className="space-y-1.5">
              <Label>Staff assigned</Label>
              <StaffAvailabilityList
                staff={staff}
                selectedStaff={selectedStaff}
                onToggleStaff={toggleStaff}
                shiftDate={date}
                startTime={startTime}
                endTime={endTime}
                onUnavailableIdsChange={setUnavailableStaffIds}
              />
            </div>
          )}

          {jobs.length > 0 && (
            <div className="space-y-1.5">
              <Label>Assign jobs</Label>
              <JobTaskPicker
                jobs={jobs}
                selectedTaskIds={selectedTaskIds}
                onSelectedTaskIdsChange={setSelectedTaskIds}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              className="text-status-clay hover:text-status-clay hover:bg-status-clay/10"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={pending}
            >
              <Trash2 className="size-4 mr-1.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !title || !date}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Delete confirmation dialog */}
    <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete shift</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium text-gray-900">"{shift.title}"</span>? This will also remove all staff assignments and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
