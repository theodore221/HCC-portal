"use client";

import { useMemo, useState } from "react";
import { KitchenCalendar } from "@/components/catering/kitchen-calendar";
import { DayDetailPanel } from "@/components/catering/day-detail-panel";
import { CreateCateringJobDialog } from "@/components/catering/create-catering-job-dialog";
import { Button } from "@/components/ui/button";
import { type EnrichedMealJob } from "@/lib/catering";
import type { MealJobCommentWithAuthor } from "@/lib/queries/bookings.server";
import { Calendar, Plus } from "lucide-react";

type DietaryLabel = { id: string; label: string; is_allergy: boolean };

interface AdminCateringJobsClientProps {
  jobs: EnrichedMealJob[];
  commentsMap: Map<string, MealJobCommentWithAuthor[]>;
  caterers: { id: string; name: string }[];
  menuItems: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
  dietaryLabels?: DietaryLabel[];
}

export default function AdminCateringJobsClient({
  jobs,
  commentsMap,
  caterers,
  menuItems,
  dietaryLabels = [],
}: AdminCateringJobsClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const selectedDateJobs = useMemo(
    () => (selectedDate ? jobs.filter((j) => j.date === selectedDate) : []),
    [jobs, selectedDate]
  );

  return (
    <>
      <CreateCateringJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultDate={selectedDate ?? undefined}
        caterers={caterers}
        dietaryLabels={dietaryLabels}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Calendar card (fills available space) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:sticky lg:top-4 lg:self-start">
          <KitchenCalendar
            jobs={jobs}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate((prev) => (prev === d ? null : d))}
          />
        </div>

        {/* Right: Sidebar — date header + jobs */}
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-120px)] lg:overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              {selectedDate ? "" : "Catering Jobs"}
            </h2>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-full px-4"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Job
            </Button>
          </div>

          {selectedDate ? (
            <DayDetailPanel
              date={selectedDate}
              jobs={selectedDateJobs}
              commentsMap={commentsMap}
              caterers={caterers}
              menuItems={menuItems}
              dietaryLabels={dietaryLabels}
              currentUserRole="admin"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-dashed border-gray-200 gap-2">
              <Calendar className="size-8 text-gray-300" />
              <p className="text-sm text-gray-500">Select a date to view catering jobs</p>
              <p className="text-xs text-gray-400">Click any day on the calendar</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
