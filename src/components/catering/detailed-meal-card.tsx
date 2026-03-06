"use client";

import { Coffee, Users, UtensilsCrossed, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentsThread } from "./comments-thread";
import type { EnrichedMealJob } from "@/lib/catering";
import type { MealJobCommentWithAuthor } from "@/lib/queries/bookings.server";
import { cn } from "@/lib/utils";

interface DetailedMealCardProps {
  job: EnrichedMealJob;
  comments: MealJobCommentWithAuthor[];
  currentUserRole: "admin" | "caterer";
  showCatererActions?: boolean;
  onConfirm?: () => void;
  onDecline?: () => void;
  onRequestChanges?: () => void;
}

export function DetailedMealCard({
  job,
  comments,
  currentUserRole,
  showCatererActions = false,
  onConfirm,
  onDecline,
  onRequestChanges,
}: DetailedMealCardProps) {
  // Determine status styling
  const isConfirmed = job.status === "Confirmed";
  const isAssigned = job.status === "Assigned";

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 shadow-soft transition-colors space-y-6",
        isConfirmed
          ? "border-status-forest/20 bg-status-forest/5"
          : "border-gray-200 bg-white"
      )}
    >
      {/* Header: Meal type, time, and status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {job.assignedCatererColor && (
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{
                backgroundColor: job.assignedCatererColor,
              }}
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text">{job.meal}</h4>
              <span className="text-xs text-text-light">
                {job.timeRangeLabel.split("•")[1]?.trim() || job.timeRangeLabel}
              </span>
            </div>
            {job.assignedCaterer && (
              <Badge
                variant="outline"
                className="mt-1 border-gray-200 bg-gray-100 text-gray-700"
              >
                {job.assignedCaterer}
              </Badge>
            )}
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            isConfirmed
              ? "border-status-forest/20 bg-status-forest/10 text-status-forest"
              : isAssigned
              ? "border-gray-200 bg-gray-100 text-gray-700"
              : "border-status-stone/20 bg-status-stone/10 text-status-stone"
          )}
        >
          {job.changesRequested ? "Changes Requested" : job.status}
        </Badge>
      </div>

      {/* Separator */}
      <div className="border-b border-border/50" />

      {/* Serving count and menu */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-light">Serves</label>
          <div className="flex items-center gap-2 text-sm text-text">
            <Users className="h-4 w-4 shrink-0" />
            <span className="font-medium">{job.countsTotal}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-light">Menu Items</label>
          <div className="flex items-start gap-2 text-sm text-text">
            <UtensilsCrossed className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{job.menu.join(", ") || "Menu TBC"}</span>
          </div>
        </div>
      </div>

      {/* Dietary breakdown */}
      {Object.keys(job.dietaryCounts).length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-light">
            Dietary Requirements
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(job.dietaryCounts).map(([diet, count]) => (
              <div
                key={diet}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs border border-gray-200"
              >
                <span className="capitalize text-text-light">{diet}:</span>
                <span className="font-semibold text-text">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coffee request */}
      {job.percolatedCoffee && (
        <div className="flex items-center gap-2 rounded-lg bg-status-ochre/10 border border-status-ochre/20 px-3 py-2 text-sm text-status-ochre">
          <Coffee className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            Percolated coffee requested
            {job.percolatedCoffeeQuantity &&
              ` (${job.percolatedCoffeeQuantity} cups)`}
          </span>
        </div>
      )}

      {/* Changes requested warning for admin */}
      {currentUserRole === "admin" && job.changesRequested && (
        <div className="flex items-center gap-2 rounded-lg bg-status-clay/10 border border-status-clay/20 px-3 py-2.5 text-sm text-status-clay">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            Caterer has requested changes - review comments below
          </span>
        </div>
      )}

      {/* Caterer action buttons */}
      {showCatererActions && job.status === "Assigned" && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <Button size="sm" onClick={onConfirm}>
            Accept Job
          </Button>
          <Button size="sm" variant="outline" onClick={onRequestChanges}>
            Request Changes
          </Button>
          <Button size="sm" variant="destructive" onClick={onDecline}>
            Decline
          </Button>
        </div>
      )}

      {/* Comments thread */}
      <CommentsThread
        mealJobId={job.id}
        comments={comments}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
