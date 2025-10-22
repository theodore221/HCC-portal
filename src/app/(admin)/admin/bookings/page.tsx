import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConflictBanner } from "@/components/ui/conflict-banner";
import { StatusChip } from "@/components/ui/status-chip";
import { MOCK_BOOKINGS } from "@/lib/mock-data";

export default function AdminBookings() {
  const counts = {
    Pending: MOCK_BOOKINGS.filter((b) => b.status === "Pending").length,
    InTriage: MOCK_BOOKINGS.filter((b) => b.status === "InTriage").length,
    Approved: MOCK_BOOKINGS.filter((b) => b.status === "Approved").length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Bookings" subtitle="Filter by status, dates, catering or spaces" />
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-olive-700">
          <span className="rounded-full bg-white px-3 py-1 shadow-soft">Pending {counts.Pending}</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-soft">In triage {counts.InTriage}</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-soft">Approved {counts.Approved}</span>
          <Button variant="ghost" className="ml-auto">
            New booking
          </Button>
        </div>
      </Card>
      <div className="overflow-hidden rounded-2xl border border-olive-100 bg-white shadow-soft">
        <table className="w-full text-sm text-olive-800">
          <thead className="bg-olive-50 text-xs uppercase tracking-wide text-olive-600">
            <tr className="text-left">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Headcount</th>
              <th className="px-4 py-3">Spaces</th>
              <th className="px-4 py-3">Catering</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive-100">
            {MOCK_BOOKINGS.map((booking) => (
              <tr key={booking.id} className="hover:bg-olive-50/60">
                <td className="px-4 py-3 font-medium text-olive-900">{booking.reference}</td>
                <td className="px-4 py-3">{booking.groupName}</td>
                <td className="px-4 py-3">
                  {booking.arrival} → {booking.departure}
                </td>
                <td className="px-4 py-3">{booking.headcount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {booking.spaces.map((space) => (
                      <span key={space} className="rounded-full bg-olive-100 px-2 py-1 text-xs">
                        {space}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{booking.cateringRequired ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <StatusChip status={booking.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="h-8 px-3 text-xs">
                      Triage
                    </Button>
                    <Button variant="outline" className="h-8 px-3 text-xs">
                      Approve
                    </Button>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className={buttonStyles("ghost", "h-8 px-3 text-xs")}
                    >
                      Open
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConflictBanner issues={["Corbett Room clash with Retreat 12 Nov", "Dining Hall capacity exceeded on 13 Nov"]} />
    </div>
  );
}
