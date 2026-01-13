"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateNavigation } from "@/components/rooms/date-navigation";
import { RoomStatusGrid } from "@/components/rooms/room-status-grid";
import { RoomStatusLegend } from "@/components/rooms/room-status-legend";
import { useToast } from "@/components/ui/use-toast";
import { markRoomCleaned, markRoomSetupComplete } from "@/app/(app)/(staff)/staff/rooms/actions";
import type { RoomWithStatus } from "@/lib/queries/rooms.server";

interface RoomsClientProps {
  rooms: RoomWithStatus[];
  selectedDate: string;
}

export default function RoomsClient({ rooms, selectedDate }: RoomsClientProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleMarkCleaned = async (
    roomId: string,
    date: string,
    bookingId?: string
  ) => {
    startTransition(async () => {
      const result = await markRoomCleaned(roomId, date, bookingId);
      if (result.success) {
        toast({
          title: "Room marked as cleaned",
          description: "The room status has been updated.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark room as cleaned",
          variant: "destructive",
        });
      }
    });
  };

  const handleMarkSetupComplete = async (
    roomId: string,
    date: string,
    bookingId?: string
  ) => {
    startTransition(async () => {
      const result = await markRoomSetupComplete(roomId, date, bookingId);
      if (result.success) {
        toast({
          title: "Room setup complete",
          description: "The room has been marked as ready for guests.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark setup as complete",
          variant: "destructive",
        });
      }
    });
  };

  // Count rooms by status
  const statusCounts = rooms.reduce(
    (acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Room Status</CardTitle>
              <p className="mt-1 text-sm text-neutral-500">
                Manage room setup and cleaning tasks
              </p>
            </div>
            <DateNavigation selectedDate={selectedDate} basePath="/admin/rooms" />
          </div>
        </CardHeader>
      </Card>

      {/* Status Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-neutral-500">Ready</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-neutral-700">
              {statusCounts.ready || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-neutral-500">Needs Setup</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">
              {statusCounts.needs_setup || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-neutral-500">Setup Complete</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {statusCounts.setup_complete || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-neutral-500">In Use</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-700">
              {statusCounts.in_use || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-neutral-500">Cleaning Required</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">
              {statusCounts.cleaning_required || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <RoomStatusLegend />

      {/* Room Grid */}
      <Card>
        <CardContent className="pt-6">
          <RoomStatusGrid
            rooms={rooms}
            selectedDate={selectedDate}
            onMarkCleaned={handleMarkCleaned}
            onMarkSetupComplete={handleMarkSetupComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
