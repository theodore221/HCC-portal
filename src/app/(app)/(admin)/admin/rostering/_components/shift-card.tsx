import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ShiftCardProps = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  assignedCount: number;
  hasUnresponded?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
};

function formatTime(t: string): string {
  // t is HH:MM:SS or HH:MM
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function ShiftCard({
  title,
  startTime,
  endTime,
  assignedCount,
  hasUnresponded,
  isSelected,
  onClick,
}: ShiftCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-3 transition-all",
        isSelected
          ? "border-status-ochre/40 bg-status-ochre/10 ring-1 ring-status-ochre/30"
          : "border-gray-200 bg-white hover:border-status-ochre/30 hover:bg-status-ochre/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{title}</p>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {formatTime(startTime)} – {formatTime(endTime)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3" />
          {assignedCount} staff
          {hasUnresponded ? (
            <span className="ml-1 size-1.5 rounded-full bg-status-ochre inline-block" title="Awaiting responses" />
          ) : null}
        </span>
      </div>
    </button>
  );
}
