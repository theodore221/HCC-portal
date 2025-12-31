import type { EnrichedMealJob } from "@/lib/catering";

export function MealSlotCard({ job }: { job: EnrichedMealJob }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white/90 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text">{job.timeSlot}</p>
          <p className="text-xs text-text-light">{job.menu.join(", ")}</p>
        </div>
        {job.percolatedCoffee ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            ☕ Coffee requested
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-text sm:grid-cols-3">
        {Object.entries(job.dietaryCounts).map(([diet, count]) => (
          <div
            key={diet}
            className="flex items-center justify-between rounded-lg bg-neutral border border-border/50 px-2 py-1"
          >
            <span className="capitalize text-text-light">{diet}</span>
            <span className="font-semibold text-text">{count}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-text-light">
        <span>Assigned: {job.assignedCaterer ?? "Unassigned"}</span>
        <span className="font-semibold">Status: {job.status}</span>
      </div>
    </div>
  );
}
