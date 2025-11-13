import type { BookingStatus } from "@/lib/queries/bookings";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightCircle,
  BadgeCheck,
  CheckCircle2,
  CircleDot,
  Clock3,
  Wallet,
  XCircle,
} from "lucide-react";

const statusConfig: Record<
  BookingStatus,
  {
    label: string;
    className: string;
    icon: LucideIcon;
    pulse?: boolean;
  }
> = {
  Pending: {
    label: "Pending",
    className: "border-warning/20 bg-warning/10 text-warning",
    icon: Clock3,
    pulse: true,
  },
  InTriage: {
    label: "In triage",
    className: "border-primary/20 bg-primary/10 text-primary",
    icon: CircleDot,
  },
  Approved: {
    label: "Approved",
    className: "border-success/20 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  DepositPending: {
    label: "Deposit pending",
    className: "border-warning/20 bg-warning/10 text-warning",
    icon: Wallet,
  },
  DepositReceived: {
    label: "Deposit received",
    className: "border-success/20 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  InProgress: {
    label: "In progress",
    className: "border-primary/20 bg-primary/10 text-primary",
    icon: ArrowRightCircle,
  },
  Completed: {
    label: "Completed",
    className: "border-border/60 bg-neutral text-text",
    icon: BadgeCheck,
  },
  Cancelled: {
    label: "Cancelled",
    className: "border-danger/20 bg-danger/10 text-danger",
    icon: XCircle,
  },
};

export function StatusChip({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold",
        "transition-all duration-200",
        config.className,
        config.pulse && "animate-pulse"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {config.label}
    </span>
  );
}
