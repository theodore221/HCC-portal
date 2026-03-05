const STATUS_ACCENT: Record<string, string> = {
  Submitted: "border-l-2 border-l-status-ochre",
  Approved: "border-l-2 border-l-status-forest",
  Rejected: "border-l-2 border-l-status-clay",
  Draft: "border-l-2 border-l-gray-300",
};

type Props = {
  label: string;
  totalMinutes: number;
  count: number;
  status?: string;
};

export function TimesheetGroupSection({ label, totalMinutes, count, status }: Props) {
  const hours = (totalMinutes / 60).toFixed(2);
  const accent = status ? (STATUS_ACCENT[status] ?? "") : "";

  return (
    <div
      className={`flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 ${accent}`}
    >
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{count} timesheet{count !== 1 ? "s" : ""}</span>
        <span className="text-gray-300">·</span>
        <span className="font-medium tabular-nums text-gray-700">{hours} hrs</span>
      </div>
    </div>
  );
}
