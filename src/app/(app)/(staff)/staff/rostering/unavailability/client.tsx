"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UnavailabilityPeriod, WeeklyUnavailabilityRow } from "@/lib/queries/rostering.server";
import { UnavailabilityForm } from "./_components/unavailability-form";
import { UnavailabilityHistory } from "./_components/unavailability-history";
import { WeeklyPlanner } from "./_components/weekly-planner";

type Props = {
  periods: UnavailabilityPeriod[];
  weeklyRows: WeeklyUnavailabilityRow[];
};

export function StaffUnavailabilityClient({ periods, weeklyRows }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Section 1: Weekly schedule */}
      <WeeklyPlanner initialRows={weeklyRows} />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Section 2: Period unavailability */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Work unavailability</h2>
            <p className="text-xs text-gray-500 mt-0.5">Specific date ranges when you&apos;re unavailable.</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add unavailability
          </Button>
        </div>

        <UnavailabilityHistory periods={periods} />
      </div>

      {/* Add unavailability dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add unavailability period</DialogTitle>
          </DialogHeader>
          <UnavailabilityForm onSuccess={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
