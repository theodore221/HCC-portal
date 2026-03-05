"use client";

import { useState, useEffect, useTransition } from "react";
import { Clock, Calendar, CheckCircle2, XCircle, HelpCircle, Users, ClipboardList, FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RosteringStatusChip } from "@/components/ui/rostering-status-chip";
import { SubmitTimesheetDialog } from "./submit-timesheet-dialog";
import { EditTimesheetFromShiftDialog } from "./edit-timesheet-from-shift-dialog";
import type { ShiftDetail, TimesheetStatus, TimesheetRow } from "@/lib/queries/rostering.server";

type Props = {
  shiftId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timesheetId: string | null;
  timesheetStatus: TimesheetStatus | null;
  rejectionReason: string | null;
  onTimesheetSubmitted: () => void;
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const ASSIGNMENT_ICONS: Record<string, React.ReactNode> = {
  Accepted: <CheckCircle2 className="size-4 text-status-forest" />,
  Declined: <XCircle className="size-4 text-status-clay" />,
  Pending: <HelpCircle className="size-4 text-status-ochre" />,
  NoResponse: <HelpCircle className="size-4 text-status-stone" />,
};

// Group shift tasks by job
function groupTasksByJob(tasks: ShiftDetail["tasks"]) {
  const map = new Map<string, { jobName: string; jobColor: string; tasks: ShiftDetail["tasks"] }>();
  for (const task of tasks) {
    if (!map.has(task.job_name)) {
      map.set(task.job_name, { jobName: task.job_name, jobColor: task.job_color, tasks: [] });
    }
    map.get(task.job_name)!.tasks.push(task);
  }
  return Array.from(map.values());
}

export function ShiftDetailDialog({
  shiftId,
  open,
  onOpenChange,
  timesheetId: initialTimesheetId,
  timesheetStatus: initialTimesheetStatus,
  rejectionReason: initialRejectionReason,
  onTimesheetSubmitted,
}: Props) {
  const [detail, setDetail] = useState<ShiftDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [timesheetOpen, setTimesheetOpen] = useState(false);
  const [timesheetStatus, setTimesheetStatus] = useState<TimesheetStatus | null>(initialTimesheetStatus);
  const [rejectionReason, setRejectionReason] = useState<string | null>(initialRejectionReason);
  const [editTimesheetData, setEditTimesheetData] = useState<TimesheetRow | null>(null);
  const [editTimesheetOpen, setEditTimesheetOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setTimesheetStatus(initialTimesheetStatus);
    setRejectionReason(initialRejectionReason);
  }, [initialTimesheetStatus, initialRejectionReason]);

  useEffect(() => {
    if (!open || !shiftId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rostering/shift-detail?id=${shiftId}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data);
        }
      } finally {
        setLoading(false);
      }
    });
  }, [open, shiftId]);

  async function handleOpenEditDialog() {
    if (!initialTimesheetId) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/rostering/timesheet-detail?id=${initialTimesheetId}`);
      if (res.ok) {
        const data = await res.json();
        setEditTimesheetData(data.timesheet);
        setEditTimesheetOpen(true);
      }
    } finally {
      setEditLoading(false);
    }
  }

  function handleTimesheetSubmitted() {
    setTimesheetStatus("Submitted");
    setRejectionReason(null);
    onTimesheetSubmitted();
  }

  const jobGroups = detail ? groupTasksByJob(detail.tasks) : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shift details</DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && detail && (
            <div className="space-y-0">
              {/* Section 1: Shift info */}
              <div className="space-y-2 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-gray-900">{detail.title}</p>
                  <RosteringStatusChip status={detail.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {formatDate(detail.shift_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {formatTime(detail.start_time)} – {formatTime(detail.end_time)}
                  </span>
                </div>
                {detail.notes && (
                  <p className="text-sm text-gray-600 rounded-lg bg-gray-50 px-3 py-2">
                    {detail.notes}
                  </p>
                )}
              </div>

              {/* Section 2: Staff */}
              <div className="border-t border-gray-200 pt-4 pb-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Staff ({detail.assignments.length})
                  </span>
                </div>
                {detail.assignments.length === 0 ? (
                  <p className="text-sm text-gray-400 pl-5">No staff assigned</p>
                ) : (
                  <div className="space-y-1.5 pl-5">
                    {detail.assignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {ASSIGNMENT_ICONS[a.status] ?? <HelpCircle className="size-4 text-status-stone" />}
                          <span className="text-sm text-gray-700">
                            {a.staff_name ?? a.staff_email}
                          </span>
                        </div>
                        <RosteringStatusChip status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Tasks grouped by job */}
              {detail.tasks.length > 0 && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="size-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Tasks ({detail.tasks.length})
                    </span>
                  </div>
                  <div className="space-y-3 pl-1">
                    {jobGroups.map((group) => (
                      <div key={group.jobName}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="size-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.jobColor }}
                          />
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {group.jobName}
                          </span>
                        </div>
                        <div className="space-y-1 pl-[18px]">
                          {group.tasks.map((t) => (
                            <div key={t.id} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{t.task_name}</span>
                              {t.estimated_minutes && (
                                <span className="text-xs text-gray-400">{t.estimated_minutes} min</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && detail && (
            <DialogFooter className="pt-2 border-t border-gray-200">
              {timesheetStatus === "Rejected" ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-status-clay">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>
                      Timesheet rejected{rejectionReason ? `: ${rejectionReason}` : ""}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-status-clay/30 text-status-clay hover:bg-status-clay/10"
                    onClick={handleOpenEditDialog}
                    disabled={editLoading}
                  >
                    <FileText className="size-3.5" />
                    {editLoading ? "Loading…" : "Edit & resubmit"}
                  </Button>
                </div>
              ) : timesheetStatus === "Submitted" ? (
                <div className="flex items-center gap-2 text-sm text-status-ochre">
                  <FileText className="size-4" />
                  Timesheet pending review
                </div>
              ) : timesheetStatus === "Approved" ? (
                <div className="flex items-center gap-2 text-sm text-status-forest">
                  <CheckCircle2 className="size-4" />
                  Timesheet approved
                </div>
              ) : timesheetStatus === "Draft" ? (
                <div className="flex items-center gap-2 text-sm text-status-stone">
                  <FileText className="size-4" />
                  Timesheet draft
                </div>
              ) : (
                <Button
                  onClick={() => setTimesheetOpen(true)}
                  className="gap-1.5"
                >
                  <FileText className="size-4" />
                  Log timesheet
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {detail && (
        <SubmitTimesheetDialog
          open={timesheetOpen}
          onOpenChange={setTimesheetOpen}
          shiftId={detail.id}
          workDate={detail.shift_date}
          defaultStart={detail.start_time}
          defaultEnd={detail.end_time}
          tasks={detail.tasks}
          onSubmitted={handleTimesheetSubmitted}
        />
      )}

      {editTimesheetData && (
        <EditTimesheetFromShiftDialog
          open={editTimesheetOpen}
          onOpenChange={setEditTimesheetOpen}
          timesheet={editTimesheetData}
          onSubmitted={handleTimesheetSubmitted}
        />
      )}
    </>
  );
}
