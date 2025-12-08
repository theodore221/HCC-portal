"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { RoomGrid } from "./room-grid";
import { GuestList } from "./guest-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RoomWithAssignments, BookingWithMeta } from "@/lib/queries/bookings";
import { Tables } from "@/lib/database.types";

interface AccommodationTabProps {
  booking: BookingWithMeta;
  rooms: RoomWithAssignments[];
  roomingGroups: Tables<"rooming_groups">[];
}

export function AccommodationTab({
  booking,
  rooms,
  roomingGroups,
}: AccommodationTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    booking.arrival_date
  );

  // Helper to generate dates between arrival and departure
  const getDates = () => {
    const dates = [];
    let currentDate = new Date(booking.arrival_date);
    const endDate = new Date(booking.departure_date);
    while (currentDate < endDate) {
      dates.push(new Date(currentDate).toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const dates = getDates();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Implement assignment logic here
    // 1. Identify guest (active.id)
    // 2. Identify room (over.id)
    // 3. Call server action to assign
    console.log(`Assigning ${active.id} to ${over.id} on ${selectedDate}`);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          {/* Date Selector */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base">
                Allocation for {selectedDate}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const idx = dates.indexOf(selectedDate);
                    if (idx > 0) setSelectedDate(dates[idx - 1]);
                  }}
                  disabled={dates.indexOf(selectedDate) === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const idx = dates.indexOf(selectedDate);
                    if (idx < dates.length - 1) setSelectedDate(dates[idx + 1]);
                  }}
                  disabled={dates.indexOf(selectedDate) === dates.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Room Grid */}
          <RoomGrid
            rooms={rooms}
            date={selectedDate}
            assignments={[]} // Pass assignments for this date
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <GuestList
            booking={booking}
            roomingGroups={roomingGroups}
            assignments={[]} // Pass all assignments to calculate unassigned
          />
        </div>
      </div>
    </DndContext>
  );
}
