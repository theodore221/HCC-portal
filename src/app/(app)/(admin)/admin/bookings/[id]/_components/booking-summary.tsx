import { forwardRef } from "react";
import { format } from "date-fns";
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
                  <th className="py-2 font-medium w-1/3">Date</th>
                  <th className="py-2 font-medium w-1/3">Time</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length > 0
                  ? reservations.map((res) => (
                      <tr
                        key={res.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-2 font-medium">
                          {getSpaceName(res.space_id)}
                        </td>
                        <td className="py-2">{formatDate(res.service_date)}</td>
                        <td className="py-2">
                          {formatTime(res.start_time)} -{" "}
                          {formatTime(res.end_time)}
                        </td>
                      </tr>
                    ))
                  : booking.spaces.map((spaceId, index) => (
                      <tr
                        key={`space-${index}`}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-2 font-medium">
                          {getSpaceName(spaceId)}
                        </td>
                        <td className="py-2">
                          {formatDate(booking.arrival_date)} -{" "}
                          {formatDate(booking.departure_date)}
                        </td>
                        <td className="py-2">
                          {formatTime(booking.arrival_time)} -{" "}
                          {formatTime(booking.departure_time)}
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
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-200">
                        <th className="py-2 font-medium w-1/5">Date</th>
                        <th className="py-2 font-medium w-1/5">Meal</th>
                        <th className="py-2 font-medium w-1/5">Time</th>
                        <th className="py-2 font-medium text-center w-1/12">
                          Count
                        </th>
                        <th className="py-2 font-medium w-1/3">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="py-2">{formatDate(job.date)}</td>
                          <td className="py-2 font-medium">{job.meal}</td>
                          <td className="py-2">
                            {format(new Date(job.startISOString), "HH:mm")} -{" "}
                            {format(new Date(job.endISOString), "HH:mm")}
                          </td>
                          <td className="py-2 text-center">
                            {job.countsTotal || booking.headcount}
                          </td>
                          <td className="py-2 text-xs">
                            {job.menu && job.menu.length > 0 ? (
                              <span className="text-text-light">
                                {job.menu.join(", ")}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
