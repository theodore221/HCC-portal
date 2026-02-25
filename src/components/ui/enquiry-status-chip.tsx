import type { EnquiryStatus } from "@/lib/queries/enquiries";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  MessageCircle,
  DollarSign,
  ArrowRightCircle,
  XCircle,
} from "lucide-react";

const statusConfig: Record<
  EnquiryStatus,
  {
    label: string;
    className: string;
    icon: LucideIcon;
    pulse?: boolean;
  }
> = {
  new: {
    label: "New",
    className: "border-blue-200 bg-blue-100 text-blue-800",
    icon: Sparkles,
    pulse: true,
  },
  in_discussion: {
    label: "In Discussion",
    className: "border-amber-200 bg-amber-100 text-amber-800",
    icon: MessageCircle,
  },
  quoted: {
    label: "Quoted",
    className: "border-emerald-200 bg-emerald-100 text-emerald-800",
    icon: DollarSign,
  },
  converted_to_booking: {
    label: "Converted",
    className: "border-purple-200 bg-purple-100 text-purple-800",
    icon: ArrowRightCircle,
  },
  lost: {
    label: "Lost",
    className: "border-neutral-200 bg-neutral-100 text-neutral-600",
    icon: XCircle,
  },
};

export function EnquiryStatusChip({ status }: { status: EnquiryStatus }) {
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
