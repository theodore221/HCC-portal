"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PeriodNav } from "./_components/period-nav";
import { PeriodSummary } from "./_components/period-summary";
import { StaffTimesheetCard } from "./_components/staff-timesheet-card";
import { StaffTimesheetDetail } from "./_components/staff-timesheet-detail";
import { TimesheetFormPanel } from "./_components/timesheet-form-panel";
import type { TimesheetRow } from "@/lib/queries/rostering.server";

type MobileView = "list" | "detail" | "form";

type Props = {
  timesheets: TimesheetRow[];
  periodStart: string;
  periodEnd: string;
  currentPeriodStart: string;
};

export function TimesheetClient({
  timesheets,
  periodStart,
  periodEnd,
  currentPeriodStart,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  // Clear selection when period changes
  useEffect(() => {
    setSelectedId(null);
    setShowForm(false);
    setMobileView("list");
  }, [periodStart]);

  const sorted = [...timesheets].sort((a, b) => a.work_date.localeCompare(b.work_date));
  const selectedTimesheet = timesheets.find((t) => t.id === selectedId) ?? null;

  function handleSelectCard(ts: TimesheetRow) {
    setSelectedId(ts.id);
    setShowForm(false);
    setMobileView("detail");
  }

  function handleLogClick() {
    setShowForm(true);
    setSelectedId(null);
    setMobileView("form");
  }

  function handleFormSuccess() {
    setShowForm(false);
    setMobileView("list");
  }

  const listPanel = (
    <div className="space-y-2 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto px-1 py-1 -mx-1 -my-1">
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          No timesheets for this period.
        </div>
      ) : (
        sorted.map((ts) => (
          <StaffTimesheetCard
            key={ts.id}
            timesheet={ts}
            isSelected={ts.id === selectedId}
            onClick={() => handleSelectCard(ts)}
          />
        ))
      )}
    </div>
  );

  const detailPanel = showForm ? (
    <TimesheetFormPanel
      onSuccess={handleFormSuccess}
      onBack={() => setMobileView("list")}
    />
  ) : selectedTimesheet ? (
    <StaffTimesheetDetail
      key={selectedId!}
      timesheet={selectedTimesheet}
      onBack={() => setMobileView("list")}
    />
  ) : (
    <Card>
      <CardContent className="p-0 min-h-[400px] flex items-center justify-center">
        <p className="text-sm text-gray-400">Select a timesheet to view details</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Period navigation */}
      <PeriodNav
        periodStart={periodStart}
        periodEnd={periodEnd}
        currentPeriodStart={currentPeriodStart}
      />

      {/* Period summary */}
      {timesheets.length > 0 && <PeriodSummary timesheets={timesheets} />}

      {/* Log button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleLogClick} className="gap-1.5">
          <Plus className="size-4" />
          Log timesheet
        </Button>
      </div>

      {/* Mobile: single-column toggle */}
      <div className="lg:hidden">
        {mobileView === "list" && listPanel}
        {(mobileView === "detail" || mobileView === "form") && detailPanel}
      </div>

      {/* Desktop: split layout */}
      <div className="hidden lg:grid lg:grid-cols-[420px_1fr] gap-6">
        {listPanel}
        {detailPanel}
      </div>
    </div>
  );
}
