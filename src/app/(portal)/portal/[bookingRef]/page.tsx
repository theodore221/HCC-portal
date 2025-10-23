import { notFound } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
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
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS, MOCK_ROOMS, MOCK_DIETARIES } from "@/lib/mock-data";

const steps = ["Deposit", "Catering", "Rooming", "Summary"];

type DietaryRegisterItem = (typeof MOCK_DIETARIES)[number];

const dietaryColumns: ColumnDef<DietaryRegisterItem>[] = [
  {
    accessorKey: "name",
    header: "Guest",
    cell: ({ row }) => (
      <span className="font-medium text-olive-900">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "dietType",
    header: "Diet type",
  },
  {
    accessorKey: "allergy",
    header: "Allergy",
    cell: ({ row }) => row.original.allergy || "—",
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const severity = row.original.severity;
      const styles =
        severity === "Fatal"
          ? "bg-red-100 text-red-700"
          : severity === "High"
          ? "bg-amber-100 text-amber-700"
          : "bg-olive-100 text-olive-800";

      return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
          {severity}
        </span>
      );
    },
    enableSorting: false,
    meta: {
      cellClassName: "min-w-[120px]",
    },
  },
];

export default function CustomerPortal({
  params,
}: {
  params: { bookingRef: string };
}) {
  const booking = MOCK_BOOKINGS.find((b) => b.reference === params.bookingRef);
  if (!booking) return notFound();
  const currentStep = booking.status === "DepositReceived" ? 2 : booking.status === "Approved" ? 1 : 0;
  const cateringJobs = MOCK_MEAL_JOBS.filter((job) => job.bookingId === booking.id);
  const rooms = MOCK_ROOMS;

  return (
    <div className="space-y-8">
      <Stepper steps={steps} currentStep={currentStep} />
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{`Booking reference ${booking.reference}`}</CardTitle>
            <CardDescription>{`${booking.groupName} · ${booking.headcount} guests`}</CardDescription>
          </div>
          <StatusChip status={booking.status} />
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              1 · Deposit instructions
            </h3>
            <p className="text-sm leading-relaxed text-olive-800">
              A $1,500 deposit is required to secure your dates. Transfer to the Holy Cross Centre account and include your booking
              reference. Once finance confirms payment your catering and rooming steps unlock automatically.
            </p>
            <div className="grid gap-3 rounded-xl border border-olive-100 bg-white p-4 sm:grid-cols-2">
              <InfoBlock label="Bank" value="Holy Cross Centre" />
              <InfoBlock label="BSB" value="033-123" />
              <InfoBlock label="Account" value="124 567 890" />
              <InfoBlock label="Reference" value={booking.reference} />
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              2 · Catering planner
            </h3>
            <p className="text-sm text-olive-800">
              Select meals for each day. Totals automatically validate against your headcount. Morning and Afternoon Tea include a
              percolated coffee option.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {cateringJobs.map((job) => (
                <MealSlotCard key={job.id} job={job} />
              ))}
            </div>
            <Button className="w-full md:w-auto" variant="outline">
              Add dietary note
            </Button>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              Dietary register
            </h3>
            <DataTable
              columns={dietaryColumns}
              data={MOCK_DIETARIES}
              hidePagination
              containerClassName="bg-white"
            />
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              3 · Rooming planner
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-olive-200 bg-white/60 p-4 text-sm text-olive-700 sm:flex-row sm:items-center sm:justify-between">
              <div>Upload a CSV or XLSX template to import your guest list in bulk.</div>
              <Button variant="ghost">Download template</Button>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
              4 · Summary & submit
            </h3>
            <p className="text-sm text-olive-800">
              Review your selections. Changes remain available until 7 days prior to arrival. After that window contact the HCC team
              for adjustments.
            </p>
            <Button className="w-full md:w-auto">Submit updates</Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-olive-600">{label}</p>
      <p className="text-sm font-medium text-olive-900">{value}</p>
    </div>
  );
}
