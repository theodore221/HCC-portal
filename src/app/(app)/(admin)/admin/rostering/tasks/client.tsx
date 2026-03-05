"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { RosterJob } from "@/lib/queries/rostering.server";
import { JobCard } from "./_components/job-card";
import { AddJobDialog } from "./_components/add-job-dialog";
import { reorderRosterJobs } from "../actions";

type Props = { jobs: RosterJob[] };

export function TasksClient({ jobs }: Props) {
  const [, startTransition] = useTransition();

  function handleMoveJob(jobId: string, direction: "up" | "down") {
    const idx = jobs.findIndex((j) => j.id === jobId);
    if (idx === -1) return;
    const newOrder = jobs.map((j) => j.id);
    if (direction === "up" && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    } else if (direction === "down" && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    } else {
      return;
    }
    startTransition(async () => {
      try {
        await reorderRosterJobs(newOrder);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to reorder jobs");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {jobs.length} roster job{jobs.length !== 1 ? "s" : ""}
        </p>
        <AddJobDialog nextSortOrder={jobs.length} />
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-400">No roster jobs yet</p>
          <p className="text-xs text-gray-400 mt-1">Add a job to start building your task library.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, idx) => (
            <JobCard
              key={job.id}
              job={job}
              isFirst={idx === 0}
              isLast={idx === jobs.length - 1}
              onMoveUp={() => handleMoveJob(job.id, "up")}
              onMoveDown={() => handleMoveJob(job.id, "down")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
