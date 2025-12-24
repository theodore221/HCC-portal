"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Bed, BookOpen, ShowerHead, Loader2, UserPen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomWithAssignments, RoomAssignmentWithDetails } from "@/lib/queries/bookings";
import { customerUpdateRoomAllocationDetails } from "./actions";

const UPPER_FLOOR_LAYOUT = {
  leftColumn: [
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
  ],
  rightColumn: ["9", "8", "7", "6", "5", "4", "3", "2", "1"],
};

const GROUND_FLOOR_LAYOUT = {
  leftColumn: [
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
    "43",
    "44",
    "45",
    "3",
  ],
  rightColumn: [
    "33",
    "32",
    "31",
    "30",
    "29",
    "28",
    "27",
    "26",
    "25",
    "Chapter",
    "2",
    "1",
  ],
};

interface RoomAllocationGridProps {
  bookingId: string;
  rooms: RoomWithAssignments[];
  onAllocatedCountsChange?: (counts: {
    doubleBB: number;
    singleBB: number;
    studySuite: number;
    doubleEnsuite: number;
  }) => void;
}

function getAssignmentForRoom(room: RoomWithAssignments): RoomAssignmentWithDetails | null {
  return room.assignments.length > 0 ? room.assignments[0] : null;
}

export function RoomAllocationGrid({
  bookingId,
  rooms,
  onAllocatedCountsChange,
}: RoomAllocationGridProps) {
  const calculateAllocatedCounts = () => {
    let doubleBB = 0;
    let singleBB = 0;
    let studySuite = 0;
    let doubleEnsuite = 0;

    for (const room of rooms) {
      const assignment = getAssignmentForRoom(room);
      const typeName = room.room_types?.name || "";
      const hasExtraBed =
        assignment?.extra_bed_selected && room.extra_bed_allowed;
      const hasEnsuite =
        assignment?.ensuite_selected && room.ensuite_available;
      const hasPrivateStudy =
        assignment?.private_study_selected && room.private_study_available;

      if (
        hasEnsuite &&
        hasPrivateStudy &&
        (typeName.includes("Double") ||
          typeName.includes("Queen") ||
          typeName.includes("King"))
      ) {
        studySuite += 1;
      } else if (hasEnsuite && !hasPrivateStudy) {
        doubleEnsuite += 1;
      } else if (
        typeName.includes("Double") ||
        typeName.includes("Queen") ||
        typeName.includes("King")
      ) {
        doubleBB += 1;
      } else if (typeName === "Single") {
        singleBB += 1;
      } else if (typeName === "Twin Single") {
        singleBB += hasExtraBed ? 3 : 2;
      }
    }

    return { doubleBB, singleBB, studySuite, doubleEnsuite };
  };

  useEffect(() => {
    if (onAllocatedCountsChange) {
      onAllocatedCountsChange(calculateAllocatedCounts());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, onAllocatedCountsChange]);

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
        .filter((room): room is RoomWithAssignments => room !== undefined),
      rightColumn: layout.rightColumn
        .map((num) => roomByNumber.get(num))
        .filter((room): room is RoomWithAssignments => room !== undefined),
    };

    const orderedIds = new Set(
      [...ordered.leftColumn, ...ordered.rightColumn].map((room) => room.id)
    );
    const overflowRooms = floorRooms.filter((room) => !orderedIds.has(room.id));
    ordered.leftColumn.push(...overflowRooms);

    return ordered;
  };

  const groundRooms = getOrderedRooms("ground");
  const upperRooms = getOrderedRooms("upper");

  if (rooms.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light">
            Room Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/60 bg-neutral-50 p-6 text-center text-sm text-text-light">
            Rooms have not been allocated yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light">
          Room Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ground" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="ground">Ground Floor</TabsTrigger>
            <TabsTrigger value="upper">Upper Floor</TabsTrigger>
          </TabsList>

          <TabsContent value="ground">
            <RoomFloorGrid rooms={groundRooms} bookingId={bookingId} />
          </TabsContent>

          <TabsContent value="upper">
            <RoomFloorGrid rooms={upperRooms} bookingId={bookingId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RoomFloorGrid({
  rooms,
  bookingId,
}: {
  rooms: { leftColumn: RoomWithAssignments[]; rightColumn: RoomWithAssignments[] };
  bookingId: string;
}) {
  const maxRows = Math.max(rooms.leftColumn.length, rooms.rightColumn.length);

  if (maxRows === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-neutral-50 p-6 text-center text-sm text-text-light">
        No rooms allocated on this floor.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        {rooms.leftColumn.map((room) => (
          <RoomCard key={room.id} room={room} bookingId={bookingId} />
        ))}
        {Array(Math.max(0, maxRows - rooms.leftColumn.length))
          .fill(null)
          .map((_, i) => (
            <div key={`pad-l-${i}`} className="h-[68px]" />
          ))}
      </div>

      <div className="space-y-2">
        {rooms.rightColumn.map((room) => (
          <RoomCard key={room.id} room={room} bookingId={bookingId} />
        ))}
        {Array(Math.max(0, maxRows - rooms.rightColumn.length))
          .fill(null)
          .map((_, i) => (
            <div key={`pad-r-${i}`} className="h-[68px]" />
          ))}
      </div>
    </div>
  );
}

function RoomCard({
  room,
  bookingId,
}: {
  room: RoomWithAssignments;
  bookingId: string;
}) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const assignment = getAssignmentForRoom(room);
  const [localAssignment, setLocalAssignment] = useState(assignment);

  const capacity = room.room_types?.capacity || 1;
  const maxCapacity = room.extra_bed_allowed ? capacity + 1 : capacity;
  const normalizeGuestNames = (names?: string[] | null) => {
    const normalized = (names ?? []).slice(0, maxCapacity);
    return [
      ...normalized,
      ...Array(Math.max(0, maxCapacity - normalized.length)).fill(""),
    ];
  };

  const [guestNames, setGuestNames] = useState<string[]>(() =>
    normalizeGuestNames(localAssignment?.guest_names)
  );
  const [extras, setExtras] = useState({
    extraBed: Boolean(localAssignment?.extra_bed_selected),
    ensuite: Boolean(localAssignment?.ensuite_selected),
    privateStudy: Boolean(localAssignment?.private_study_selected),
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalAssignment(assignment);
  }, [
    assignment?.id,
    assignment?.guest_names,
    assignment?.extra_bed_selected,
    assignment?.ensuite_selected,
    assignment?.private_study_selected,
  ]);

  useEffect(() => {
    if (!isExpanded) {
      setGuestNames(normalizeGuestNames(localAssignment?.guest_names));
      setExtras({
        extraBed: Boolean(localAssignment?.extra_bed_selected),
        ensuite: Boolean(localAssignment?.ensuite_selected),
        privateStudy: Boolean(localAssignment?.private_study_selected),
      });
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAssignment, maxCapacity, isExpanded]);

  const totalCapacity =
    extras.extraBed && room.extra_bed_allowed ? capacity + 1 : capacity;
  const isExtraBedSelected = extras.extraBed && room.extra_bed_allowed;
  const isEnsuiteSelected = extras.ensuite && room.ensuite_available;
  const isPrivateStudySelected =
    extras.privateStudy && room.private_study_available;

  const featureIconClass = (
    selected: boolean,
    activeClass: string,
    sizeClass: string
  ) =>
    cn(
      "flex items-center justify-center rounded-md border transition-colors",
      sizeClass,
      selected
        ? activeClass
        : "border-neutral-200 bg-neutral-100 text-neutral-400"
    );

  const handleExtraBedChange = (checked: boolean) => {
    setExtras((prev) => ({ ...prev, extraBed: checked }));
    setIsDirty(true);
    if (checked) {
      setGuestNames((prev) => normalizeGuestNames(prev));
    }
  };

  const handleGuestNameChange = (index: number, value: string) => {
    setGuestNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await customerUpdateRoomAllocationDetails(bookingId, room.id, {
        guestNames: guestNames.slice(0, totalCapacity),
        extraBed: extras.extraBed,
        ensuite: extras.ensuite,
        privateStudy: extras.privateStudy,
      });
      if (updated) {
        setLocalAssignment(updated);
        setGuestNames(normalizeGuestNames(updated.guest_names));
        setExtras({
          extraBed: Boolean(updated.extra_bed_selected),
          ensuite: Boolean(updated.ensuite_selected),
          privateStudy: Boolean(updated.private_study_selected),
        });
      }
      setIsDirty(false);
      setIsExpanded(false);
      toast({
        title: "Saved",
        description: "Room details updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to save",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isExpanded) {
    const hasExtras =
      room.extra_bed_allowed ||
      room.ensuite_available ||
      room.private_study_available;

    return (
      <div className="min-w-[170px] rounded-xl border-2 border-green-600 bg-white p-3 transition-all duration-200 shadow-sm">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-lg font-bold text-green-900">
                {room.room_number || room.name}
              </span>
              <p className="text-xs text-muted-foreground leading-tight">
                {room.room_types?.name || "Room"}
              </p>
            </div>
            {hasExtras && (
              <div className="flex items-center gap-1">
                {room.extra_bed_allowed && (
                  <div
                    className={featureIconClass(
                      isExtraBedSelected,
                      "border-amber-200 bg-amber-50 text-amber-500",
                      "size-7"
                    )}
                  >
                    <Bed className="size-4" />
                  </div>
                )}
                {room.ensuite_available && (
                  <div
                    className={featureIconClass(
                      isEnsuiteSelected,
                      "border-blue-200 bg-blue-50 text-blue-500",
                      "size-7"
                    )}
                  >
                    <ShowerHead className="size-4" />
                  </div>
                )}
                {room.private_study_available && (
                  <div
                    className={featureIconClass(
                      isPrivateStudySelected,
                      "border-green-200 bg-green-50 text-green-600",
                      "size-7"
                    )}
                  >
                    <BookOpen className="size-4" />
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="rounded-md p-1 transition-colors hover:bg-neutral-100"
          >
            <X className="size-4 text-neutral-500" />
          </button>
        </div>

        <div
          className={cn(
            "gap-1.5",
            maxCapacity >= 2 ? "grid grid-cols-2" : "grid grid-cols-1"
          )}
        >
          {Array.from({ length: maxCapacity }).map((_, i) => {
            const isActiveSlot = i < totalCapacity;
            return (
              <Input
                key={i}
                value={guestNames[i] || ""}
                onChange={(e) => handleGuestNameChange(i, e.target.value)}
                placeholder={`Guest ${i + 1}`}
                className={cn(
                  "h-8 px-2.5 text-sm",
                  !isActiveSlot && "invisible pointer-events-none"
                )}
                disabled={!isActiveSlot}
                tabIndex={isActiveSlot ? 0 : -1}
                aria-hidden={!isActiveSlot}
              />
            );
          })}
        </div>

        {hasExtras && (
          <div className="mt-3 space-y-2">
            {room.extra_bed_allowed && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={extras.extraBed}
                  onCheckedChange={handleExtraBedChange}
                  className="scale-75"
                />
                <div className="flex flex-1 items-center gap-1.5">
                  <span className="text-sm text-neutral-700">Extra Bed</span>
                  <span className="text-xs text-muted-foreground">
                    +${room.extra_bed_fee || 50}
                  </span>
                </div>
              </div>
            )}
            {room.ensuite_available && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={extras.ensuite}
                  onCheckedChange={(checked) => {
                    setExtras((prev) => ({ ...prev, ensuite: checked }));
                    setIsDirty(true);
                  }}
                  className="scale-75"
                />
                <div className="flex flex-1 items-center gap-1.5">
                  <span className="text-sm text-neutral-700">Ensuite</span>
                  <span className="text-xs text-muted-foreground">
                    +${room.ensuite_fee || 50}
                  </span>
                </div>
              </div>
            )}
            {room.private_study_available && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={extras.privateStudy}
                  onCheckedChange={(checked) => {
                    setExtras((prev) => ({ ...prev, privateStudy: checked }));
                    setIsDirty(true);
                  }}
                  className="scale-75"
                />
                <div className="flex flex-1 items-center gap-1.5">
                  <span className="text-sm text-neutral-700">Private Study</span>
                  <span className="text-xs text-muted-foreground">
                    +${room.private_study_fee || 100}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Details"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-[170px] rounded-xl border-2 border-green-600 bg-white p-3 transition-all duration-200">
      <div className="flex items-center gap-6 pr-10">
        <div>
          <span className="text-xl font-bold text-green-900">
            {room.room_number || room.name}
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            {room.ensuite_available && (
              <div
                className={featureIconClass(
                  isEnsuiteSelected,
                  "border-blue-200 bg-blue-50 text-blue-500",
                  "size-6"
                )}
              >
                <ShowerHead className="size-3.5" />
              </div>
            )}
            {room.extra_bed_allowed && (
              <div
                className={featureIconClass(
                  isExtraBedSelected,
                  "border-amber-200 bg-amber-50 text-amber-500",
                  "size-6"
                )}
              >
                <Bed className="size-3.5" />
              </div>
            )}
            {room.private_study_available && (
              <div
                className={featureIconClass(
                  isPrivateStudySelected,
                  "border-green-200 bg-green-50 text-green-600",
                  "size-6"
                )}
              >
                <BookOpen className="size-3.5" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-0.5">
          {guestNames.slice(0, totalCapacity).map((name, i) => {
            const trimmed = (name || "").trim();
            const isBlank = trimmed.length === 0;
            const displayName = isBlank ? `Guest ${i + 1}` : trimmed;
            return (
              <span
                key={`guest-${room.id}-${i}`}
                className={cn(
                  "w-28 truncate text-sm leading-tight",
                  isBlank
                    ? "text-neutral-300 font-medium"
                    : "text-olive-900 font-semibold"
                )}
                title={displayName}
              >
                {displayName}
              </span>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setIsExpanded(true)}
        className="absolute right-2 top-2 rounded-md p-1 transition-colors hover:bg-green-100"
        title="Edit guest details"
        type="button"
      >
        <UserPen className="size-4 text-green-600" />
      </button>
    </div>
  );
}
