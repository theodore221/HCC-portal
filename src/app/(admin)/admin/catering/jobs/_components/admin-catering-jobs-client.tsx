"use client";

import { useMemo, useState } from "react";

import { CateringJobsCalendar } from "@/components/catering-jobs-calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateLabel, type EnrichedMealJob } from "@/lib/catering";

interface AdminCateringJobsClientProps {
  jobs: EnrichedMealJob[];
}

export function AdminCateringJobsClient({ jobs }: AdminCateringJobsClientProps) {
  const [view, setView] = useState("calendar");

  const enrichedJobs = jobs;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaysJobs = useMemo(
    () => enrichedJobs.filter((job) => job.date === today),
    [enrichedJobs, today]
  );

  const jobsByDate = useMemo(() => {
    const grouped = enrichedJobs.reduce<Record<string, EnrichedMealJob[]>>(
      (acc, job) => {
        if (!acc[job.date]) {
          acc[job.date] = [];
        }
        acc[job.date].push(job);
        return acc;
      },
      {}
    );

    const sortedDates = Object.keys(grouped).sort();
    return { grouped, sortedDates };
  }, [enrichedJobs]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Catering jobs</CardTitle>
            <CardDescription>Assign caterers and export run sheets</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button>Assign caterer</Button>
            <Button variant="outline">Export run sheets</Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Catering schedule</CardTitle>
            <CardDescription>
              Toggle between calendar and list views to manage upcoming services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
              <TabsContent value="calendar" className="pt-4">
                {enrichedJobs.length ? (
                  <CateringJobsCalendar jobs={enrichedJobs} />
                ) : (
                  <div className="rounded-xl border border-dashed border-olive-200 bg-olive-50/60 p-6 text-center text-sm text-olive-700">
                    No catering services scheduled.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="list" className="pt-4">
                <div className="space-y-6">
                  {jobsByDate.sortedDates.length === 0 ? (
                    <p className="text-sm text-olive-700">
                      No catering services scheduled.
                    </p>
                  ) : null}
                  {jobsByDate.sortedDates.map((dateKey) => {
                    const jobsForDate = jobsByDate.grouped[dateKey];
                    const groupNames = Array.from(
                      new Set(jobsForDate.map((job) => job.groupName))
                    ).join(", ");
                    return (
                      <div
                        key={dateKey}
                        className="space-y-3 rounded-xl border border-olive-100 bg-white/70 p-4"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-olive-900">
                              {formatDateLabel(dateKey)}
                            </h3>
                            <p className="text-xs text-olive-700">
                              {jobsForDate.length} {jobsForDate.length === 1 ? "service" : "services"}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-olive-700">
                            {groupNames}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {jobsForDate.map((job) => (
                            <div key={job.id} className="space-y-2">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-semibold text-olive-800">
                                  {job.groupName}
                                </p>
                                <span className="text-xs text-olive-700">
                                  {job.timeRangeLabel}
                                </span>
                              </div>
                              <MealSlotCard job={job} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <CardDescription>{todaysJobs.length} services</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysJobs.length ? (
              <div className="space-y-3">
                {todaysJobs.map((job) => (
                  <MealSlotCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-olive-700">No catering services scheduled today.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
