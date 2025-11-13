"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { formatDateLabel, type EnrichedMealJob } from "@/lib/catering";

interface MealJobsGridCardProps {
  title?: string;
  description?: string;
  jobs?: EnrichedMealJob[];
  emptyMessage?: string;
  onViewDetails?: (job: EnrichedMealJob) => void;
  onMarkServed?: (job: EnrichedMealJob) => void;
}

export function MealJobsGridCard({
  title = "Upcoming week",
  description = "Meals assigned to you",
  jobs = [],
  emptyMessage = "No catering services scheduled.",
  onViewDetails,
  onMarkServed,
}: MealJobsGridCardProps) {
  const groupedByDate = useMemo(() => {
    const grouped = jobs.reduce<Record<string, EnrichedMealJob[]>>(
      (acc, job) => {
        if (!acc[job.date]) {
          acc[job.date] = [];
        }
        acc[job.date].push(job);
        return acc;
      },
      {},
    );

    const sortedDates = Object.keys(grouped).sort();
    return { grouped, sortedDates };
  }, [jobs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedByDate.sortedDates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-olive-200 bg-olive-50/60 p-6 text-center text-sm text-olive-700">
            {emptyMessage}
          </div>
        ) : null}
        {groupedByDate.sortedDates.map((dateKey) => {
          const jobsForDate = groupedByDate.grouped[dateKey];
          const groupNames = Array.from(
            new Set(jobsForDate.map((job) => job.groupName)),
          ).join(", ");
          const totalMeals = jobsForDate.reduce((total, job) => {
            const perJobTotal = Object.values(job.dietaryCounts).reduce(
              (sum, value) => sum + value,
              0,
            );
            return total + perJobTotal;
          }, 0);

          return (
            <section
              key={dateKey}
              className="space-y-4 rounded-xl border border-olive-100 bg-white/70 p-4"
            >
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-olive-900">
                    {formatDateLabel(dateKey)}
                  </h3>
                  <p className="text-xs text-olive-700">
                    {jobsForDate.length} {jobsForDate.length === 1 ? "service" : "services"}
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-xs text-olive-700 sm:items-end">
                  <span className="font-medium">{groupNames || "Group TBC"}</span>
                  <span>
                    {totalMeals} {totalMeals === 1 ? "meal" : "meals"}
                  </span>
                </div>
              </header>
              <div className="space-y-4">
                {jobsForDate.map((job) => (
                  <div key={job.id} className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-olive-800">{job.groupName}</p>
                        <p className="text-xs text-olive-700">{job.timeRangeLabel}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails?.(job)}
                        >
                          View details
                        </Button>
                        <Button size="sm" onClick={() => onMarkServed?.(job)}>
                          Mark served
                        </Button>
                      </div>
                    </div>
                    <MealSlotCard job={job} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
