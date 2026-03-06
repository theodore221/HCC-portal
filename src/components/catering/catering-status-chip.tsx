"use client";

import {
  FileEdit,
  UserX,
  UserCheck,
  CheckCircle2,
  ChefHat,
  UtensilsCrossed,
  BadgeCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CateringStatus =
  | "Draft"
  | "PendingAssignment"
  | "Assigned"
  | "Confirmed"
  | "InPrep"
  | "Served"
  | "Completed"
  | "Cancelled";

const STATUS_CONFIG: Record<
  CateringStatus,
  { label: string; icon: React.ElementType; classes: string }
> = {
  Draft: {
    label: "Draft",
    icon: FileEdit,
    classes:
      "border-status-stone/20 bg-status-stone/10 text-status-stone",
  },
  PendingAssignment: {
    label: "Pending",
    icon: UserX,
    classes:
      "border-status-ochre/20 bg-status-ochre/10 text-status-ochre",
  },
  Assigned: {
    label: "Assigned",
    icon: UserCheck,
    classes:
      "border-status-sage/20 bg-status-sage/10 text-status-sage",
  },
  Confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    classes:
      "border-status-forest/20 bg-status-forest/10 text-status-forest",
  },
  InPrep: {
    label: "In Prep",
    icon: ChefHat,
    classes:
      "border-status-slate/20 bg-status-slate/10 text-status-slate",
  },
  Served: {
    label: "Served",
    icon: UtensilsCrossed,
    classes:
      "border-status-plum/20 bg-status-plum/10 text-status-plum",
  },
  Completed: {
    label: "Completed",
    icon: BadgeCheck,
    classes:
      "border-status-stone/20 bg-status-stone/10 text-status-stone",
  },
  Cancelled: {
    label: "Cancelled",
    icon: XCircle,
    classes:
      "border-status-clay/20 bg-status-clay/10 text-status-clay",
  },
};

interface CateringStatusChipProps {
  status: string;
  className?: string;
}

export function CateringStatusChip({ status, className }: CateringStatusChipProps) {
  const config = STATUS_CONFIG[status as CateringStatus];
  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
          "border-gray-200 bg-gray-100 text-gray-600",
          className
        )}
      >
        {status}
      </span>
    );
  }

  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.classes,
        className
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}
