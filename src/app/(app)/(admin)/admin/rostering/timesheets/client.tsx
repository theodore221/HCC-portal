"use client";

import { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Download, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "./_components/date-range-picker";
import { SortToggle, type SortMode } from "./_components/sort-toggle";
import { TimesheetCard } from "./_components/timesheet-card";
import { TimesheetGroupSection } from "./_components/timesheet-group-section";
import { TimesheetDetailPanel } from "./_components/timesheet-detail-panel";
import { bulkApproveTimesheets } from "../actions";
import type { TimesheetRow } from "@/lib/queries/rostering.server";

type Group = {
  key: string;
  label: string;
  totalMinutes: number;
  timesheets: TimesheetRow[];
};

function groupTimesheets(timesheets: TimesheetRow[], sortMode: SortMode): Group[] {
  if (sortMode === "staff") {
    const map = new Map<string, Group>();
    for (const ts of timesheets) {
      const key = ts.staff_profile_id;
      const label = ts.staff_name ?? "Unknown";
      if (!map.has(key)) map.set(key, { key, label, totalMinutes: 0, timesheets: [] });
      const g = map.get(key)!;
      g.timesheets.push(ts);
      g.totalMinutes += ts.working_minutes;
    }
    return Array.from(map.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((g) => ({
        ...g,
        timesheets: g.timesheets.sort((a, b) => a.work_date.localeCompare(b.work_date)),
      }));
  }

  if (sortMode === "date") {
    const map = new Map<string, Group>();
    for (const ts of timesheets) {
      const key = ts.work_date;
      const label = new Date(`${key}T00:00:00`).toLocaleDateString("en-AU", {
        weekday: "short", day: "numeric", month: "short",
      });
      if (!map.has(key)) map.set(key, { key, label, totalMinutes: 0, timesheets: [] });
      const g = map.get(key)!;
      g.timesheets.push(ts);
      g.totalMinutes += ts.working_minutes;
    }
    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((g) => ({
        ...g,
        timesheets: g.timesheets.sort((a, b) =>
          (a.staff_name ?? "").localeCompare(b.staff_name ?? "")
        ),
      }));
  }

  // By status — fixed order
  const STATUS_ORDER: TimesheetRow["status"][] = ["Submitted", "Draft", "Rejected", "Approved"];
  const map = new Map<string, Group>();
  for (const ts of timesheets) {
    const key = ts.status;
    if (!map.has(key)) map.set(key, { key, label: key, totalMinutes: 0, timesheets: [] });
    const g = map.get(key)!;
    g.timesheets.push(ts);
    g.totalMinutes += ts.working_minutes;
  }
  return STATUS_ORDER.filter((s) => map.has(s)).map((s) => ({
    ...map.get(s)!,
    timesheets: map.get(s)!.timesheets.sort(
      (a, b) =>
        a.work_date.localeCompare(b.work_date) ||
        (a.staff_name ?? "").localeCompare(b.staff_name ?? "")
    ),
  }));
}

type Props = {
  timesheets: TimesheetRow[];
  periodStart: string;
  periodEnd: string;
  currentPeriodStart: string;
  mode: "fortnight" | "custom";
};

export function TimesheetsClient({
  timesheets,
  periodStart,
  periodEnd,
  currentPeriodStart,
  mode,
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("staff");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pending, startTransition] = useTransition();

  const groups = useMemo(() => groupTimesheets(timesheets, sortMode), [timesheets, sortMode]);
  const pendingCount = timesheets.filter((t) => t.status === "Submitted").length;
  const pendingIds = timesheets.filter((t) => t.status === "Submitted").map((t) => t.id);
  const selectedTimesheet = timesheets.find((t) => t.id === selectedId) ?? null;

  function handleSelectCard(ts: TimesheetRow) {
    setSelectedId(ts.id);
    setMobileView("detail");
  }

  function handleBulkApprove() {
    startTransition(async () => {
      try {
        await bulkApproveTimesheets(pendingIds);
        toast.success(`${pendingIds.length} timesheets approved`);
        setBulkDialogOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to bulk approve");
      }
    });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/rostering/export-timesheets?start=${periodStart}&end=${periodEnd}`
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheets-${periodStart}-to-${periodEnd}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export timesheets");
    } finally {
      setExporting(false);
    }
  }

  const listPanel = (
    <div className="space-y-2 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto px-1 py-1 -mx-1 -my-1">
      {timesheets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          <p>No timesheets for this period.</p>
          <p className="mt-1 text-xs">
            Try navigating to a different period or switching to custom dates.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="space-y-2">
            <TimesheetGroupSection
              label={group.label}
              totalMinutes={group.totalMinutes}
              count={group.timesheets.length}
              status={sortMode === "status" ? group.key : undefined}
            />
            {group.timesheets.map((ts) => (
              <TimesheetCard
                key={ts.id}
                timesheet={ts}
                isSelected={ts.id === selectedId}
                onClick={() => handleSelectCard(ts)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );

  const approvedCount = timesheets.filter((t) => t.status === "Approved").length;
  const rejectedCount = timesheets.filter((t) => t.status === "Rejected").length;

  return (
    <div className="space-y-6">
      <DateRangePicker
        mode={mode}
        periodStart={periodStart}
        periodEnd={periodEnd}
        currentPeriodStart={currentPeriodStart}
      />

      {timesheets.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ochre/20 bg-status-ochre/10 px-3 py-1 text-status-ochre font-medium">
            {pendingCount} pending review
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-forest/20 bg-status-forest/10 px-3 py-1 text-status-forest font-medium">
            {approvedCount} approved
          </span>
          {rejectedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-clay/20 bg-status-clay/10 px-3 py-1 text-status-clay font-medium">
              {rejectedCount} rejected
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SortToggle value={sortMode} onChange={setSortMode} />
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Button size="sm" onClick={() => setBulkDialogOpen(true)} className="gap-1.5">
              <CheckCircle2 className="size-4" />
              Approve all ({pendingCount})
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export
          </Button>
        </div>
      </div>

      {/* Mobile: list or detail */}
      <div className="lg:hidden">
        {mobileView === "list" ? (
          listPanel
        ) : selectedTimesheet ? (
          <TimesheetDetailPanel
            key={selectedId!}
            timesheetId={selectedId!}
            timesheet={selectedTimesheet}
            onClose={() => setMobileView("list")}
          />
        ) : null}
      </div>

      {/* Desktop: split layout */}
      <div className="hidden lg:grid lg:grid-cols-[420px_1fr] gap-6">
        {listPanel}
        <div>
          {selectedTimesheet ? (
            <TimesheetDetailPanel
              key={selectedId!}
              timesheetId={selectedId!}
              timesheet={selectedTimesheet}
            />
          ) : (
            <Card>
              <CardContent className="p-0 min-h-[400px] flex items-center justify-center">
                <p className="text-sm text-gray-400">Select a timesheet to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bulk approve dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve all pending timesheets?</DialogTitle>
            <DialogDescription>
              This will approve {pendingCount} timesheet{pendingCount !== 1 ? "s" : ""}. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkApprove} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 mr-1.5" />
              )}
              Approve all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
