import { forwardRef } from "react";
import { format } from "date-fns";

function formatDateRanges(isoDates: string[]): string {
  if (isoDates.length === 0) return '';
  const sorted = [...isoDates].sort();
  const dates = sorted.map((d) => new Date(d + 'T00:00:00'));
  const runs: Date[][] = [];
  let current: Date[] = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    const diffDays = Math.round((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) { current.push(dates[i]); }
    else { runs.push(current); current = [dates[i]]; }
  }
  runs.push(current);
  return runs.map((run) => {
    const first = run[0];
    const last = run[run.length - 1];
    const firstDay = first.getDate();
    const lastDay = last.getDate();
    const firstMonth = first.toLocaleDateString('en-AU', { month: 'short' });
    const lastMonth = last.toLocaleDateString('en-AU', { month: 'short' });
    if (run.length === 1) return `${firstDay} ${firstMonth}`;
    if (firstMonth === lastMonth) return `${firstDay}–${lastDay} ${firstMonth}`;
    return `${firstDay} ${firstMonth}–${lastDay} ${lastMonth}`;
  }).join(', ');
}
import {
  BookingWithMeta,
  RoomWithAssignments,
  SpaceReservation,
  Space,
} from "@/lib/queries/bookings";
import { EnrichedMealJob } from "@/lib/catering";
import { Tables } from "@/lib/database.types";

interface BookingSummaryProps {
  booking: BookingWithMeta;
  rooms: RoomWithAssignments[];
  allRooms: (Tables<"rooms"> & {
    room_types: Tables<"room_types"> | null;
  })[];
  mealJobs: EnrichedMealJob[];
  spaces: Space[];
  reservations: SpaceReservation[];
}

export const BookingSummary = forwardRef<HTMLDivElement, BookingSummaryProps>(
  ({ booking, rooms, mealJobs, spaces, reservations }, ref) => {
    // Helper to format dates
    const formatDate = (date: string | null) => {
      if (!date) return "—";
      return format(new Date(date), "dd MMM yyyy");
    };

    // Helper to format time (assuming HH:mm:ss or similar)
    const formatTime = (time: string | null) => {
      if (!time) return "—";
      return time.substring(0, 5);
    };

    const getSpaceName = (spaceId: string) => {
      const space = spaces.find((s) => s.id === spaceId);
      return space ? space.name : "Unknown Space";
    };

    return (
      <div
        ref={ref}
        className="p-8 bg-white text-black max-w-[210mm] mx-auto min-h-[297mm] text-sm leading-relaxed font-sans"
        id="booking-summary-print"
      >
        {/* Header */}
        <header className="border-b-2 border-primary/20 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-1">
                Booking Summary
              </h1>
              <p className="text-gray-500">
                Reference:{" "}
                <span className="font-mono font-medium text-black">
                  {booking.reference || "N/A"}
                </span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold mb-1">
                {booking.customer_name || booking.contact_name || "Guest"}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(booking.arrival_date)} —{" "}
                {formatDate(booking.departure_date)}
              </div>
            </div>
          </div>
        </header>

        {/* Overview */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-primary border-b border-gray-200 pb-2 mb-4 uppercase tracking-wide">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium">{booking.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Booking Type</span>
              <span className="font-medium">{booking.booking_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Headcount</span>
              <span className="font-medium">{booking.headcount} guests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stay Type</span>
              <span className="font-medium">
                {booking.is_overnight ? "Overnight" : "Day Visit"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Arrival Time</span>
              <span className="font-medium">
                {formatTime(booking.arrival_time)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Departure Time</span>
              <span className="font-medium">
                {formatTime(booking.departure_time)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Contact Name</span>
              <span className="font-medium">{booking.contact_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium">
                {booking.contact_phone || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">
                {booking.customer_email || "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Accommodation */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-primary border-b border-gray-200 pb-2 mb-4 uppercase tracking-wide">
            Accommodation
          </h2>
          {!booking.is_overnight ? (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 italic border border-dashed border-gray-200">
              Accommodation not required
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-xs uppercase text-gray-500">
                  Allocated Rooms
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {rooms.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {rooms.map((room) => (
                        <li key={room.id}>
                          <span className="font-medium">
                            Room {room.room_number}
                          </span>
                          {room.room_types?.name &&
                            ` (${room.room_types.name})`}
                          {room.assignments.length > 0 && (
                            <span className="text-gray-500">
                              {" "}
                              —{" "}
                              {room.assignments[0].occupant_name || "Assigned"}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No rooms allocated yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Spaces */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-primary border-b border-gray-200 pb-2 mb-4 uppercase tracking-wide">
            Spaces
          </h2>
          {reservations.length === 0 && booking.spaces.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 italic border border-dashed border-gray-200">
              No spaces reserved
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-200">
                  <th className="py-2 font-medium w-1/3">Space</th>
                  <th className="py-2 font-medium w-1/3">Dates</th>
                  <th className="py-2 font-medium w-1/3">Time</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length > 0
                  ? (() => {
                      // Group by space — one row per space with compressed date ranges
                      const bySpace = new Map<string, { dates: string[]; start_time: string | null; end_time: string | null }>();
                      reservations.forEach((res) => {
                        const existing = bySpace.get(res.space_id);
                        if (existing) {
                          existing.dates.push(res.service_date);
                        } else {
                          bySpace.set(res.space_id, { dates: [res.service_date], start_time: res.start_time, end_time: res.end_time });
                        }
                      });
                      return [...bySpace.entries()].map(([spaceId, { dates, start_time, end_time }]) => (
                        <tr key={spaceId} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 font-medium">{getSpaceName(spaceId)}</td>
                          <td className="py-2">{formatDateRanges(dates)}</td>
                          <td className="py-2">
                            {start_time && end_time
                              ? `${formatTime(start_time)} – ${formatTime(end_time)}`
                              : <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      ));
                    })()
                  : booking.spaces.map((spaceId, index) => (
                      <tr key={`space-${index}`} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 font-medium">{getSpaceName(spaceId)}</td>
                        <td className="py-2">
                          {formatDate(booking.arrival_date)} – {formatDate(booking.departure_date)}
                        </td>
                        <td className="py-2">
                          {formatTime(booking.arrival_time)} – {formatTime(booking.departure_time)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Catering */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-primary border-b border-gray-200 pb-2 mb-4 uppercase tracking-wide">
            Catering
          </h2>
          {!booking.catering_required ? (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 italic border border-dashed border-gray-200">
              Catering not required
            </div>
          ) : (
            <div>
              {mealJobs.length === 0 ? (
                <p className="text-gray-500 italic">
                  Catering required but no meals added yet.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Group by meal type for a compact summary */}
                  {(() => {
                    const mealTypes = [...new Set(mealJobs.map((j) => j.meal))];
                    return (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 border-b border-gray-200">
                            <th className="py-2 font-medium w-1/5">Meal</th>
                            <th className="py-2 font-medium w-1/6">Time</th>
                            <th className="py-2 font-medium w-1/12 text-center">Count</th>
                            <th className="py-2 font-medium">Dates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mealTypes.map((meal) => {
                            const jobs = mealJobs.filter((j) => j.meal === meal);
                            const first = jobs[0];
                            const totalCount = jobs.reduce((s, j) => s + (j.countsTotal || booking.headcount), 0);
                            const avgCount = Math.round(totalCount / jobs.length);
                            const dates = formatDateRanges(jobs.map((j) => j.date));
                            return (
                              <tr key={meal} className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-medium">{meal}</td>
                                <td className="py-2 text-gray-600">
                                  {format(new Date(first.startISOString), "HH:mm")}–{format(new Date(first.endISOString), "HH:mm")}
                                </td>
                                <td className="py-2 text-center">{avgCount}</td>
                                <td className="py-2 text-xs text-gray-600">{dates}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 flex justify-between text-xs text-gray-400">
          <div>Generated on {format(new Date(), "dd MMM yyyy 'at' HH:mm")}</div>
          <div>HCC Portal</div>
        </footer>
      </div>
    );
  },
);

BookingSummary.displayName = "BookingSummary";
