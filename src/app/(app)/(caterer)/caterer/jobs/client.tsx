"use client";

import { useState, useTransition } from "react";
import { useMemo } from "react";

import { DetailedMealCard } from "@/components/catering/detailed-meal-card";
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
}

export default function CatererJobsClient({
  jobs,
  commentsMap,
}: CatererJobsClientProps) {
  const [declineDialogJob, setDeclineDialogJob] =
    useState<EnrichedMealJob | null>(null);
  const [changesDialogJob, setChangesDialogJob] =
    useState<EnrichedMealJob | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped = jobs.reduce<Record<string, EnrichedMealJob[]>>(
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
      }));
  }, [jobs]);

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

        <div className="space-y-8">
          {jobsByDate.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-olive-600">
                No catering jobs assigned to you.
              </CardContent>
            </Card>
          ) : null}

          {jobsByDate.map(({ date, jobs: dateJobs }) => (
            <section key={date} className="space-y-4">
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2 border-b border-olive-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-olive-900">
                    {formatDateLabel(date)}
                  </h3>
                  <span className="text-sm text-olive-600">
                    {dateJobs.length}{" "}
                    {dateJobs.length === 1 ? "service" : "services"}
                  </span>
                </div>
              </div>

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
            </section>
          ))}
        </div>
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
