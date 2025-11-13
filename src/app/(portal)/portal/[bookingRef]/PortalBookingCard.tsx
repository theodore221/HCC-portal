"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";

import { Stepper } from "@/components/ui/stepper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { RoomCard } from "@/components/ui/room-card";
import { StatusChip } from "@/components/ui/status-chip";
import type {
  BookingWithMeta,
  DietaryProfile,
  RoomWithAssignments,
} from "@/lib/queries/bookings";
import type { EnrichedMealJob } from "@/lib/catering";
import { getBookingDisplayName } from "@/lib/queries/bookings";

import { useBookingAutosave } from "./hooks/useBookingAutosave";
import type { AutosaveStatus } from "./hooks/useBookingAutosave";
import { DietaryRegister } from "./components/DietaryRegister";

const steps = ["Deposit", "Catering", "Rooming", "Summary"];

type PortalBookingCardProps = {
  booking: BookingWithMeta;
  cateringJobs: EnrichedMealJob[];
  rooms: RoomWithAssignments[];
  dietaryProfiles: DietaryProfile[];
};

export function PortalBookingCard({
  booking,
  cateringJobs,
  rooms,
  dietaryProfiles,
}: PortalBookingCardProps) {
  const autosave = useBookingAutosave({
    bookingId: booking.id,
    initialData: (booking.portal_metadata ?? {}) as Record<string, unknown>,
  });

  const currentStep = useMemo(() => {
    if (booking.status === "DepositReceived") return 2;
    if (booking.status === "Approved") return 1;
    return 0;
  }, [booking.status]);

  return (
    <div className="space-y-8">
      <Stepper steps={steps} currentStep={currentStep} />
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{`Booking reference ${booking.reference ?? booking.id}`}</CardTitle>
            <CardDescription>{`${getBookingDisplayName(booking)} · ${booking.headcount} guests`}</CardDescription>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <AutosaveStatusIndicator status={autosave.status} />
            <StatusChip status={booking.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              1 · Deposit instructions
            </h3>
            <p className="text-sm leading-relaxed text-olive-800">
              A $1,500 deposit is required to secure your dates. Transfer to the Holy Cross Centre account and include your booking reference. Once finance confirms payment your catering and rooming steps unlock automatically.
            </p>
            <div className="grid gap-3 rounded-xl border border-olive-100 bg-white p-4 sm:grid-cols-2">
              <InfoBlock label="Bank" value="Holy Cross Centre" />
              <InfoBlock label="BSB" value="033-123" />
              <InfoBlock label="Account" value="124 567 890" />
              <InfoBlock label="Reference" value={booking.reference ?? booking.id} />
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              2 · Catering planner
            </h3>
            <p className="text-sm text-olive-800">
              Select meals for each day. Totals automatically validate against your headcount. Morning and Afternoon Tea include a percolated coffee option.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {cateringJobs.length ? (
                cateringJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
              ) : (
                <p className="text-sm text-olive-700">No catering services scheduled.</p>
              )}
            </div>
            <Button className="w-full md:w-auto" variant="outline">
              Add dietary note
            </Button>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Dietary register
            </h3>
            <DietaryRegister
              bookingId={booking.id}
              initialProfiles={dietaryProfiles}
              trackStatus={autosave.trackOperation}
            />
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              3 · Rooming planner
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {rooms.length ? (
                rooms.map((room) => <RoomCard key={room.id} room={room} />)
              ) : (
                <p className="text-sm text-olive-700">No room assignments yet.</p>
              )}
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-olive-200 bg-white/60 p-4 text-sm text-olive-700 sm:flex-row sm:items-center sm:justify-between">
              <div>Upload a CSV or XLSX template to import your guest list in bulk.</div>
              <Button variant="ghost">Download template</Button>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              4 · Summary &amp; submit
            </h3>
            <p className="text-sm text-olive-800">
              Review your selections. Changes remain available until 7 days prior to arrival. After that window contact the HCC team for adjustments.
            </p>
            <Button className="w-full md:w-auto">Submit updates</Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function AutosaveStatusIndicator({ status }: { status: AutosaveStatus }) {
  let icon = <CheckCircle2 className="h-4 w-4 text-olive-500" />;
  let message = "All changes up to date";
  let style = "text-olive-700";

  if (status.isSaving) {
    icon = <Loader2 className="h-4 w-4 animate-spin text-olive-600" />;
    message = "Saving changes…";
    style = "text-olive-700";
  } else if (status.isError) {
    icon = <AlertCircle className="h-4 w-4 text-rose-600" />;
    message = status.error ?? "Save failed";
    style = "text-rose-700";
  } else if (status.isDirty) {
    icon = <Clock3 className="h-4 w-4 text-amber-600" />;
    message = "Unsaved changes";
    style = "text-amber-700";
  } else if (status.isSaved) {
    icon = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    message = status.lastSavedAt
      ? `Saved ${formatRelativeTime(status.lastSavedAt)}`
      : "All changes saved";
    style = "text-emerald-700";
  }

  return (
    <div className={`flex items-center gap-2 rounded-full border border-olive-200 bg-white/80 px-3 py-1 text-xs font-medium ${style}`}>
      {icon}
      <span>{message}</span>
    </div>
  );
}

function formatRelativeTime(timestamp: number) {
  const delta = Date.now() - timestamp;
  if (delta < 10_000) return "just now";
  if (delta < 60_000) return `${Math.round(delta / 1_000)}s ago`;
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-olive-600">{label}</p>
      <p className="text-sm font-medium text-olive-900">{value}</p>
    </div>
  );
}
