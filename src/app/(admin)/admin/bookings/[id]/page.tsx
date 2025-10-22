import { notFound } from "next/navigation";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { ConflictBanner } from "@/components/ui/conflict-banner";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { AuditTimeline } from "@/components/ui/audit-timeline";
import { RoomCard } from "@/components/ui/room-card";
import { Button } from "@/components/ui/button";
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS, MOCK_ROOMS } from "@/lib/mock-data";
import { formatDateRange } from "@/lib/utils";

const tabs = ["Overview", "Triage", "Spaces", "Accommodation", "Catering", "Timeline", "Docs"];

export default function BookingDetail({ params }: { params: { id: string } }) {
  const booking = MOCK_BOOKINGS.find((b) => b.id === params.id);
  if (!booking) return notFound();
  const mealJobs = MOCK_MEAL_JOBS.filter((job) => job.bookingId === booking.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={booking.groupName}
          subtitle={`${formatDateRange(booking.arrival, booking.departure)} · ${booking.headcount} guests`}
          action={<StatusChip status={booking.status} />}
        />
        <nav className="mt-6 flex flex-wrap gap-2 text-sm font-medium text-olive-700">
          {tabs.map((tab) => (
            <span key={tab} className="rounded-full bg-olive-50 px-4 py-2">
              {tab}
            </span>
          ))}
        </nav>
      </Card>
      <Card>
        <CardSection title="Status timeline">
          <ol className="grid gap-4 sm:grid-cols-3">
            {["Pending", "Approved", "Deposit Received"].map((stage) => (
              <li key={stage} className="rounded-xl border border-olive-100 bg-white/80 p-4 text-sm">
                <p className="font-semibold text-olive-900">{stage}</p>
                <p className="text-xs text-olive-700">Date placeholder</p>
              </li>
            ))}
          </ol>
        </CardSection>
        <CardSection title="Summary">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Reference" value={booking.reference} />
            <InfoBlock label="Overnight" value={booking.overnight ? "Yes" : "No"} />
            <InfoBlock label="Catering" value={booking.cateringRequired ? "Required" : "Not required"} />
            <InfoBlock label="Spaces" value={booking.spaces.join(", ")} />
            <InfoBlock label="Conflicts" value={booking.conflicts?.join(", ") ?? "None"} />
          </div>
        </CardSection>
        <CardSection title="Triage">
          <ConflictBanner issues={booking.conflicts ?? []} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline">Mark as In Triage</Button>
            <Button>Approve booking</Button>
            <Button variant="ghost">Record deposit</Button>
          </div>
        </CardSection>
        <CardSection title="Accommodation">
          <div className="grid gap-4 md:grid-cols-3">
            {MOCK_ROOMS.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </CardSection>
        <CardSection title="Catering overview">
          <div className="grid gap-4 md:grid-cols-2">
            {mealJobs.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
        </CardSection>
        <CardSection title="Audit timeline">
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
        </CardSection>
      </Card>
    </div>
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
