import type { Enums } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  PlayCircle,
  UtensilsCrossed,
  XCircle,
  FileEdit,
  UserCheck,
} from "lucide-react";

type MealJobStatus = Enums<"meal_job_status">;

const statusConfig: Record<
  MealJobStatus,
  {
    label: string;
    className: string;
    icon: LucideIcon;
    pulse?: boolean;
  }
> = {
  Draft: {
    label: "Draft",
    className: "border-border/60 bg-neutral text-text-light",
    icon: FileEdit,
  },
  PendingAssignment: {
    label: "Pending Assignment",
    className: "border-warning/20 bg-warning/10 text-warning",
    icon: Clock3,
    pulse: true,
  },
  Assigned: {
    label: "Assigned",
    className: "border-primary/20 bg-primary/10 text-primary",
    icon: UserCheck,
  },
  Confirmed: {
    label: "Confirmed",
    className: "border-success/20 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  InPrep: {
    label: "In Prep",
    className: "border-primary/20 bg-primary/10 text-primary",
    icon: Loader2,
  },
  Served: {
    label: "Served",
    className: "border-success/20 bg-success/10 text-success",
    icon: UtensilsCrossed,
  },
  Completed: {
    label: "Completed",
    className: "border-success/30 bg-success/20 text-success",
    icon: CheckCircle2,
  },
  Cancelled: {
    label: "Cancelled",
    className: "border-danger/20 bg-danger/10 text-danger",
    icon: XCircle,
  },
};

interface MealJobStatusChipProps {
  status: MealJobStatus;
  changesRequested?: boolean;
}

export function MealJobStatusChip({
  status,
  changesRequested,
}: MealJobStatusChipProps) {
  // Special case: show "Changes Requested" badge when flag is set and status is Assigned
  if (changesRequested && status === "Assigned") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
          "border-warning/20 bg-warning/10 text-warning animate-pulse"
        )}
      >
        <AlertCircle className="size-3.5" aria-hidden />
        Changes Requested
      </span>
    );
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        "transition-all duration-200",
        config.className,
        config.pulse && "animate-pulse"
      )}
    >
      <Icon
        className={cn("size-3.5", status === "InPrep" && "animate-spin")}
        aria-hidden
      />
      {config.label}
    </span>
  );
}
