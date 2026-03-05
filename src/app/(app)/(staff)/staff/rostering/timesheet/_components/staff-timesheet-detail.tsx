"use client";

import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RosteringStatusChip } from "@/components/ui/rostering-status-chip";
import { EditTimesheetDialog } from "./edit-timesheet-dialog";
import type { TimesheetRow } from "@/lib/queries/rostering.server";

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
  timesheet: TimesheetRow;
  onBack?: () => void;
};

export function StaffTimesheetDetail({ timesheet: ts, onBack }: Props) {
  const netHours = (ts.working_minutes / 60).toFixed(2);
  const isApproved = ts.status === "Approved";
  const isSubmitted = ts.status === "Submitted";
  const isRejected = ts.status === "Rejected";
  const isDraft = ts.status === "Draft";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to list
            </button>
          )}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">{formatDate(ts.work_date)}</h3>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <RosteringStatusChip status={ts.status} />
              <span className="text-xs font-medium tabular-nums text-gray-600">
                {netHours} hrs net
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Time Details */}
          <div className="px-5 py-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Time Details
            </p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Work hours</span>
              <span className="font-medium text-right">
                {formatTime(ts.work_start)} – {formatTime(ts.work_end)}
              </span>
              {ts.break_start && ts.break_end && (
                <>
                  <span className="text-gray-500">Break</span>
                  <span className="font-medium text-right">
                    {formatTime(ts.break_start)} – {formatTime(ts.break_end)}
                  </span>
                </>
              )}
              <span className="text-gray-500">Net hours</span>
              <span className="font-semibold text-right">{netHours} hrs</span>
              {ts.notes && (
                <>
                  <span className="text-gray-500">Notes</span>
                  <span className="text-right text-gray-700">{ts.notes}</span>
                </>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="px-5 py-4">
            {isApproved && (
              <div className="flex items-center gap-2 text-sm text-status-forest">
                <CheckCircle2 className="size-4" />
                <span className="font-medium">Approved</span>
              </div>
            )}

            {isSubmitted && (
              <div className="flex items-center gap-2 text-sm text-status-ochre">
                <Clock className="size-4" />
                <span className="font-medium">Awaiting admin review</span>
              </div>
            )}

            {isRejected && (
              <div className="space-y-3">
                {ts.rejection_reason && (
                  <div className="rounded-lg bg-status-clay/10 px-3 py-2.5 text-sm text-status-clay">
                    <p className="font-medium mb-0.5">Rejected</p>
                    <p className="text-xs">{ts.rejection_reason}</p>
                  </div>
                )}
                <EditTimesheetDialog timesheet={ts} />
              </div>
            )}

            {isDraft && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="size-2 rounded-full bg-gray-400 inline-block" />
                  Draft — not yet submitted
                </div>
                <EditTimesheetDialog timesheet={ts} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
