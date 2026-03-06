"use client";

import { useMemo, useState } from "react";
import { StaffMealCard } from "@/components/catering/staff-meal-card";
import { CollapsibleDaySection } from "@/components/catering/collapsible-day-section";
import { KitchenCalendar } from "@/components/catering/kitchen-calendar";
import { DayDetailPanel } from "@/components/catering/day-detail-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateLabel, type EnrichedMealJob } from "@/lib/catering";
import type { MealJobCommentWithAuthor } from "@/lib/queries/bookings.server";

interface StaffKitchenClientProps {
  jobs: EnrichedMealJob[];
  commentsMap?: Map<string, MealJobCommentWithAuthor[]>;
}

export default function StaffKitchenClient({ jobs, commentsMap = new Map() }: StaffKitchenClientProps) {
  const [view, setView] = useState("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const selectedDateJobs = useMemo(
    () => (selectedDate ? jobs.filter((j) => j.date === selectedDate) : []),
    [jobs, selectedDate]
  );

  // Group jobs by date for list view
  const jobsByDate = useMemo(() => {
    const upcomingJobs = jobs.filter((job) => job.date >= today);
    const grouped = upcomingJobs.reduce<Record<string, EnrichedMealJob[]>>((acc, job) => {
      if (!acc[job.date]) acc[job.date] = [];
      acc[job.date].push(job);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dateJobs]) => ({
        date,
        jobs: dateJobs.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
        groupNames: [...new Set(dateJobs.map((j) => j.groupName))],
      }));
  }, [jobs, today]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kitchen</CardTitle>
          <CardDescription>Upcoming meal jobs for preparation and service</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meal Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>

            {/* Calendar view */}
            <TabsContent value="calendar" className="pt-4">
              <div className="flex flex-col md:grid md:grid-cols-[1fr,minmax(380px,45%)] md:gap-6 md:items-start">
                <div className="md:sticky md:top-4">
                  <KitchenCalendar
                    jobs={jobs}
                    selectedDate={selectedDate}
                    onSelectDate={(d) => setSelectedDate((prev) => (prev === d ? null : d))}
                    readOnly
                  />
                </div>
                {selectedDate ? (
                  <div className="mt-6 md:mt-0 md:max-h-[calc(100dvh-160px)] md:overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                    <DayDetailPanel
                      date={selectedDate}
                      jobs={selectedDateJobs}
                      commentsMap={commentsMap}
                      currentUserRole="staff"
                    />
                  </div>
                ) : (
                  <div className="hidden md:flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50 min-h-[200px]">
                    <p className="text-sm text-gray-400">Select a date to view jobs</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* List view */}
            <TabsContent value="list" className="pt-4">
              <div className="space-y-8">
                {jobsByDate.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No upcoming meal jobs scheduled.
                  </p>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
