"use client";

import { RoomWithAssignments } from "@/lib/queries/bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable } from "@/components/ui/droppable";
import { Draggable } from "@/components/ui/draggable";
import { User } from "lucide-react";

interface RoomGridProps {
  rooms: RoomWithAssignments[];
  date: string;
  assignments: any[];
}

export function RoomGrid({ rooms, date, assignments }: RoomGridProps) {
  // Group rooms by building/floor if needed. For now just list them.

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          date={date}
          assignments={assignments}
        />
      ))}
    </div>
  );
}

function RoomCard({
  room,
  date,
  assignments,
}: {
  room: RoomWithAssignments;
  date: string;
  assignments: any[];
}) {
  // Filter assignments for this room and date
  // For MVP we assume assignments are passed in correctly or we filter them here
  // But we don't have the assignment data structure fully wired in props yet

  return (
    <Droppable id={room.id} className="h-full">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <CardTitle className="text-sm font-medium">{room.name}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {room.room_types?.name}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 min-h-[60px]">
            {/* Render occupants */}
            <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
              Drop guests here
            </div>
          </div>
        </CardContent>
      </Card>
    </Droppable>
  );
}
