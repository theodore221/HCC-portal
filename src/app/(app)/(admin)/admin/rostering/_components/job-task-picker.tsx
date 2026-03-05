"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { RosterJob } from "@/lib/queries/rostering.server";

type Props = {
  jobs: RosterJob[];
  selectedTaskIds: string[];
  onSelectedTaskIdsChange: (ids: string[]) => void;
};

export function JobTaskPicker({ jobs, selectedTaskIds, onSelectedTaskIdsChange }: Props) {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  function toggleExpand(jobId: string) {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }

  function getJobCheckState(job: RosterJob): boolean | "indeterminate" {
    const activeTasks = job.tasks.filter((t) => t.active);
    if (activeTasks.length === 0) return false;
    const checkedCount = activeTasks.filter((t) => selectedTaskIds.includes(t.id)).length;
    if (checkedCount === 0) return false;
    if (checkedCount === activeTasks.length) return true;
    return "indeterminate";
  }

  function toggleJobTasks(job: RosterJob) {
    const activeTasks = job.tasks.filter((t) => t.active);
    const activeTaskIds = activeTasks.map((t) => t.id);
    const allChecked = activeTaskIds.every((id) => selectedTaskIds.includes(id));

    if (allChecked) {
      // Uncheck all tasks for this job
      onSelectedTaskIdsChange(selectedTaskIds.filter((id) => !activeTaskIds.includes(id)));
    } else {
      // Check all active tasks for this job
      const withoutJob = selectedTaskIds.filter((id) => !activeTaskIds.includes(id));
      onSelectedTaskIdsChange([...withoutJob, ...activeTaskIds]);
    }
  }

  function toggleTask(taskId: string) {
    if (selectedTaskIds.includes(taskId)) {
      onSelectedTaskIdsChange(selectedTaskIds.filter((id) => id !== taskId));
    } else {
      onSelectedTaskIdsChange([...selectedTaskIds, taskId]);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 max-h-64 overflow-y-auto divide-y divide-gray-100">
      {jobs.map((job) => {
        const activeTasks = job.tasks.filter((t) => t.active);
        const isExpanded = expandedJobs.has(job.id);
        const checkState = getJobCheckState(job);

        return (
          <div key={job.id}>
            {/* Job row */}
            <div
              className={`flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 ${checkState !== false ? "bg-primary/5" : ""}`}
            >
              <Checkbox
                checked={checkState}
                onCheckedChange={() => toggleJobTasks(job)}
                disabled={activeTasks.length === 0}
                aria-label={`Select all tasks for ${job.name}`}
              />
              {checkState === "indeterminate" && (
                <span className="sr-only">Partially selected</span>
              )}
              <button
                type="button"
                onClick={() => toggleExpand(job.id)}
                className="flex items-center gap-2 flex-1 text-left"
                disabled={activeTasks.length === 0}
              >
                <span
                  className="size-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: job.color }}
                />
                <span className="text-sm text-gray-700 flex-1">{job.name}</span>
                {activeTasks.length > 0 && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {selectedTaskIds.filter((id) => activeTasks.some((t) => t.id === id)).length}/{activeTasks.length}
                  </span>
                )}
                {activeTasks.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown className="size-3.5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="size-3.5 text-gray-400 flex-shrink-0" />
                  )
                ) : (
                  <span className="text-xs text-gray-400 flex-shrink-0 italic">no tasks</span>
                )}
              </button>
            </div>

            {/* Task list (expanded) */}
            {isExpanded && activeTasks.length > 0 && (
              <div className="bg-gray-50/60 divide-y divide-gray-100">
                {activeTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-2.5 pl-8 pr-3 py-2 cursor-pointer hover:bg-gray-100/60"
                  >
                    <Checkbox
                      checked={selectedTaskIds.includes(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                      aria-label={task.name}
                    />
                    <span className="text-sm text-gray-600 flex-1">{task.name}</span>
                    {task.estimated_minutes != null && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {task.estimated_minutes} min
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
