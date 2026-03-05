"use client";

import { useState, useTransition } from "react";
import { Clock, Users, CheckCircle2, XCircle, HelpCircle, ClipboardList, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RosteringStatusChip } from "@/components/ui/rostering-status-chip";
import { EditShiftDialog } from "./edit-shift-dialog";
import { deleteShift } from "../actions";
import type { ShiftDetail, StaffMember, RosterJob } from "@/lib/queries/rostering.server";

type Props = {
  shift: ShiftDetail;
  staff: StaffMember[];
  jobs: RosterJob[];
  onDeleted?: () => void;
  onUpdated?: () => void;
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const ASSIGNMENT_ICONS = {
  Accepted: <CheckCircle2 className="size-4 text-status-forest" />,
  Declined: <XCircle className="size-4 text-status-clay" />,
  Pending: <HelpCircle className="size-4 text-status-ochre" />,
  NoResponse: <HelpCircle className="size-4 text-status-stone" />,
};

export function ShiftDetailPanel({ shift, staff, jobs, onDeleted, onUpdated }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  function handleConfirmDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteShift(shift.id);
        toast.success("Shift deleted");
        setConfirmOpen(false);
        onDeleted?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete shift");
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{shift.title}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <Clock className="size-3.5" />
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <EditShiftDialog shift={shift} staff={staff} jobs={jobs} onUpdated={onUpdated} onDeleted={onDeleted} />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => setConfirmOpen(true)}
              title="Delete shift"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {shift.notes && (
            <p className="text-sm text-gray-600 rounded-lg bg-gray-50 px-3 py-2">
              {shift.notes}
            </p>
          )}

          {/* Staff assignments */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="size-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Staff ({shift.assignments.length})
              </span>
            </div>
            {shift.assignments.length === 0 ? (
              <p className="text-sm text-gray-400 pl-5">No staff assigned</p>
            ) : (
              <div className="space-y-1.5 pl-5">
                {shift.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ASSIGNMENT_ICONS[a.status]}
                      <span className="text-sm text-gray-700">
                        {a.staff_name ?? a.staff_email}
                      </span>
                    </div>
                    <RosteringStatusChip status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          {shift.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ClipboardList className="size-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Tasks ({shift.tasks.length})
                </span>
              </div>
              <div className="space-y-1.5 pl-5">
                {shift.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.job_color }}
                    />
                    <span className="text-sm text-gray-700">{t.job_name} — {t.task_name}</span>
                    {t.estimated_minutes && (
                      <span className="ml-auto text-xs text-gray-400">
                        {t.estimated_minutes} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-gray-900">"{shift.title}"</span>? This will also remove all staff assignments and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deletePending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePending}
            >
              {deletePending ? "Deleting…" : "Delete shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
