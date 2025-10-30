import type {
  AdminBooking,
  DietaryProfileRow,
  MealJobWithRelations,
  RoomAssignmentRow,
  RoomRow,
} from "./queries/bookings";
import type { BookingSummary, DietaryProfileSummary, RoomSummary } from "./models";

export function toBookingSummary(booking: AdminBooking): BookingSummary {
  const spaces = Array.from(
    new Set((booking.space_reservations ?? []).map((reservation) => reservation.space_id))
  ).sort();

  const groupName = booking.customer_name ?? booking.customer_email ?? "Booking";

  return {
    id: booking.id,
    reference: booking.reference,
    groupName,
    arrival: booking.arrival_date,
    departure: booking.departure_date,
    headcount: booking.headcount,
    overnight: booking.is_overnight,
    status: booking.status,
    spaces,
    cateringRequired: booking.catering_required,
    conflicts: [],
  };
}

export function toDietaryProfiles(profiles: DietaryProfileRow[]): DietaryProfileSummary[] {
  return profiles.map((profile) => ({
    id: profile.id,
    personName: profile.person_name,
    dietType: profile.diet_type,
    allergy: profile.allergy,
    severity: profile.severity,
  }));
}

export function toRoomSummaries(
  assignments: (RoomAssignmentRow & { rooms: RoomRow | null })[]
): RoomSummary[] {
  const rooms = new Map<string, RoomSummary>();

  for (const assignment of assignments) {
    const existing = rooms.get(assignment.room_id);
    if (existing) {
      existing.occupants.push(assignment.occupant_name);
      continue;
    }

    const room = assignment.rooms;
    rooms.set(assignment.room_id, {
      id: assignment.room_id,
      name: room?.name ?? "Room",
      building: room?.building ?? null,
      baseBeds: room?.base_beds ?? 0,
      extraBedAllowed: room?.extra_bed_allowed ?? false,
      extraBedFee: room?.extra_bed_fee ?? null,
      occupants: [assignment.occupant_name],
    });
  }

  return Array.from(rooms.values()).map((room) => ({
    ...room,
    occupants: [...room.occupants],
  }));
}

export function toBookingSummaries(bookings: AdminBooking[]): BookingSummary[] {
  return bookings.map(toBookingSummary);
}

export function groupJobsByBooking(
  bookings: BookingSummary[],
  jobs: MealJobWithRelations[]
): Record<string, MealJobWithRelations[]> {
  const map: Record<string, MealJobWithRelations[]> = {};
  for (const job of jobs) {
    const key = job.booking_id;
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(job);
  }
  return map;
}
