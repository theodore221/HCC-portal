import type { TimesheetRow } from "@/lib/queries/rostering.server";

type Props = { timesheets: TimesheetRow[] };

export function PeriodSummary({ timesheets }: Props) {
  const totalMinutes = timesheets.reduce((sum, t) => sum + t.working_minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const counts = timesheets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const pills: { status: string; label: string; color: string }[] = [
    { status: "Draft", label: "draft", color: "border-status-stone/20 bg-status-stone/10 text-status-stone" },
    { status: "Submitted", label: "pending", color: "border-status-ochre/20 bg-status-ochre/10 text-status-ochre" },
    { status: "Approved", label: "approved", color: "border-status-forest/20 bg-status-forest/10 text-status-forest" },
    { status: "Rejected", label: "rejected", color: "border-status-clay/20 bg-status-clay/10 text-status-clay" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums text-gray-900">{totalHours}</span>
        <span className="text-sm text-gray-500">hours this period</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {pills
          .filter((p) => (counts[p.status] ?? 0) > 0)
          .map((p) => (
            <span
              key={p.status}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${p.color}`}
            >
              {counts[p.status]} {p.label}
            </span>
          ))}
      </div>
    </div>
  );
}
