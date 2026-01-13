"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomStatusCard } from "./room-status-card";
import type { RoomWithStatus } from "@/lib/queries/rooms.server";

// Room layout configuration matching physical layout at Holy Cross Centre
const UPPER_FLOOR_LAYOUT = {
  leftColumn: [
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23",
  ],
  rightColumn: ["9", "8", "7", "6", "5", "4", "3", "2", "1"],
};

const GROUND_FLOOR_LAYOUT = {
  leftColumn: [
    "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "3",
  ],
  rightColumn: [
    "33", "32", "31", "30", "29", "28", "27", "26", "25", "Chapter", "2", "1",
  ],
};

interface RoomStatusGridProps {
  rooms: RoomWithStatus[];
  selectedDate: string;
  onMarkCleaned: (roomId: string, date: string, bookingId?: string) => Promise<void>;
  onMarkSetupComplete: (roomId: string, date: string, bookingId?: string) => Promise<void>;
}

export function RoomStatusGrid({
  rooms,
  selectedDate,
  onMarkCleaned,
  onMarkSetupComplete,
}: RoomStatusGridProps) {
  const getOrderedRooms = (floor: "ground" | "upper") => {
    const layout = floor === "ground" ? GROUND_FLOOR_LAYOUT : UPPER_FLOOR_LAYOUT;
    const floorRooms = rooms.filter((room) =>
      floor === "ground"
        ? room.level === "Ground Floor"
        : room.level === "Upper Floor"
    );

    const roomByNumber = new Map(
      floorRooms.map((room) => [room.room_number || room.name, room])
    );

    const ordered = {
      leftColumn: layout.leftColumn
        .map((num) => roomByNumber.get(num))
        .filter((room): room is RoomWithStatus => room !== undefined),
      rightColumn: layout.rightColumn
        .map((num) => roomByNumber.get(num))
        .filter((room): room is RoomWithStatus => room !== undefined),
    };

    // Any rooms not in the layout go to leftColumn as overflow
    const orderedIds = new Set(
      [...ordered.leftColumn, ...ordered.rightColumn].map((room) => room.id)
    );
    const overflowRooms = floorRooms.filter((room) => !orderedIds.has(room.id));
    ordered.leftColumn.push(...overflowRooms);

    return ordered;
  };

  const upperFloorRooms = getOrderedRooms("upper");
  const groundFloorRooms = getOrderedRooms("ground");

  const renderFloor = (
    leftColumn: RoomWithStatus[],
    rightColumn: RoomWithStatus[]
  ) => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-500">Left Wing</h3>
        <div className="grid gap-3">
          {leftColumn.map((room) => (
            <RoomStatusCard
              key={room.id}
              room={room}
              selectedDate={selectedDate}
              onMarkCleaned={onMarkCleaned}
              onMarkSetupComplete={onMarkSetupComplete}
            />
          ))}
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-500">Right Wing</h3>
        <div className="grid gap-3">
          {rightColumn.map((room) => (
            <RoomStatusCard
              key={room.id}
              room={room}
              selectedDate={selectedDate}
              onMarkCleaned={onMarkCleaned}
              onMarkSetupComplete={onMarkSetupComplete}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="upper" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="upper">Upper Floor (Foley Wing)</TabsTrigger>
        <TabsTrigger value="ground">Ground Floor (Preston Wing)</TabsTrigger>
      </TabsList>

      <TabsContent value="upper" className="mt-6">
        {renderFloor(upperFloorRooms.leftColumn, upperFloorRooms.rightColumn)}
      </TabsContent>

      <TabsContent value="ground" className="mt-6">
        {renderFloor(groundFloorRooms.leftColumn, groundFloorRooms.rightColumn)}
      </TabsContent>
    </Tabs>
  );
}
