import { cn } from "@/lib/utils";
import type { ShiftStatus, AssignmentStatus, TimesheetStatus } from "@/lib/queries/rostering.server";

type AnyRosterStatus =
  | ShiftStatus
  | AssignmentStatus
  | TimesheetStatus;

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  // Shift statuses
  Draft:      { label: "Draft",      classes: "border-status-stone/20 bg-status-stone/10 text-status-stone" },
  Published:  { label: "Published",  classes: "border-status-sage/20 bg-status-sage/10 text-status-sage" },
  // Assignment statuses
  Pending:    { label: "Pending",    classes: "border-status-ochre/20 bg-status-ochre/10 text-status-ochre" },
  Accepted:   { label: "Accepted",   classes: "border-status-forest/20 bg-status-forest/10 text-status-forest" },
  Declined:   { label: "Declined",   classes: "border-status-clay/20 bg-status-clay/10 text-status-clay" },
  NoResponse: { label: "No Response",classes: "border-status-stone/20 bg-status-stone/10 text-status-stone" },
  // Timesheet statuses
  Submitted:  { label: "Submitted",  classes: "border-status-ochre/20 bg-status-ochre/10 text-status-ochre" },
  Approved:   { label: "Approved",   classes: "border-status-forest/20 bg-status-forest/10 text-status-forest" },
  Rejected:   { label: "Rejected",   classes: "border-status-clay/20 bg-status-clay/10 text-status-clay" },
  // Leave statuses
  // Pending, Approved, Declined, Cancelled — already covered above
};

export function RosteringStatusChip({
  status,
  className,
}: {
  status: AnyRosterStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    classes: "border-status-stone/20 bg-status-stone/10 text-status-stone",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
