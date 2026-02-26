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
    className: "border-status-slate/20 bg-status-slate/10 text-status-slate",
    icon: Sparkles,
    pulse: true,
  },
  in_discussion: {
    label: "In Discussion",
    className: "border-status-ochre/20 bg-status-ochre/10 text-status-ochre",
    icon: MessageCircle,
  },
  quoted: {
    label: "Quoted",
    className: "border-status-forest/20 bg-status-forest/10 text-status-forest",
    icon: DollarSign,
  },
  converted_to_booking: {
    label: "Converted",
    className: "border-status-plum/20 bg-status-plum/10 text-status-plum",
    icon: ArrowRightCircle,
  },
  lost: {
    label: "Lost",
    className: "border-status-stone/20 bg-status-stone/10 text-status-stone",
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
