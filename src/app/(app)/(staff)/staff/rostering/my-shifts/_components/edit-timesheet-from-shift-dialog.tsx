"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
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
import { updateTimesheet } from "../../actions";
import type { TimesheetRow } from "@/lib/queries/rostering.server";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timesheet: TimesheetRow;
  onSubmitted: () => void;
};

export function EditTimesheetFromShiftDialog({ open, onOpenChange, timesheet, onSubmitted }: Props) {
  const [pending, startTransition] = useTransition();
  const [workStart, setWorkStart] = useState(timesheet.work_start.slice(0, 5));
  const [workEnd, setWorkEnd] = useState(timesheet.work_end.slice(0, 5));
  const [breakStart, setBreakStart] = useState(timesheet.break_start?.slice(0, 5) ?? "12:00");
  const [breakEnd, setBreakEnd] = useState(timesheet.break_end?.slice(0, 5) ?? "12:30");
  const [hasBreak, setHasBreak] = useState(!!timesheet.break_start);
  const [notes, setNotes] = useState(timesheet.notes ?? "");

  const workMinutes = workStart && workEnd
    ? timeToMinutes(workEnd) - timeToMinutes(workStart)
    : 0;
  const requiredBreakMinutes = Math.floor(workMinutes / 300) * 30;
  const needsBreak = requiredBreakMinutes > 0;
  const breakMinutes = hasBreak && breakStart && breakEnd
    ? timeToMinutes(breakEnd) - timeToMinutes(breakStart)
    : 0;
  const breakValid = !needsBreak || (hasBreak && breakMinutes >= requiredBreakMinutes);
  const netMinutes = workMinutes - (hasBreak ? breakMinutes : 0);
  const netHours = netMinutes > 0 ? (netMinutes / 60).toFixed(2) : "—";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsBreak && (!hasBreak || breakMinutes < requiredBreakMinutes)) {
      toast.error(`A ${requiredBreakMinutes}-minute break is required for this shift length.`);
      return;
    }
    startTransition(async () => {
      try {
        await updateTimesheet(timesheet.id, {
          work_start: workStart,
          work_end: workEnd,
          break_start: hasBreak ? breakStart : null,
          break_end: hasBreak ? breakEnd : null,
          notes: notes || null,
        });
        toast.success("Timesheet updated and submitted");
        onSubmitted();
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update timesheet");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit & resubmit timesheet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {timesheet.rejection_reason && (
            <div className="flex items-start gap-2 rounded-lg border border-status-clay/20 bg-status-clay/10 px-3 py-2 text-xs text-status-clay">
              <AlertCircle className="size-3.5 mt-0.5 flex-shrink-0" />
              <span><span className="font-medium">Rejected: </span>{timesheet.rejection_reason}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Work start</Label>
              <Input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Work end</Label>
              <Input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                required
              />
            </div>
          </div>

          {needsBreak && (
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
              breakValid ? "bg-status-forest/10 text-status-forest" : "bg-status-clay/10 text-status-clay"
            }`}>
              <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
              <span>
                {breakValid
                  ? "Break requirement met ✓"
                  : `A ${requiredBreakMinutes}-minute break is required for this shift length.`}
              </span>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBreak}
                onChange={(e) => setHasBreak(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Include break</span>
            </label>
            {hasBreak && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="space-y-1.5">
                  <Label>Break start</Label>
                  <Input
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Break end</Label>
                  <Input
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {workMinutes > 0 && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Net working time: <span className="font-semibold">{netHours} hrs</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes for your timesheet..."
            />
          </div>

          <Button type="submit" disabled={pending || !breakValid} className="w-full">
            {pending ? "Updating…" : "Update & submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
