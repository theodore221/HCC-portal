"use client";

import { useMemo, useState } from "react";

import { CateringJobsCalendar } from "@/components/catering-jobs-calendar";
import { MealJobsGridCard } from "@/components/meal-jobs-grid-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EnrichedMealJob } from "@/lib/catering";

interface CatererJobsClientProps {
  jobs: EnrichedMealJob[];
  catererName: string;
}

export function CatererJobsClient({ jobs, catererName }: CatererJobsClientProps) {
  const [view, setView] = useState("calendar");

  const assignedJobs = useMemo(
    () => jobs.filter((job) => job.assignedCaterer === catererName),
    [jobs, catererName]
  );

  const handleViewDetails = (job: EnrichedMealJob) => {
    console.info("View details for", job.id);
  };

  const handleMarkServed = (job: EnrichedMealJob) => {
    console.info("Mark served", job.id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My jobs</CardTitle>
            <CardDescription>
              Stay across your assigned catering services and daily priorities.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Export run sheet</Button>
            <Button variant="ghost">Bulk mark served</Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Upcoming services</CardTitle>
          <CardDescription>
            Switch between calendar and list views to prep for the week ahead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={view} onValueChange={setView} className="space-y-4">
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">Grouped list</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className="space-y-4">
              {assignedJobs.length ? (
                <CateringJobsCalendar jobs={assignedJobs} />
              ) : (
                <div className="rounded-xl border border-dashed border-olive-200 bg-olive-50/60 p-6 text-center text-sm text-olive-700">
                  You don&apos;t have any catering services assigned yet.
                </div>
              )}
            </TabsContent>
            <TabsContent value="list">
              <MealJobsGridCard
                title="Assigned services"
                description={`All meals assigned to ${catererName}`}
                jobs={assignedJobs}
                emptyMessage="You don&apos;t have any catering services assigned yet."
                onViewDetails={handleViewDetails}
                onMarkServed={handleMarkServed}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
