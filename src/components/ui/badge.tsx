import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  Pending: "bg-olive-100 text-olive-700",
  InTriage: "bg-yellow-100 text-yellow-700",
  Approved: "bg-emerald-100 text-emerald-700",
  DepositPending: "bg-amber-100 text-amber-700",
  DepositReceived: "bg-emerald-200 text-emerald-800",
  InProgress: "bg-blue-100 text-blue-700",
  Completed: "bg-olive-200 text-olive-900",
  Cancelled: "bg-neutral-200 text-neutral-700",
};

export function Badge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        colors[label] ?? "bg-olive-100 text-olive-700",
        className
      )}
    >
      {label}
    </span>
  );
}
