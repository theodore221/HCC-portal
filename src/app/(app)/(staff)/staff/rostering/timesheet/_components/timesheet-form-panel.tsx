"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitTimesheet } from "../../actions";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

type Props = {
  onSuccess: () => void;
  onBack?: () => void;
};

export function TimesheetFormPanel({ onSuccess, onBack }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [workDate, setWorkDate] = useState("");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [hasBreak, setHasBreak] = useState(false);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("12:30");
  const [notes, setNotes] = useState("");

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
        await submitTimesheet({
          work_date: workDate,
          work_start: workStart,
          work_end: workEnd,
          break_start: hasBreak ? breakStart : null,
          break_end: hasBreak ? breakEnd : null,
          notes: notes || null,
        });
        toast.success("Timesheet submitted");
        router.refresh();
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to submit timesheet");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Log timesheet</CardTitle>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors lg:hidden"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              required
            />
          </div>

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

          <Button
            type="submit"
            disabled={pending || !workDate || !breakValid}
            className="w-full"
          >
            {pending ? "Submitting…" : "Submit timesheet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
