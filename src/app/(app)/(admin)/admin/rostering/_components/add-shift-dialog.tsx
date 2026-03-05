"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StaffMember, RosterJob } from "@/lib/queries/rostering.server";
import { createShift } from "../actions";
import { StaffAvailabilityList } from "./staff-availability-list";
import { JobTaskPicker } from "./job-task-picker";

type Props = {
  defaultDate?: string;
  staff: StaffMember[];
  jobs: RosterJob[];
  onCreated?: () => void;
};

export function AddShiftDialog({ defaultDate, staff, jobs, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");

  // Sync date to the currently selected calendar day whenever the dialog opens
  useEffect(() => {
    if (open) setDate(defaultDate ?? "");
  }, [open, defaultDate]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [unavailableStaffIds, setUnavailableStaffIds] = useState<Set<string>>(new Set());

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
        await createShift({
          title,
          shift_date: date,
          start_time: startTime,
          end_time: endTime,
          notes: notes || null,
          staff_profile_ids: selectedStaff,
          roster_task_ids: selectedTaskIds,
        });
        toast.success("Shift created");
        setOpen(false);
        setTitle("");
        setNotes("");
        setSelectedStaff([]);
        setSelectedTaskIds([]);
        setUnavailableStaffIds(new Set());
        onCreated?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create shift");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Add shift
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New shift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shift-title">Title</Label>
            <Input
              id="shift-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning cleaning"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift-date">Date</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shift-start">Start time</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-end">End time</Label>
              <Input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {staff.length > 0 && (
            <div className="space-y-1.5">
              <Label>Assign staff</Label>
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
            <Label htmlFor="shift-notes">Notes (optional)</Label>
            <Textarea
              id="shift-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !title || !date}>
              {pending ? "Creating…" : "Create shift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
