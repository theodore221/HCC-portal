import type { RoomWithAssignments } from "@/lib/queries/bookings";

export function RoomCard({ room }: { room: RoomWithAssignments }) {
  const filledBeds = room.assignments.length;
  const capacity = room.base_beds + (room.extra_bed_allowed ? 1 : 0);
  const hasExtra = room.assignments.some((assignment) => assignment.is_extra_bed);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{room.name}</p>
          <p className="text-xs text-gray-600">{room.building ?? "Building TBC"}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {filledBeds}/{capacity} beds
        </span>
      </div>
      {room.assignments.length ? (
        <ul className="space-y-2 text-sm text-gray-700">
          {room.assignments.map((assignment) => (
            <li
              key={`${room.id}-${assignment.bed_number}-${assignment.occupant_name}`}
              className="flex items-center justify-between"
            >
              <span>{assignment.occupant_name}</span>
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Bed {assignment.bed_number}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">No occupants assigned.</p>
      )}
      {room.extra_bed_allowed ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600">
          Extra bed {room.extra_bed_fee ? `(+$${room.extra_bed_fee})` : "available"}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No extra bed available</p>
      )}
      {hasExtra ? (
        <div className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
          Extra bed fee will apply for this room.
        </div>
      ) : null}
    </div>
  );
}
