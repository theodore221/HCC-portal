import { notFound } from "next/navigation";
import { Stepper } from "@/components/ui/stepper";
import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import { RoomCard } from "@/components/ui/room-card";
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS, MOCK_ROOMS, MOCK_DIETARIES } from "@/lib/mock-data";
import { StatusChip } from "@/components/ui/status-chip";

const steps = ["Deposit", "Catering", "Rooming", "Summary"];

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
        <CardHeader
          title={`Booking reference ${booking.reference}`}
          subtitle={`${booking.groupName} · ${booking.headcount} guests`}
          action={<StatusChip status={booking.status} />}
        />
        <CardSection title="1 · Deposit instructions">
          <p className="text-sm leading-relaxed text-olive-800">
            A $1,500 deposit is required to secure your dates. Transfer to the Holy
            Cross Centre account and include your booking reference. Once finance
            confirms payment your catering and rooming steps unlock automatically.
          </p>
          <div className="mt-4 grid gap-3 rounded-xl border border-olive-100 bg-white p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-olive-600">Bank</p>
              <p className="text-sm font-medium text-olive-900">Holy Cross Centre</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-olive-600">BSB</p>
              <p className="text-sm font-medium text-olive-900">033-123</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-olive-600">Account</p>
              <p className="text-sm font-medium text-olive-900">124 567 890</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-olive-600">Reference</p>
              <p className="text-sm font-medium text-olive-900">{booking.reference}</p>
            </div>
          </div>
        </CardSection>
        <CardSection title="2 · Catering planner">
          <p className="text-sm text-olive-800">
            Select meals for each day. Totals automatically validate against your
            headcount. Morning and Afternoon Tea include a percolated coffee option.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {cateringJobs.map((job) => (
              <MealSlotCard key={job.id} job={job} />
            ))}
          </div>
          <Button className="mt-4 w-full md:w-auto" variant="outline">
            Add dietary note
          </Button>
        </CardSection>
        <CardSection title="Dietary register">
          <table className="w-full text-sm text-olive-800">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-olive-600">
                <th className="pb-2">Guest</th>
                <th className="pb-2">Diet type</th>
                <th className="pb-2">Allergy</th>
                <th className="pb-2">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive-100">
              {MOCK_DIETARIES.map((item) => (
                <tr key={item.name}>
                  <td className="py-2 font-medium">{item.name}</td>
                  <td className="py-2">{item.dietType}</td>
                  <td className="py-2">{item.allergy || "—"}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.severity === "Fatal"
                          ? "bg-red-100 text-red-700"
                          : item.severity === "High"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-olive-100 text-olive-800"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardSection>
        <CardSection title="3 · Rooming planner">
          <div className="grid gap-4 md:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-olive-200 bg-white/60 p-4 text-sm text-olive-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Upload a CSV or XLSX template to import your guest list in bulk.
            </div>
            <Button variant="ghost">Download template</Button>
          </div>
        </CardSection>
        <CardSection title="4 · Summary & submit">
          <p className="text-sm text-olive-800">
            Review your selections. Changes remain available until 7 days prior to
            arrival. After that window contact the HCC team for adjustments.
          </p>
          <Button className="mt-4 w-full md:w-auto">Submit updates</Button>
        </CardSection>
      </Card>
    </div>
  );
}
