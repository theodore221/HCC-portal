"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MEAL_COLORS } from "@/lib/catering";
import { MealTypeIcon } from "./meal-type-icon";
import { CateringStatusChip } from "./catering-status-chip";
import { CommentsThread } from "./comments-thread";
import { EditCateringJobDialog } from "./edit-catering-job-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Coffee,
  Users,
  UtensilsCrossed,
  AlertTriangle,
  MoreVertical,
  Pencil,
  Trash2,
  UserX,
  X,
  Leaf,
} from "lucide-react";
import type { EnrichedMealJob } from "@/lib/catering";
import type { MealJobCommentWithAuthor } from "@/lib/queries/bookings.server";
import {
  deleteCateringJob,
  clearChangeRequest,
} from "@/app/(app)/(admin)/admin/catering/jobs/actions";

type DietaryLabel = { id: string; label: string; is_allergy: boolean };

interface DayDetailPanelProps {
  date: string;
  jobs: EnrichedMealJob[];
  commentsMap: Map<string, MealJobCommentWithAuthor[]>;
  currentUserRole?: "admin" | "caterer" | "staff";
  caterers?: { id: string; name: string }[];
  menuItems?: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
  dietaryLabels?: DietaryLabel[];
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DayDetailPanel({
  date,
  jobs,
  commentsMap,
  currentUserRole = "admin",
  caterers = [],
  menuItems = [],
  dietaryLabels = [],
}: DayDetailPanelProps) {
  const isToday = date === getTodayString();

  const { bookingGroups, standaloneJobs } = useMemo(() => {
    const byBooking = new Map<string, { groupName: string; jobs: EnrichedMealJob[] }>();
    const standalone: EnrichedMealJob[] = [];

    for (const job of jobs) {
      if (job.isLinkedToBooking && job.bookingId) {
        const existing = byBooking.get(job.bookingId);
        if (existing) {
          existing.jobs.push(job);
        } else {
          byBooking.set(job.bookingId, { groupName: job.groupName, jobs: [job] });
        }
      } else {
        standalone.push(job);
      }
    }

    return {
      bookingGroups: Array.from(byBooking.values()),
      standaloneJobs: standalone,
    };
  }, [jobs]);

  const confirmed = jobs.filter(
    (j) => j.status === "Confirmed" || j.status === "Completed"
  ).length;
  const pending = jobs.filter((j) => !j.assignedCatererId).length;

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UtensilsCrossed className="size-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-500">No catering jobs</p>
        <p className="text-xs text-gray-400 mt-1">for {formatDayHeader(date)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky header — bg matches page background */}
      <div className="sticky top-0 z-10 bg-[#f8f9fa]/95 backdrop-blur-sm py-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {formatDayHeader(date)}
              {isToday && (
                <span className="ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {confirmed > 0 && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-status-forest/10 text-status-forest">
                  {confirmed} Confirmed
                </span>
              )}
              {pending > 0 && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-status-clay/10 text-status-clay">
                  {pending} Unassigned
                </span>
              )}
              {jobs.length - confirmed - pending > 0 && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-status-ochre/10 text-status-ochre">
                  {jobs.length - confirmed - pending} Assigned
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking groups */}
      {bookingGroups.map(({ groupName, jobs: groupJobs }) => (
        <div key={groupName} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
            {groupName}
          </h4>
          <div className="space-y-3">
            {groupJobs.map((job) => (
              <MealJobCard
                key={job.id}
                job={job}
                comments={commentsMap.get(job.id) ?? []}
                currentUserRole={currentUserRole}
                caterers={caterers}
                menuItems={menuItems}
                dietaryLabels={dietaryLabels}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Standalone jobs */}
      {standaloneJobs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
            Standalone
          </h4>
          <div className="space-y-3">
            {standaloneJobs.map((job) => (
              <MealJobCard
                key={job.id}
                job={job}
                comments={commentsMap.get(job.id) ?? []}
                currentUserRole={currentUserRole}
                caterers={caterers}
                menuItems={menuItems}
                dietaryLabels={dietaryLabels}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MealJobCardProps {
  job: EnrichedMealJob;
  comments: MealJobCommentWithAuthor[];
  currentUserRole: "admin" | "caterer" | "staff";
  caterers?: { id: string; name: string }[];
  menuItems?: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
  dietaryLabels?: DietaryLabel[];
}

function MealJobCard({
  job,
  comments,
  currentUserRole,
  caterers = [],
  menuItems = [],
  dietaryLabels = [],
}: MealJobCardProps) {
  const router = useRouter();
  const mealColor = MEAL_COLORS[job.meal]?.hex ?? "#6b7280";
  const isAdmin = currentUserRole === "admin";

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClearChangeRequest = async () => {
    try {
      await clearChangeRequest(job.id);
      router.refresh();
      toast.success("Change request cleared");
    } catch {
      toast.error("Failed to clear change request");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCateringJob(job.id);
      router.refresh();
      toast.success("Catering job deleted");
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const timeLabel = job.timeRangeLabel.split("•")[1]?.trim() ?? "";
  const dietaryTotal = Object.values(job.dietaryCounts).reduce((s, n) => s + n, 0);

  return (
    <>
      {isAdmin && (
        <EditCateringJobDialog
          job={job}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          caterers={caterers}
          menuItems={menuItems}
          dietaryLabels={dietaryLabels}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {job.meal} catering job for {job.groupName}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Job"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className="rounded-xl bg-white border border-gray-200 shadow-soft overflow-hidden"
        style={{ borderLeftColor: mealColor, borderLeftWidth: "4px" }}
      >
        <div className="p-4 space-y-2.5">
          {/* Header: meal type + time + status + actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MealTypeIcon meal={job.meal} size={16} />
              <span className="text-sm font-semibold text-gray-900">{job.meal}</span>
              <span className="text-xs text-gray-400">{timeLabel}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <CateringStatusChip status={job.changesRequested ? "InPrep" : job.status} />
              {isAdmin && (
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Edit job"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      aria-label="Job options"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {job.changesRequested && (
                      <>
                        <DropdownMenuItem onClick={handleClearChangeRequest}>
                          <X className="size-4 mr-2" />
                          Clear Change Request
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete Job
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Serves + Caterer */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="size-3 text-gray-400" />
              {job.countsTotal} serves
            </span>
            {job.assignedCaterer ? (
              <span className="flex items-center gap-1">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: job.assignedCatererColor ?? mealColor }}
                />
                {job.assignedCaterer}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400">
                <UserX className="size-3" />
                Unassigned
              </span>
            )}
          </div>

          {/* Menu + Coffee */}
          {(job.menu.length > 0 || job.percolatedCoffee) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
              {job.menu.length > 0 && (
                <span className="flex items-center gap-1">
                  <UtensilsCrossed className="size-3 text-gray-400" />
                  {job.menu.join(", ")}
                </span>
              )}
              {job.percolatedCoffee && (
                <span className="flex items-center gap-1 text-status-ochre">
                  <Coffee className="size-3" />
                  Coffee{job.percolatedCoffeeQuantity ? ` (${job.percolatedCoffeeQuantity})` : ""}
                </span>
              )}
            </div>
          )}

          {/* Dietary summary */}
          {dietaryTotal > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Leaf className="size-3 text-primary" />
              {dietaryTotal} dietary
            </div>
          )}

          {/* Changes requested banner */}
          {job.changesRequested && currentUserRole === "admin" && (
            <div className="flex items-center gap-1.5 rounded-lg bg-status-clay/10 border border-status-clay/20 px-2.5 py-1.5 text-xs text-status-clay">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>Caterer requested changes — review comments</span>
            </div>
          )}

          {/* Comments */}
          {currentUserRole !== "staff" && (
            <CommentsThread
              mealJobId={job.id}
              comments={comments}
              currentUserRole={currentUserRole === "admin" ? "admin" : "caterer"}
            />
          )}
        </div>
      </div>
    </>
  );
}
