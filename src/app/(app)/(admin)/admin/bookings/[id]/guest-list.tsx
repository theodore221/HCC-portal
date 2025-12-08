"use client";

import { BookingWithMeta } from "@/lib/queries/bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Draggable } from "@/components/ui/draggable";
import { GripVertical } from "lucide-react";

interface GuestListProps {
  booking: BookingWithMeta;
  roomingGroups: any[];
  assignments: any[];
}

export function GuestList({
  booking,
  roomingGroups,
  assignments,
}: GuestListProps) {
  // Calculate unassigned guests
  // For MVP, just show a list of dummy guests based on headcount
  const totalGuests = booking.headcount;
  const guests = Array.from({ length: totalGuests }, (_, i) => ({
    id: `guest-${i + 1}`,
    name: `Guest ${i + 1}`,
  }));

  return (
    <Card className="h-full max-h-[calc(100vh-200px)] overflow-y-auto sticky top-4">
      <CardHeader>
        <CardTitle className="text-sm">Unassigned Guests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {guests.map((guest) => (
          <Draggable key={guest.id} id={guest.id}>
            <div className="flex items-center gap-2 p-2 bg-white border rounded shadow-sm text-sm cursor-grab hover:border-primary">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {guest.name}
            </div>
          </Draggable>
        ))}
      </CardContent>
    </Card>
  );
}
