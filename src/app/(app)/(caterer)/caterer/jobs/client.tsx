"use client";

import { useState, useTransition } from "react";
import { useMemo } from "react";

import { DetailedMealCard } from "@/components/catering/detailed-meal-card";
import { CateringJobsCalendar } from "@/components/catering-jobs-calendar";
import { CollapsibleDaySection } from "@/components/catering/collapsible-day-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateLabel, type EnrichedMealJob } from "@/lib/catering";
import type { MealJobCommentWithAuthor } from "@/lib/queries/bookings.server";
import {
  confirmMealJob,
  declineMealJob,
  requestMealJobChanges,
} from "@/app/(app)/(admin)/admin/catering/jobs/actions";

interface CatererJobsClientProps {
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

export default function CatererJobsClient({
  jobs,
  commentsMap,
  caterers,
  menuItems,
}: CatererJobsClientProps) {
  const [declineDialogJob, setDeclineDialogJob] =
    useState<EnrichedMealJob | null>(null);
  const [changesDialogJob, setChangesDialogJob] =
    useState<EnrichedMealJob | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState("calendar");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Group jobs by date (filtered to upcoming only)
  const jobsByDate = useMemo(() => {
    // Filter to today and future only for list view
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

  const handleConfirm = (job: EnrichedMealJob) => {
    startTransition(async () => {
      await confirmMealJob(job.id);
    });
  };

  const handleDecline = () => {
    if (!declineDialogJob) return;
    startTransition(async () => {
      await declineMealJob(declineDialogJob.id, reason);
      setDeclineDialogJob(null);
      setReason("");
    });
  };

  const handleRequestChanges = () => {
    if (!changesDialogJob) return;
    startTransition(async () => {
      await requestMealJobChanges(changesDialogJob.id, reason);
      setChangesDialogJob(null);
      setReason("");
    });
  };

  // Count pending jobs needing action
  const pendingCount = jobs.filter((j) => j.status === "Assigned").length;

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Catering Jobs</CardTitle>
            <CardDescription>
              {pendingCount > 0
                ? `You have ${pendingCount} ${pendingCount === 1 ? "job" : "jobs"} awaiting confirmation`
                : "All jobs confirmed"}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Catering Schedule</CardTitle>
            <CardDescription>
              View your assigned catering jobs in calendar or list format.
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
                  readOnly
                />
              </TabsContent>

              <TabsContent value="list" className="pt-4">
                <div className="space-y-8">
                  {jobsByDate.length === 0 ? (
                    <p className="text-sm text-olive-700">
                      No upcoming catering jobs assigned to you.
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
                      <div className="grid gap-4 md:grid-cols-2">
                        {dateJobs.map((job) => (
                          <DetailedMealCard
                            key={job.id}
                            job={job}
                            comments={commentsMap.get(job.id) ?? []}
                            currentUserRole="caterer"
                            showCatererActions
                            onConfirm={() => handleConfirm(job)}
                            onDecline={() => setDeclineDialogJob(job)}
                            onRequestChanges={() => setChangesDialogJob(job)}
                          />
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

      {/* Decline Dialog */}
      <Dialog
        open={!!declineDialogJob}
        onOpenChange={() => setDeclineDialogJob(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Job</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this job. It will be
              returned to the assignment queue.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for declining..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogJob(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isPending}
            >
              Decline Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog
        open={!!changesDialogJob}
        onOpenChange={() => setChangesDialogJob(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe the changes you need. The admin will be notified.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the changes needed..."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangesDialogJob(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={isPending || !reason.trim()}
            >
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
