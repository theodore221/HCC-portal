import type { RoomSummary } from "@/lib/models";

export function RoomCard({ room }: { room: RoomSummary }) {
  const filledBeds = room.occupants.length;
  const capacity = room.baseBeds + (room.extraBedAllowed ? 1 : 0);
  const hasExtra = filledBeds > room.baseBeds;
  return (
    <div className="space-y-3 rounded-xl border border-olive-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-olive-900">{room.name}</p>
          <p className="text-xs text-olive-700">{room.building}</p>
        </div>
        <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-medium text-olive-800">
          {filledBeds}/{capacity} beds
        </span>
      </div>
      <ul className="space-y-2 text-sm text-olive-800">
        {room.occupants.map((person, index) => (
          <li key={person} className="flex items-center justify-between">
            <span>{person}</span>
            <span className="text-xs uppercase tracking-wide text-olive-600">
              Bed {index + 1}
            </span>
          </li>
        ))}
      </ul>
      {room.extraBedAllowed ? (
        <div className="rounded-lg border border-dashed border-olive-200 px-3 py-2 text-xs text-olive-700">
          Extra bed {room.extraBedFee ? `(+$${room.extraBedFee})` : "available"}
        </div>
      ) : (
        <p className="text-xs text-olive-600">No extra bed available</p>
      )}
      {hasExtra ? (
        <div className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
          Extra bed fee will apply for this room.
        </div>
      ) : null}
    </div>
  );
}
