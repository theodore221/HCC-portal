import type { BookingStatus } from "@/lib/queries/bookings";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightCircle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Send,
  XCircle,
} from "lucide-react";

const statusConfig: Partial<
  Record<
    BookingStatus,
    {
      label: string;
      className: string;
      icon: LucideIcon;
      pulse?: boolean;
    }
  >
> = {
  AwaitingDetails: {
    label: "Awaiting Details",
    className: "border-status-sage/20 bg-status-sage/10 text-status-sage",
    icon: Send,
    pulse: true,
  },
  Pending: {
    label: "Pending",
    className: "border-status-ochre/20 bg-status-ochre/10 text-status-ochre",
    icon: Clock3,
    pulse: true,
  },
  Approved: {
    label: "Approved",
    className: "border-status-forest/20 bg-status-forest/10 text-status-forest",
    icon: CheckCircle2,
  },
  Confirmed: {
    label: "Confirmed",
    className: "border-status-forest/20 bg-status-forest/10 text-status-forest",
    icon: CheckCircle2,
  },
  InProgress: {
    label: "In progress",
    className: "border-status-sage/20 bg-status-sage/10 text-status-sage",
    icon: ArrowRightCircle,
  },
  Completed: {
    label: "Completed",
    className: "border-status-stone/20 bg-status-stone/10 text-status-stone",
    icon: BadgeCheck,
  },
  Cancelled: {
    label: "Cancelled",
    className: "border-status-clay/20 bg-status-clay/10 text-status-clay",
    icon: XCircle,
  },
};

export function StatusChip({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  if (!config) return null;
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
