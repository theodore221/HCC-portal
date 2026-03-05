"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle, StopCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RosteringStatusChip } from "@/components/ui/rostering-status-chip";
import { respondToShiftAssignment, endShift } from "../actions";
import { ShiftDetailDialog } from "./_components/shift-detail-dialog";
import type { MyShiftRow, TimesheetStatus } from "@/lib/queries/rostering.server";

type Props = { shifts: MyShiftRow[] };

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

function ShiftCard({
  shift,
  onTimesheetSubmitted,
  onEndShift,
  onClick,
}: {
  shift: MyShiftRow;
  onTimesheetSubmitted: (shiftId: string) => void;
  onEndShift: (shiftId: string) => void;
  onClick: () => void;
}) {
  const [respondPending, startRespondTransition] = useTransition();
  const [endPending, startEndTransition] = useTransition();

  const isPending = shift.assignment_status === "Pending";
  const isInProgress = shift.status === "InProgress";
  const isCompleted = shift.status === "Completed";
  const needsTimesheet = isCompleted && !shift.has_timesheet;
  const isRejected = shift.timesheet_status === "Rejected";

  // Fade only when timesheet is Approved or Submitted (not Rejected — staff needs to act)
  const cardOpacity =
    isCompleted &&
    (shift.timesheet_status === "Approved" || shift.timesheet_status === "Submitted")
      ? "opacity-70"
      : "";

  function handleRespond(accept: boolean) {
    startRespondTransition(async () => {
      try {
        await respondToShiftAssignment(shift.assignment_id, accept);
        toast.success(accept ? "Shift accepted" : "Shift declined");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to respond");
      }
    });
  }

  function handleEndShift() {
    startEndTransition(async () => {
      try {
        await endShift(shift.id);
        toast.success("Shift ended");
        onEndShift(shift.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to end shift");
      }
    });
  }

  return (
    <Card
      className={`hover:border-gray-300 transition-colors cursor-pointer ${cardOpacity}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{shift.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(shift.shift_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
              </span>
            </div>
            {shift.notes && (
              <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                {shift.notes}
              </p>
            )}

            {/* Rejected timesheet banner */}
            {isRejected && (
              <div
                className="mt-2 flex items-center gap-2 rounded-lg border border-status-clay/20 bg-status-clay/10 px-3 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <AlertCircle className="size-3.5 text-status-clay flex-shrink-0" />
                <span className="text-xs text-status-clay">
                  Timesheet rejected{shift.rejection_reason ? `: ${shift.rejection_reason}` : ""}
                </span>
                <button
                  className="ml-auto text-xs font-medium text-status-clay underline underline-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                >
                  Edit & resubmit
                </button>
              </div>
            )}

            {/* Not submitted banner (only when no timesheet at all) */}
            {needsTimesheet && !isRejected && (
              <div
                className="mt-2 flex items-center gap-2 rounded-lg border border-status-ochre/20 bg-status-ochre/10 px-3 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <AlertCircle className="size-3.5 text-status-ochre flex-shrink-0" />
                <span className="text-xs text-status-ochre">Timesheet not submitted</span>
                <button
                  className="ml-auto text-xs font-medium text-status-ochre underline underline-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                >
                  Submit now
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <RosteringStatusChip status={shift.assignment_status} />

            {isPending && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-status-clay border-status-clay/30 hover:bg-status-clay/10"
                  onClick={() => handleRespond(false)}
                  disabled={respondPending}
                >
                  <XCircle className="size-3.5" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => handleRespond(true)}
                  disabled={respondPending}
                >
                  <CheckCircle2 className="size-3.5" />
                  Accept
                </Button>
              </div>
            )}

            {isInProgress && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-status-slate border-status-slate/30 hover:bg-status-slate/10"
                onClick={handleEndShift}
                disabled={endPending}
              >
                <StopCircle className="size-3.5" />
                {endPending ? "Ending…" : "End shift"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MyShiftsClient({ shifts: initialShifts }: Props) {
  const [shifts, setShifts] = useState(initialShifts);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date(new Date().toDateString());

  const upcoming = shifts.filter((s) => {
    const shiftDate = new Date(`${s.shift_date}T00:00:00`);
    return s.status === "InProgress" || (s.status === "Published" && shiftDate >= today);
  });

  const past = shifts.filter((s) => {
    const shiftDate = new Date(`${s.shift_date}T00:00:00`);
    return s.status === "Completed" || (s.status === "Published" && shiftDate < today);
  });

  function openDetail(shiftId: string) {
    setSelectedShiftId(shiftId);
    setDialogOpen(true);
  }

  function handleTimesheetSubmitted() {
    setShifts((prev) =>
      prev.map((s) =>
        s.id === selectedShiftId
          ? {
              ...s,
              has_timesheet: true,
              timesheet_status: "Submitted" as TimesheetStatus,
              rejection_reason: null,
            }
          : s
      )
    );
  }

  function handleEndShift(shiftId: string) {
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, status: "Completed" as const } : s))
    );
  }

  const selectedShift = shifts.find((s) => s.id === selectedShiftId) ?? null;

  if (shifts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
        No shifts assigned to you yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Upcoming</h3>
            {upcoming.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onTimesheetSubmitted={handleTimesheetSubmitted}
                onEndShift={handleEndShift}
                onClick={() => openDetail(shift.id)}
              />
            ))}
          </div>
        )}
        {past.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Past</h3>
            <div className="space-y-2">
              {past.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onTimesheetSubmitted={handleTimesheetSubmitted}
                  onEndShift={handleEndShift}
                  onClick={() => openDetail(shift.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ShiftDetailDialog
        shiftId={selectedShiftId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        timesheetId={selectedShift?.timesheet_id ?? null}
        timesheetStatus={selectedShift?.timesheet_status ?? null}
        rejectionReason={selectedShift?.rejection_reason ?? null}
        onTimesheetSubmitted={handleTimesheetSubmitted}
      />
    </>
  );
}
