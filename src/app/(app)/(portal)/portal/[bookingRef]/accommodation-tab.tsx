"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RoomingGroupBuilder } from "./rooming-group-builder";
import type { Tables } from "@/lib/database.types";

interface CustomerAccommodationTabProps {
  bookingId: string;
  roomingGroups: Tables<"rooming_groups">[];
  unassignedGuests: { id: string; name: string }[];
  allGuests: { id: string; name: string }[];
  roomTypes: { id: string; name: string }[];
}

export function CustomerAccommodationTab({
  bookingId,
  roomingGroups,
  unassignedGuests,
  allGuests,
  roomTypes,
}: CustomerAccommodationTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Room Allocation</CardTitle>
          <CardDescription>
            Assign guests to rooms. Drag and drop guests from the list to the
            rooms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomingGroupBuilder
            bookingId={bookingId}
            initialGroups={roomingGroups.map((g) => ({
              ...g,
              members: g.members ?? [],
              status: g.status ?? "draft",
            }))}
            unassignedGuests={unassignedGuests}
            allGuests={allGuests}
            roomTypes={roomTypes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
