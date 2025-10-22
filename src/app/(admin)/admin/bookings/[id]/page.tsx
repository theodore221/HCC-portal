import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { ConflictBanner } from "@/components/ui/conflict-banner";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { AuditTimeline } from "@/components/ui/audit-timeline";
import { RoomCard } from "@/components/ui/room-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS, MOCK_ROOMS } from "@/lib/mock-data";
import { formatDateRange } from "@/lib/utils";

const tabConfig = [
  { value: "overview", label: "Overview" },
  { value: "triage", label: "Triage" },
  { value: "spaces", label: "Spaces" },
  { value: "accommodation", label: "Accommodation" },
  { value: "catering", label: "Catering" },
  { value: "timeline", label: "Timeline" },
  { value: "docs", label: "Docs" },
];

export default function BookingDetail({ params }: { params: { id: string } }) {
  const booking = MOCK_BOOKINGS.find((b) => b.id === params.id);
  if (!booking) return notFound();
  const mealJobs = MOCK_MEAL_JOBS.filter((job) => job.bookingId === booking.id);

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{booking.groupName}</CardTitle>
            <CardDescription>
              {formatDateRange(booking.arrival, booking.departure)} · {booking.headcount} guests
            </CardDescription>
          </div>
          <StatusChip status={booking.status} />
        </CardHeader>
        <CardContent>
          <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
            {tabConfig.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-full border border-transparent">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardContent>
      </Card>

      <TabsContent value="overview" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Status timeline
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Pending", "Approved", "Deposit Received"].map((stage) => (
              <div key={stage} className="rounded-xl border border-olive-100 bg-white/80 p-4 text-sm">
                <p className="font-semibold text-olive-900">{stage}</p>
                <p className="text-xs text-olive-700">Date placeholder</p>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Summary
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Reference" value={booking.reference} />
            <InfoBlock label="Overnight" value={booking.overnight ? "Yes" : "No"} />
            <InfoBlock label="Catering" value={booking.cateringRequired ? "Required" : "Not required"} />
            <InfoBlock label="Spaces" value={booking.spaces.join(", ")} />
            <InfoBlock label="Conflicts" value={booking.conflicts?.join(", ") ?? "None"} />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="triage" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Conflict review
          </h3>
          <ConflictBanner issues={booking.conflicts ?? []} />
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-olive-100 bg-white p-4">
            <p className="text-sm font-semibold text-olive-900">Requested spaces</p>
            <ul className="mt-3 space-y-2 text-sm text-olive-800">
              {booking.spaces.map((space) => (
                <li key={space} className="flex items-center justify-between">
                  <span>{space}</span>
                  <span className="text-xs text-olive-600">Hold confirmed</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-olive-100 bg-white p-4">
            <p className="text-sm font-semibold text-olive-900">Capacity & warnings</p>
            <ul className="mt-3 space-y-2 text-sm text-olive-800">
              <li>
                Headcount {booking.headcount} vs beds 80 · <span className="font-semibold text-emerald-700">OK</span>
              </li>
              <li>Conflict detected on Dining Hall 13 Nov 12:00</li>
            </ul>
          </div>
        </section>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">Mark as In Triage</Button>
          <Button>Approve booking</Button>
          <Button variant="ghost">Record deposit</Button>
        </div>
      </TabsContent>

      <TabsContent value="spaces" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Spaces timeline
          </h3>
          <div className="rounded-xl border border-olive-100 bg-white p-4 text-sm text-olive-800">
            Timeline visual placeholder showing holds per day.
          </div>
        </section>
      </TabsContent>

      <TabsContent value="accommodation" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Room inventory
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {MOCK_ROOMS.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="catering" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Meal plan
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {mealJobs.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Audit timeline
          </h3>
          <AuditTimeline
            events={[
              {
                id: "1",
                actor: "Amelia (Admin)",
                timestamp: new Date().toISOString(),
                description: "Updated headcount from 45 to 48",
              },
              {
                id: "2",
                actor: "Finance",
                timestamp: new Date().toISOString(),
                description: "Marked deposit received",
              },
            ]}
          />
        </section>
      </TabsContent>

      <TabsContent value="docs" className="space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-olive-600">
            Documents
          </h3>
          <div className="rounded-xl border border-dashed border-olive-200 bg-white/70 p-6 text-sm text-olive-600">
            Upload contracts, rooming exports and run sheets here.
          </div>
        </section>
      </TabsContent>
    </Tabs>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-olive-100 bg-white p-4 text-sm">
      <p className="text-xs uppercase tracking-wide text-olive-600">{label}</p>
      <p className="font-medium text-olive-900">{value}</p>
    </div>
  );
}
