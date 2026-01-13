"use client";

import { useMemo, useState } from "react";

import { CateringJobsCalendar } from "@/components/catering-jobs-calendar";
import { DetailedMealCard } from "@/components/catering/detailed-meal-card";
import { CollapsibleDaySection } from "@/components/catering/collapsible-day-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateLabel, type EnrichedMealJob } from "@/lib/catering";
import type { MealJobCommentWithAuthor } from "@/lib/queries/bookings.server";

interface AdminCateringJobsClientProps {
  jobs: EnrichedMealJob[];
  commentsMap: Map<string, MealJobCommentWithAuthor[]>;
  caterers: { id: string; name: string }[];
  menuItems: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
}

export default function AdminCateringJobsClient({
  jobs,
  commentsMap,
  caterers,
  menuItems,
}: AdminCateringJobsClientProps) {
  const [view, setView] = useState("calendar");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Group by date, then by booking within each date
  const jobsByDateAndBooking = useMemo(() => {
    // Filter to today and future only for list view
    const upcomingJobs = jobs.filter((job) => job.date >= today);

    // First group by date
    const byDate = upcomingJobs.reduce<Record<string, EnrichedMealJob[]>>((acc, job) => {
      if (!acc[job.date]) acc[job.date] = [];
      acc[job.date].push(job);
      return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(byDate).sort();

    // For each date, group by booking
    const result = sortedDates.map((date) => {
      const jobsForDate = byDate[date];
      const byBooking = jobsForDate.reduce<Record<string, EnrichedMealJob[]>>(
        (acc, job) => {
          if (!acc[job.bookingId]) acc[job.bookingId] = [];
          acc[job.bookingId].push(job);
          return acc;
        },
        {}
      );

      // Collect unique group names for this date
      const groupNames = [...new Set(jobsForDate.map((j) => j.groupName))];

      return {
        date,
        bookings: Object.entries(byBooking).map(([bookingId, bookingJobs]) => ({
          bookingId,
          groupName: bookingJobs[0]?.groupName ?? "Unknown",
          jobs: bookingJobs.sort(
            (a, b) => a.startDate.getTime() - b.startDate.getTime()
          ),
        })),
        totalJobs: jobsForDate.length,
        groupNames,
      };
    });

    return result;
  }, [jobs, today]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Catering Jobs</CardTitle>
            <CardDescription>
              Manage caterer assignments and job details
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button>Assign Caterer</Button>
            <Button variant="outline">Export Run Sheets</Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Catering Schedule</CardTitle>
          <CardDescription>
            Toggle between calendar and list views to manage upcoming
            services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="pt-4">
              <CateringJobsCalendar
                jobs={jobs}
                caterers={caterers}
                menuItems={menuItems}
              />
            </TabsContent>

            <TabsContent value="list" className="pt-4">
              <div className="space-y-8">
                {jobsByDateAndBooking.length === 0 ? (
                  <p className="text-sm text-olive-700">
                    No catering services scheduled.
                  </p>
                ) : null}

                {jobsByDateAndBooking.map(({ date, bookings, totalJobs, groupNames }) => (
                  <CollapsibleDaySection
                    key={date}
                    date={date}
                    formattedDate={formatDateLabel(date)}
                    totalJobs={totalJobs}
                    groupNames={groupNames}
                    isToday={date === today}
                  >
                    {/* Bookings for this day */}
                    {bookings.map(
                      ({ bookingId, groupName, jobs: bookingJobs }) => (
                        <div
                          key={bookingId}
                          className="space-y-3 rounded-2xl border border-border/70 bg-white/90 p-5 shadow-soft"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-text">
                              {groupName}
                            </h4>
                            <span className="text-xs text-text-light">
                              {bookingJobs.length}{" "}
                              {bookingJobs.length === 1 ? "meal" : "meals"}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {bookingJobs.map((job) => (
                              <DetailedMealCard
                                key={job.id}
                                job={job}
                                comments={commentsMap.get(job.id) ?? []}
                                currentUserRole="admin"
                              />
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </CollapsibleDaySection>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
