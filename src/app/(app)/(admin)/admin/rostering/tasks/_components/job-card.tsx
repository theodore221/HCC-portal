"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2, Clock, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTaskDialog } from "./add-task-dialog";
import { EditJobDialog } from "./edit-job-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import type { RosterJob } from "@/lib/queries/rostering.server";
import { deleteRosterJob, deleteRosterTask, reorderRosterTasks } from "../../actions";

type Props = {
  job: RosterJob;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function JobCard({ job, isFirst, isLast, onMoveUp, onMoveDown }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteJobDialogOpen, setDeleteJobDialogOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [editJobOpen, setEditJobOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  function handleDeleteJob() {
    setDeleteJobDialogOpen(false);
    startDeleteTransition(async () => {
      try {
        await deleteRosterJob(job.id);
        toast.success("Job deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete job");
      }
    });
  }

  function handleDeleteTask() {
    if (!deleteTaskId) return;
    const id = deleteTaskId;
    setDeleteTaskId(null);
    startTransition(async () => {
      try {
        await deleteRosterTask(id);
        toast.success("Task deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete task");
      }
    });
  }

  function handleMoveTask(taskId: string, direction: "up" | "down") {
    const activeTasks = job.tasks.filter((t) => t.active);
    const idx = activeTasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return;
    const newOrder = activeTasks.map((t) => t.id);
    if (direction === "up" && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    } else if (direction === "down" && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    } else {
      return;
    }
    startTransition(async () => {
      try {
        await reorderRosterTasks(job.id, newOrder);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to reorder tasks");
      }
    });
  }

  const activeTasks = job.tasks.filter((t) => t.active);
  const editTask = activeTasks.find((t) => t.id === editTaskId) ?? null;

  return (
    <>
      <div
        className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden"
        style={{ borderLeftColor: job.color, borderLeftWidth: "4px" }}
      >
        {/* Job header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{job.name}</p>
              {job.description && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{job.description}</p>
              )}
            </div>
            <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 tabular-nums">
              {activeTasks.length}
            </span>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setEditJobOpen(true)}>
                  <Pencil className="size-3.5 mr-2 text-gray-400" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={isFirst || deletePending} onClick={onMoveUp}>
                  <ArrowUp className="size-3.5 mr-2 text-gray-400" />
                  Move up
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isLast || deletePending} onClick={onMoveDown}>
                  <ArrowDown className="size-3.5 mr-2 text-gray-400" />
                  Move down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-status-clay focus:text-status-clay focus:bg-status-clay/10"
                  onClick={() => setDeleteJobDialogOpen(true)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon-sm"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              tabIndex={-1}
            >
              {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Task list */}
        {expanded && activeTasks.length > 0 && (
          <div className="border-t border-gray-100">
            {activeTasks.map((task, idx) => (
              <div
                key={task.id}
                className={`group flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                  idx < activeTasks.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span
                    className="size-1.5 rounded-full flex-shrink-0 opacity-60"
                    style={{ backgroundColor: job.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">{task.name}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                    )}
                  </div>
                  {task.estimated_minutes && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 ml-1">
                      <Clock className="size-3" />
                      {task.estimated_minutes}m
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setEditTaskId(task.id)}>
                      <Pencil className="size-3.5 mr-2 text-gray-400" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={idx === 0 || pending}
                      onClick={() => handleMoveTask(task.id, "up")}
                    >
                      <ArrowUp className="size-3.5 mr-2 text-gray-400" />
                      Move up
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={idx === activeTasks.length - 1 || pending}
                      onClick={() => handleMoveTask(task.id, "down")}
                    >
                      <ArrowDown className="size-3.5 mr-2 text-gray-400" />
                      Move down
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-status-clay focus:text-status-clay focus:bg-status-clay/10"
                      onClick={() => setDeleteTaskId(task.id)}
                    >
                      <Trash2 className="size-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* Empty state + add task */}
        {expanded && (
          <div className={`px-4 py-3 ${activeTasks.length > 0 ? "border-t border-gray-100" : ""}`}>
            {activeTasks.length === 0 && (
              <p className="text-xs text-gray-400 mb-2.5">No tasks yet — add one below.</p>
            )}
            <AddTaskDialog jobId={job.id} nextSortOrder={activeTasks.length} />
          </div>
        )}
      </div>

      <EditJobDialog job={job} open={editJobOpen} onOpenChange={setEditJobOpen} />

      {editTask && (
        <EditTaskDialog
          task={editTask}
          open={editTaskId !== null}
          onOpenChange={(open) => { if (!open) setEditTaskId(null); }}
        />
      )}

      <DeleteConfirmDialog
        open={deleteJobDialogOpen}
        onOpenChange={setDeleteJobDialogOpen}
        title="Delete roster job"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">"{job.name}"</span>? All tasks within this
            job will also be deleted. If any tasks are assigned to shifts, the deletion will fail.
          </>
        }
        onConfirm={handleDeleteJob}
        pending={deletePending}
      />

      <DeleteConfirmDialog
        open={deleteTaskId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTaskId(null); }}
        title="Delete task"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">
              "{activeTasks.find((t) => t.id === deleteTaskId)?.name ?? ""}"
            </span>
            ? This cannot be undone.
          </>
        }
        onConfirm={handleDeleteTask}
        pending={pending}
      />
    </>
  );
}
