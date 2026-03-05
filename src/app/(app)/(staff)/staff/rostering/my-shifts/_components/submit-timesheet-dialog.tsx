"use client";

import { useState, useTransition } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { submitTimesheet } from "../../actions";
import type { ShiftTaskDetail } from "@/lib/queries/rostering.server";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  workDate: string;
  defaultStart: string;
  defaultEnd: string;
  tasks: ShiftTaskDetail[];
  onSubmitted: () => void;
};

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function groupTasksByJob(tasks: ShiftTaskDetail[]) {
  const map = new Map<string, { jobName: string; jobColor: string; tasks: ShiftTaskDetail[] }>();
  for (const task of tasks) {
    if (!map.has(task.job_name)) {
      map.set(task.job_name, { jobName: task.job_name, jobColor: task.job_color, tasks: [] });
    }
    map.get(task.job_name)!.tasks.push(task);
  }
  return Array.from(map.values());
}

export function SubmitTimesheetDialog({
  open,
  onOpenChange,
  shiftId,
  workDate,
  defaultStart,
  defaultEnd,
  tasks,
  onSubmitted,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [workStart, setWorkStart] = useState(defaultStart.slice(0, 5));
  const [workEnd, setWorkEnd] = useState(defaultEnd.slice(0, 5));
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  const workMinutes = toMinutes(workEnd) - toMinutes(workStart);
  const needsBreak = workMinutes >= 300;
  const jobGroups = groupTasksByJob(tasks);

  function toggleTask(id: string) {
    setCompletedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitTimesheet({
          work_date: workDate,
          work_start: workStart,
          work_end: workEnd,
          break_start: breakStart || null,
          break_end: breakEnd || null,
          notes: notes || null,
          shift_id: shiftId,
          completed_task_ids: completedTaskIds,
        });
        toast.success("Timesheet submitted");
        onSubmitted();
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to submit timesheet");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log timesheet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ts-work-start">Work start</Label>
              <Input
                id="ts-work-start"
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ts-work-end">Work end</Label>
              <Input
                id="ts-work-end"
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                required
              />
            </div>
          </div>

          {needsBreak && (
            <div className="space-y-1.5">
              <Label className="text-xs text-status-ochre">
                Break required (5+ hour shift)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ts-break-start" className="text-xs text-gray-500">Break start</Label>
                  <Input
                    id="ts-break-start"
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                    required={needsBreak}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ts-break-end" className="text-xs text-gray-500">Break end</Label>
                  <Input
                    id="ts-break-end"
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                    required={needsBreak}
                  />
                </div>
              </div>
            </div>
          )}

          {!needsBreak && (breakStart || breakEnd) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ts-break-start-opt" className="text-xs text-gray-500">Break start (optional)</Label>
                <Input
                  id="ts-break-start-opt"
                  type="time"
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ts-break-end-opt" className="text-xs text-gray-500">Break end (optional)</Label>
                <Input
                  id="ts-break-end-opt"
                  type="time"
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label>Tasks completed</Label>
                <span className="text-xs text-gray-400">(optional)</span>
              </div>
              <div className="rounded-md border border-gray-200 max-h-40 overflow-y-auto divide-y divide-gray-100">
                {jobGroups.map((group) => (
                  <div key={group.jobName} className="px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.jobColor }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {group.jobName}
                      </span>
                    </div>
                    {group.tasks.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2.5 cursor-pointer pl-3.5"
                      >
                        <Checkbox
                          checked={completedTaskIds.includes(t.id)}
                          onCheckedChange={() => toggleTask(t.id)}
                        />
                        <span className="text-sm text-gray-700 flex-1">{t.task_name}</span>
                        {t.estimated_minutes && (
                          <span className="text-xs text-gray-400">{t.estimated_minutes} min</span>
                        )}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ts-notes">Notes (optional)</Label>
            <Textarea
              id="ts-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes..."
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
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Submit timesheet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
