"use client";

import { useMemo } from "react";

import { StaffMealCard } from "@/components/catering/staff-meal-card";
import { CollapsibleDaySection } from "@/components/catering/collapsible-day-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateLabel, type EnrichedMealJob } from "@/lib/catering";

interface StaffKitchenClientProps {
  jobs: EnrichedMealJob[];
}

export default function StaffKitchenClient({ jobs }: StaffKitchenClientProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Group jobs by date (filtered to upcoming only)
  const jobsByDate = useMemo(() => {
    // Filter to today and future only
    const upcomingJobs = jobs.filter((job) => job.date >= today);

    const grouped = upcomingJobs.reduce<Record<string, EnrichedMealJob[]>>(
      (acc, job) => {
        if (!acc[job.date]) acc[job.date] = [];
        acc[job.date].push(job);
        return acc;
      },
      {}
    );

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dateJobs]) => ({
        date,
        jobs: dateJobs.sort(
          (a, b) => a.startDate.getTime() - b.startDate.getTime()
        ),
        groupNames: [...new Set(dateJobs.map((j) => j.groupName))],
      }));
  }, [jobs, today]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kitchen</CardTitle>
          <CardDescription>
            Upcoming meal jobs for preparation and service
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-8">
        {jobsByDate.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-olive-600">
              No upcoming meal jobs scheduled.
            </CardContent>
          </Card>
        ) : null}

        {jobsByDate.map(({ date, jobs: dateJobs, groupNames }) => (
          <CollapsibleDaySection
            key={date}
            date={date}
            formattedDate={formatDateLabel(date)}
            totalJobs={dateJobs.length}
            groupNames={groupNames}
            isToday={date === today}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dateJobs.map((job) => (
                <StaffMealCard key={job.id} job={job} />
              ))}
            </div>
          </CollapsibleDaySection>
        ))}
      </div>
    </div>
  );
}
