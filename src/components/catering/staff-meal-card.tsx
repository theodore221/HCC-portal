import { Users, UtensilsCrossed } from "lucide-react";
import type { EnrichedMealJob } from "@/lib/catering";
import { cn } from "@/lib/utils";

interface StaffMealCardProps {
  job: EnrichedMealJob;
}

export function StaffMealCard({ job }: StaffMealCardProps) {
  const isCoffeeEligible =
    job.meal === "Morning Tea" || job.meal === "Afternoon Tea";
  const hasCoffee = isCoffeeEligible && job.percolatedCoffee;

  // Format dietary counts in a compact way
  const dietaryItems = Object.entries(job.dietaryCounts)
    .filter(([_, count]) => count > 0)
    .map(([diet, count]) => `${diet.toUpperCase()}: ${count}`);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-white/90 p-4 shadow-soft space-y-3"
      )}
    >
      {/* Header: Meal Type + Time */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-text">
              {job.meal}
            </span>
            <span className="text-xs text-text-light">
              {job.timeRangeLabel.split("•")[1]?.trim() || job.timeRangeLabel}
            </span>
          </div>
          <p className="text-sm text-olive-700 mt-1">{job.groupName}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-border/50" />

      {/* Serves + Menu */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-olive-600" />
            <span className="font-medium text-text">{job.countsTotal} serves</span>
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <UtensilsCrossed className="h-4 w-4 text-olive-600" />
            <span className="text-text truncate">{job.menu.join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Coffee Badge */}
      {hasCoffee && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <span className="text-sm text-amber-700">
            ☕ Percolated Coffee
            {job.percolatedCoffeeQuantity
              ? ` (${job.percolatedCoffeeQuantity} cups)`
              : ""}
          </span>
        </div>
      )}

      {/* Dietary Information */}
      {dietaryItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-text-light">Dietary:</span>
          {dietaryItems.map((item, index) => (
            <span key={index} className="text-xs text-text">
              {item}
              {index < dietaryItems.length - 1 ? " •" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
