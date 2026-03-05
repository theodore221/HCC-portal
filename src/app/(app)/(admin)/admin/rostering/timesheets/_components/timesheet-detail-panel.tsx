"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RosteringStatusChip } from "@/components/ui/rostering-status-chip";
import { approveTimesheet, rejectTimesheet, adjustTimesheet } from "../../actions";
import type { TimesheetRow, ShiftDetail } from "@/lib/queries/rostering.server";

type DetailData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timesheet: TimesheetRow & { completed_task_ids: any[] };
  shift?: ShiftDetail | null;
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

type Props = {
  timesheetId: string;
  timesheet: TimesheetRow;
  onClose?: () => void;
};

export function TimesheetDetailPanel({ timesheetId, timesheet, onClose }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state — pre-populated from basic timesheet prop, updated on API fetch
  const [workStart, setWorkStart] = useState(timesheet.work_start.slice(0, 5));
  const [workEnd, setWorkEnd] = useState(timesheet.work_end.slice(0, 5));
  const [breakStart, setBreakStart] = useState(timesheet.break_start?.slice(0, 5) ?? "");
  const [breakEnd, setBreakEnd] = useState(timesheet.break_end?.slice(0, 5) ?? "");
  const [hasBreak, setHasBreak] = useState(!!timesheet.break_start);
  const [adminNotes, setAdminNotes] = useState(timesheet.notes ?? "");
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Note: form state initialises from timesheet props on mount.
  // The parent uses key={timesheetId} so this component fully remounts when selection changes.
  // After an action, refreshKey increment triggers a re-fetch which updates form state async.

  // Fetch full detail (including completed_task_ids + shift tasks)
  useEffect(() => {
    setLoading(true);
    fetch(`/api/rostering/timesheet-detail?id=${timesheetId}`)
      .then((r) => r.json())
      .then((data: DetailData) => {
        setDetail(data);
        if (data.timesheet) {
          setWorkStart(data.timesheet.work_start?.slice(0, 5) ?? "");
          setWorkEnd(data.timesheet.work_end?.slice(0, 5) ?? "");
          setBreakStart(data.timesheet.break_start?.slice(0, 5) ?? "");
          setBreakEnd(data.timesheet.break_end?.slice(0, 5) ?? "");
          setHasBreak(!!data.timesheet.break_start);
          setAdminNotes(data.timesheet.notes ?? "");
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [timesheetId, refreshKey]);

  // Break validation
  const workMinutes = workStart && workEnd ? timeToMinutes(workEnd) - timeToMinutes(workStart) : 0;
  const requiredBreakMinutes = Math.floor(workMinutes / 300) * 30;
  const needsBreak = requiredBreakMinutes > 0;
  const breakMinutes =
    hasBreak && breakStart && breakEnd
      ? timeToMinutes(breakEnd) - timeToMinutes(breakStart)
      : 0;
  const breakValid = !needsBreak || (hasBreak && breakMinutes >= requiredBreakMinutes);
  const netMinutes = workMinutes - (hasBreak ? breakMinutes : 0);
  const netHours = netMinutes > 0 ? (netMinutes / 60).toFixed(2) : "—";

  function afterAction() {
    router.refresh();
    setRefreshKey((k) => k + 1);
    setRejecting(false);
    setRejectionReason("");
  }

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveTimesheet(timesheetId);
        toast.success("Timesheet approved");
        afterAction();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to approve");
      }
    });
  }

  function handleReject() {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    startTransition(async () => {
      try {
        await rejectTimesheet(timesheetId, rejectionReason);
        toast.success("Timesheet rejected");
        afterAction();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to reject");
      }
    });
  }

  function handleSave(approve: boolean) {
    startTransition(async () => {
      try {
        await adjustTimesheet(timesheetId, {
          work_start: workStart,
          work_end: workEnd,
          break_start: hasBreak ? breakStart : null,
          break_end: hasBreak ? breakEnd : null,
          notes: adminNotes || null,
          approve,
        });
        toast.success(approve ? "Timesheet adjusted and approved" : "Timesheet adjusted");
        afterAction();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to adjust timesheet");
      }
    });
  }

  // Merge detail fields (e.g. completed_task_ids) over the base timesheet prop.
  // working_minutes and break_minutes are RPC-computed — not stored in the table — so
  // always use them from the list prop to avoid NaN when detail is fetched directly.
  const currentTimesheet = detail?.timesheet
    ? {
        ...detail.timesheet,
        working_minutes: timesheet.working_minutes,
        break_minutes: timesheet.break_minutes,
      }
    : timesheet;
  const isApproved = currentTimesheet.status === "Approved";
  const isSubmitted = currentTimesheet.status === "Submitted";
  const isRejected = currentTimesheet.status === "Rejected";
  const shift = detail?.shift;
  const completedTaskIds: string[] = detail?.timesheet.completed_task_ids ?? [];

  // Group shift tasks by job
  type TaskGroup = { color: string; tasks: NonNullable<typeof shift>["tasks"] };
  const tasksByJob = shift?.tasks
    ? shift.tasks.reduce<Record<string, TaskGroup>>((acc, task) => {
        if (!acc[task.job_name]) {
          acc[task.job_name] = { color: task.job_color, tasks: [] };
        }
        acc[task.job_name].tasks.push(task);
        return acc;
      }, {})
    : {};

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mb-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to list
            </button>
          )}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {currentTimesheet.staff_name ?? "Unknown Staff"}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">{formatDate(currentTimesheet.work_date)}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <RosteringStatusChip status={currentTimesheet.status} />
              <span className="text-xs font-medium tabular-nums text-gray-600">
                {(currentTimesheet.working_minutes / 60).toFixed(2)} hrs net
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Section 1: Submitted Details */}
            <div className="px-5 py-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Submitted Details
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Work hours</span>
                <span className="font-medium text-right">
                  {formatTime(currentTimesheet.work_start)} – {formatTime(currentTimesheet.work_end)}
                </span>
                {currentTimesheet.break_start && (
                  <>
                    <span className="text-gray-500">Break</span>
                    <span className="font-medium text-right">
                      {formatTime(currentTimesheet.break_start)} –{" "}
                      {formatTime(currentTimesheet.break_end!)}
                    </span>
                  </>
                )}
                <span className="text-gray-500">Net hours</span>
                <span className="font-semibold text-right">
                  {(currentTimesheet.working_minutes / 60).toFixed(2)} hrs
                </span>
                {currentTimesheet.notes && (
                  <>
                    <span className="text-gray-500">Notes</span>
                    <span className="text-right text-gray-700">{currentTimesheet.notes}</span>
                  </>
                )}
                {isRejected && currentTimesheet.rejection_reason && (
                  <>
                    <span className="text-status-clay">Rejection</span>
                    <span className="text-status-clay text-right">
                      {currentTimesheet.rejection_reason}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Assigned vs Submitted */}
            {shift && (
              <div className="px-5 py-4 space-y-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Assigned vs Submitted
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Shift assigned</p>
                    <p className="font-medium text-gray-900">
                      {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2.5 ${
                      currentTimesheet.work_start.slice(0, 5) !== shift.start_time.slice(0, 5) ||
                      currentTimesheet.work_end.slice(0, 5) !== shift.end_time.slice(0, 5)
                        ? "bg-status-ochre/10"
                        : "bg-gray-50"
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Submitted</p>
                    <p
                      className={`font-medium ${
                        currentTimesheet.work_start.slice(0, 5) !== shift.start_time.slice(0, 5) ||
                        currentTimesheet.work_end.slice(0, 5) !== shift.end_time.slice(0, 5)
                          ? "text-status-ochre"
                          : "text-gray-900"
                      }`}
                    >
                      {formatTime(currentTimesheet.work_start)} –{" "}
                      {formatTime(currentTimesheet.work_end)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Tasks Completed */}
            {shift && shift.tasks.length > 0 && (
              <div className="px-5 py-4 space-y-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Tasks Completed ({completedTaskIds.length}/{shift.tasks.length})
                </p>
                <div className="space-y-3">
                  {Object.entries(tasksByJob).map(([jobName, { color, tasks }]) => (
                    <div key={jobName}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="size-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium text-gray-600">{jobName}</span>
                      </div>
                      <div className="pl-3.5 space-y-1">
                        {tasks.map((task) => {
                          const done = completedTaskIds.includes(task.id);
                          return (
                            <div key={task.id} className="flex items-center gap-2 text-sm">
                              <span
                                className={`size-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                                  done
                                    ? "bg-status-forest/10 text-status-forest"
                                    : "bg-gray-100 text-gray-300"
                                }`}
                              >
                                {done ? "✓" : "·"}
                              </span>
                              <span className={done ? "text-gray-700" : "text-gray-400"}>
                                {task.task_name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Admin Override */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Admin Override
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Work start</Label>
                  <Input
                    type="time"
                    value={workStart}
                    onChange={(e) => setWorkStart(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Work end</Label>
                  <Input
                    type="time"
                    value={workEnd}
                    onChange={(e) => setWorkEnd(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>

              {needsBreak && (
                <div
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                    breakValid
                      ? "bg-status-forest/10 text-status-forest"
                      : "bg-status-clay/10 text-status-clay"
                  }`}
                >
                  <AlertCircle className="size-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    {breakValid
                      ? "Break requirement met ✓"
                      : `A ${requiredBreakMinutes}-minute break is required.`}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={hasBreak}
                    onChange={(e) => setHasBreak(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-700">Include break</span>
                </label>
                {hasBreak && (
                  <div className="grid grid-cols-2 gap-3 pl-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Break start</Label>
                      <Input
                        type="time"
                        value={breakStart}
                        onChange={(e) => setBreakStart(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Break end</Label>
                      <Input
                        type="time"
                        value={breakEnd}
                        onChange={(e) => setBreakEnd(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </div>

              {workMinutes > 0 && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  Net working time:{" "}
                  <span className="font-semibold">{netHours} hrs</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Admin notes (optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Reason for adjustment..."
                  className="text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={pending || !breakValid}
                  className="flex-1"
                >
                  Save adjustment
                </Button>
                {!isApproved && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(true)}
                    disabled={pending || !breakValid}
                    className="flex-1"
                  >
                    Adjust &amp; approve
                  </Button>
                )}
              </div>
            </div>

            {/* Section 5: Action Footer */}
            {isApproved ? (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-status-forest">
                  <CheckCircle2 className="size-4" />
                  <span className="font-medium">Approved</span>
                </div>
              </div>
            ) : isSubmitted ? (
              <div className="px-5 py-4 space-y-3">
                {rejecting ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-status-clay">Reason for rejection</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why this timesheet is being rejected..."
                      className="text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejecting(false)}
                        disabled={pending}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleReject}
                        disabled={pending || !rejectionReason.trim()}
                        className="flex-1"
                      >
                        Confirm rejection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-status-clay/30 text-status-clay hover:bg-status-clay/10"
                      onClick={() => setRejecting(true)}
                      disabled={pending}
                    >
                      <XCircle className="size-4 mr-1.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleApprove}
                      disabled={pending}
                    >
                      <CheckCircle2 className="size-4 mr-1.5" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ) : isRejected ? (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-status-clay">
                  <XCircle className="size-4" />
                  <span className="font-medium">Rejected — staff can re-submit</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
