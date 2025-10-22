import { MealJob } from "@/lib/mock-data";

export function MealSlotCard({ job }: { job: MealJob }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-olive-100 bg-white/70 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-olive-900">{job.timeSlot}</p>
          <p className="text-xs text-olive-700">{job.menu.join(", ")}</p>
        </div>
        {job.percolatedCoffee ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            ☕ Coffee requested
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-olive-800 sm:grid-cols-3">
        {Object.entries(job.dietaryCounts).map(([diet, count]) => (
          <div
            key={diet}
            className="flex items-center justify-between rounded-lg bg-olive-50 px-2 py-1"
          >
            <span className="capitalize">{diet}</span>
            <span className="font-semibold">{count}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-olive-700">
        <span>Assigned: {job.assignedCaterer ?? "Unassigned"}</span>
        <span className="font-semibold">Status: {job.status}</span>
      </div>
    </div>
  );
}
