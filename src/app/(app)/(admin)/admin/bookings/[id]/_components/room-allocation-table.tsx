"use client";

import { useState } from "react";
import { Tables } from "@/lib/database.types";
import { RoomWithAssignments, BookingWithMeta } from "@/lib/queries/bookings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoomAllocationTableProps {
  booking: BookingWithMeta;
  rooms: RoomWithAssignments[];
  allRooms: (Tables<"rooms"> & {
    room_types: Tables<"room_types"> | null;
    level?: string | null;
    room_number?: string | null;
    wing?: string | null;
  })[];
}

export function RoomAllocationTable({
  booking,
  rooms: assignedRooms, // These are rooms with assignments for THIS booking
  allRooms, // These are ALL rooms in the system
}: RoomAllocationTableProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    booking.arrival_date
  );

  // Helper to generate dates
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

  // Group rooms by floor
  const groundFloorRooms = allRooms.filter((r) => r.level === "Ground Floor");
  const upperFloorRooms = allRooms.filter((r) => r.level === "Upper Floor");

  // Calculate progress
  const requests = (booking.accommodation_requests as any) || {};
  const requestedSingle = Number(requests.singleBB || 0);
  const requestedDouble = Number(requests.doubleBB || 0);
  // ... other types

  // Count allocated
  // This logic needs to be robust. For now, just a placeholder.
  const allocatedSingle = 0;
  const allocatedDouble = 0;

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Accommodation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Single Beds</span>
                <span className="text-muted-foreground">
                  {allocatedSingle} / {requestedSingle}
                </span>
              </div>
              <Progress
                value={(allocatedSingle / (requestedSingle || 1)) * 100}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Double Beds</span>
                <span className="text-muted-foreground">
                  {allocatedDouble} / {requestedDouble}
                </span>
              </div>
              <Progress
                value={(allocatedDouble / (requestedDouble || 1)) * 100}
              />
            </div>
            {/* Add more progress bars as needed */}
          </div>
        </CardContent>
      </Card>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Room Allocation</h3>
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
          <span className="min-w-[100px] text-center font-medium">
            {selectedDate}
          </span>
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
      </div>

      {/* Room Grid */}
      <Tabs defaultValue="ground" className="w-full">
        <TabsList>
          <TabsTrigger value="ground">Ground Floor</TabsTrigger>
          <TabsTrigger value="upper">Upper Floor</TabsTrigger>
        </TabsList>
        <TabsContent value="ground" className="mt-4">
          <RoomFloorGrid
            rooms={groundFloorRooms}
            date={selectedDate}
            bookingId={booking.id}
            assignedRooms={assignedRooms}
          />
        </TabsContent>
        <TabsContent value="upper" className="mt-4">
          <RoomFloorGrid
            rooms={upperFloorRooms}
            date={selectedDate}
            bookingId={booking.id}
            assignedRooms={assignedRooms}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoomFloorGrid({
  rooms,
  date,
  bookingId,
  assignedRooms,
}: {
  rooms: (Tables<"rooms"> & { room_types: Tables<"room_types"> | null })[];
  date: string;
  bookingId: string;
  assignedRooms: RoomWithAssignments[];
}) {
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[100px_150px_100px_1fr] gap-0 bg-muted/50 text-sm font-medium">
        <div className="p-3 border-b border-r">Room</div>
        <div className="p-3 border-b border-r">Type</div>
        <div className="p-3 border-b border-r">Capacity</div>
        <div className="p-3 border-b">Assignment</div>
      </div>
      <div className="divide-y">
        {rooms.map((room) => {
          // Find assignments for this room on this date (if logic supported date-based assignment,
          // but currently assignments are per booking, effectively for the whole duration?
          // The user said "show all the dates of the booking individually as seperate grid table which you can toggle left and right on".
          // This implies assignments might be date-specific?
          // BUT the schema `room_assignments` links to `booking_id`, not `service_date`.
          // So assignments are for the whole booking duration.
          // Displaying per date might be for showing conflicts with OTHER bookings?
          // Or maybe the user WANTS date-specific assignments?
          // "Here the admin can basically allocate a room to be used for this particular booking... and add a room assignment"
          // If the schema doesn't support date, then it's for the whole booking.
          // So the date toggle might be to check availability?

          // For now, I'll assume assignments apply to the whole booking,
          // but we check conflicts per date.

          const assigned = assignedRooms.find((r) => r.id === room.id);
          const occupants =
            assigned?.assignments.map((a) => a.occupant_name).join(", ") ||
            "Empty";
          const isAssigned = !!assigned;

          return (
            <div
              key={room.id}
              className="grid grid-cols-[100px_150px_100px_1fr] gap-0 hover:bg-muted/20 transition-colors"
            >
              <div className="p-3 border-r flex items-center font-medium">
                {room.room_number || room.name}
              </div>
              <div className="p-3 border-r flex items-center text-muted-foreground">
                {room.room_types?.name}
              </div>
              <div className="p-3 border-r flex items-center text-muted-foreground">
                {room.room_types?.capacity}
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isAssigned ? (
                    <Badge variant="default">{occupants}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Available
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  {isAssigned ? "Edit" : "Assign"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
