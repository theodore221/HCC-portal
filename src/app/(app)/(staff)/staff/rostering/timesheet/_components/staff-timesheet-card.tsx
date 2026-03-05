"use client";

import { RosteringStatusChip } from "@/components/ui/rostering-status-chip";
import type { TimesheetRow } from "@/lib/queries/rostering.server";

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short",
  });
}

type Props = {
  timesheet: TimesheetRow;
  isSelected: boolean;
  onClick: () => void;
};

export function StaffTimesheetCard({ timesheet: ts, isSelected, onClick }: Props) {
  const netHours = (ts.working_minutes / 60).toFixed(2);

  const borderAccent =
    ts.status === "Rejected"
      ? "border-l-2 border-l-status-clay"
      : ts.status === "Submitted"
      ? "border-l-2 border-l-status-ochre"
      : "";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`w-full text-left rounded-2xl border bg-white shadow-sm px-4 py-3 cursor-pointer transition-all ${borderAccent} ${
        isSelected
          ? "ring-2 ring-primary bg-primary/5 border-primary/20"
          : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{formatDate(ts.work_date)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatTime(ts.work_start)} – {formatTime(ts.work_end)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <RosteringStatusChip status={ts.status} />
          <span className="text-xs font-medium tabular-nums text-gray-700">{netHours} hrs</span>
        </div>
      </div>
      {ts.rejection_reason && (
        <p className="mt-2 text-xs text-status-clay bg-status-clay/10 rounded px-2 py-1 truncate">
          Rejected: {ts.rejection_reason}
        </p>
      )}
    </button>
  );
}
