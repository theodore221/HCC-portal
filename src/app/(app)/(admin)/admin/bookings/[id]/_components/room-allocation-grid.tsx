'use client';

import { useState, useTransition } from 'react';
import { RoomWithAssignments, BookingWithMeta } from '@/lib/queries/bookings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2,
  Ban,
  Lock,
  ShowerHead,
  Bed,
  AlertTriangle,
  BookOpen,
  Loader2,
  UserPen,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { allocateRoom, deallocateRoom, updateRoomAllocationDetails } from '../actions';
import type { RoomAssignmentWithDetails } from '@/lib/queries/bookings';
import type { RoomConflict } from '../client';
import type { RoomWithMeta } from '../accommodation-tab';

// Room layout configuration matching physical layout at Holy Cross Centre
const UPPER_FLOOR_LAYOUT = {
  leftColumn: [
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
  ],
  rightColumn: ['9', '8', '7', '6', '5', '4', '3', '2', '1'],
};

const GROUND_FLOOR_LAYOUT = {
  leftColumn: [
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '3',
  ],
  // Chapter room is between 25 and 2
  rightColumn: [
    '33',
    '32',
    '31',
    '30',
    '29',
    '28',
    '27',
    '26',
    '25',
    'Chapter',
    '2',
    '1',
  ],
};

type RoomCardStatus = 'available' | 'allocated' | 'conflicting' | 'inactive';

interface RoomAllocationGridProps {
  booking: BookingWithMeta;
  rooms: RoomWithAssignments[];
  allRooms: RoomWithMeta[];
  roomConflicts: RoomConflict[];
  roomConflictingBookings: {
    id: string;
    reference: string | null;
    status: string;
    customer_name: string | null;
    contact_name: string | null;
    arrival_date: string;
    departure_date: string;
  }[];
}

// Helper to get assignment data for a room
function getAssignmentForRoom(
  roomId: string,
  assignedRooms: RoomWithAssignments[]
): RoomAssignmentWithDetails | null {
  for (const room of assignedRooms) {
    if (room.id === roomId && room.assignments.length > 0) {
      return room.assignments[0];
    }
  }
  return null;
}

export function RoomAllocationGrid({
  booking,
  rooms: assignedRooms,
  allRooms,
  roomConflicts,
  roomConflictingBookings,
}: RoomAllocationGridProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Optimistic state for allocated room IDs
  const [optimisticAllocations, setOptimisticAllocations] = useState<
    Set<string>
  >(() => new Set(assignedRooms.map((r) => r.id)));

  // Dialog state for unlocking inactive rooms (for this booking only)
  const [roomToUnlock, setRoomToUnlock] = useState<RoomWithMeta | null>(null);

  // Get room status
  const getRoomStatus = (room: RoomWithMeta): RoomCardStatus => {
    // If room is allocated to this booking, show as allocated (even if inactive)
    if (optimisticAllocations.has(room.id)) {
      return 'allocated';
    }
    // Check for conflicts with other bookings
    if (roomConflicts.some((c) => c.room_id === room.id)) {
      return 'conflicting';
    }
    // Inactive rooms that aren't allocated show as inactive (locked)
    if (!room.active) {
      return 'inactive';
    }
    return 'available';
  };

  // Get conflict details for a room
  const getConflictDetails = (roomId: string) => {
    const conflict = roomConflicts.find((c) => c.room_id === roomId);
    if (!conflict) return null;
    return roomConflictingBookings.find(
      (b) => b.id === conflict.conflicts_with
    );
  };

  // Handle room click
  const handleRoomClick = (room: RoomWithMeta) => {
    const status = getRoomStatus(room);

    if (status === 'conflicting') {
      return; // Disabled
    }

    if (status === 'inactive') {
      setRoomToUnlock(room);
      return;
    }

    if (status === 'allocated') {
      handleDeallocate(room.id);
    } else {
      handleAllocate(room.id);
    }
  };

  // Handle allocate
  const handleAllocate = (roomId: string) => {
    // Optimistic update
    setOptimisticAllocations((prev) => new Set([...prev, roomId]));

    startTransition(async () => {
      try {
        await allocateRoom(booking.id, roomId);
        toast({
          title: 'Room allocated',
          description: 'Room has been assigned to this booking.',
        });
      } catch (error) {
        // Rollback
        setOptimisticAllocations((prev) => {
          const next = new Set(prev);
          next.delete(roomId);
          return next;
        });
        toast({
          title: 'Failed to allocate',
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      }
    });
  };

  // Handle deallocate
  const handleDeallocate = (roomId: string) => {
    // Optimistic update
    setOptimisticAllocations((prev) => {
      const next = new Set(prev);
      next.delete(roomId);
      return next;
    });

    startTransition(async () => {
      try {
        await deallocateRoom(booking.id, roomId);
        toast({
          title: 'Room deallocated',
          description: 'Room has been removed from this booking.',
        });
      } catch (error) {
        // Rollback
        setOptimisticAllocations((prev) => new Set([...prev, roomId]));
        toast({
          title: 'Failed to deallocate',
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      }
    });
  };

  // Handle unlock room (allocate inactive room for this booking only)
  const handleUnlockRoom = () => {
    if (!roomToUnlock) return;
    const roomId = roomToUnlock.id;

    // Optimistic update
    setOptimisticAllocations((prev) => new Set([...prev, roomId]));
    setRoomToUnlock(null);

    startTransition(async () => {
      try {
        await allocateRoom(booking.id, roomId);
        toast({
          title: 'Room unlocked and allocated',
          description: `Room ${
            roomToUnlock.room_number || roomToUnlock.name
          } has been assigned to this booking.`,
        });
      } catch (error) {
        // Rollback
        setOptimisticAllocations((prev) => {
          const next = new Set(prev);
          next.delete(roomId);
          return next;
        });
        toast({
          title: 'Failed to unlock room',
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      }
    });
  };

  // Calculate progress
  const calculateProgress = () => {
    const requests =
      (booking.accommodation_requests as Record<string, number>) || {};
    const allocatedRooms = allRooms.filter((r) =>
      optimisticAllocations.has(r.id)
    );

    // Count allocated by type
    const allocatedByType: Record<string, number> = {};
    for (const room of allocatedRooms) {
      const typeName = room.room_types?.name || 'Unknown';
      allocatedByType[typeName] = (allocatedByType[typeName] || 0) + 1;
    }

    return {
      singleBB: {
        requested: requests.singleBB || 0,
        allocated: allocatedByType['Single'] || 0,
      },
      doubleBB: {
        requested: requests.doubleBB || 0,
        allocated:
          allocatedByType['Double Bed'] || allocatedByType['Queen Bed'] || 0,
      },
      twinSingle: {
        requested: requests.twinSingle || 0,
        allocated: allocatedByType['Twin Single'] || 0,
      },
    };
  };

  const progress = calculateProgress();

  // Get ordered rooms for a floor
  const getOrderedRooms = (floor: 'ground' | 'upper') => {
    const layout =
      floor === 'ground' ? GROUND_FLOOR_LAYOUT : UPPER_FLOOR_LAYOUT;
    const floorRooms = allRooms.filter((r) =>
      floor === 'ground'
        ? r.level === 'Ground Floor'
        : r.level === 'Upper Floor'
    );

    const roomByNumber = new Map(
      floorRooms.map((r) => [r.room_number || r.name, r])
    );

    return {
      leftColumn: layout.leftColumn
        .map((num) => roomByNumber.get(num))
        .filter((r): r is RoomWithMeta => r !== undefined),
      rightColumn: layout.rightColumn
        .map((num) => roomByNumber.get(num))
        .filter((r): r is RoomWithMeta => r !== undefined),
    };
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Progress Section */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-light">
              Accommodation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(progress).map(
                ([key, { requested, allocated }]) => {
                  if (requested === 0) return null;
                  const percentage = Math.min(
                    100,
                    Math.round((allocated / requested) * 100)
                  );
                  const isComplete = allocated >= requested;

                  const labels: Record<string, string> = {
                    singleBB: 'Single Beds',
                    doubleBB: 'Double/Queen Beds',
                    twinSingle: 'Twin Single',
                  };

                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-olive-700">
                          {labels[key]}
                        </span>
                        <span
                          className={cn(
                            'font-semibold',
                            isComplete ? 'text-olive-600' : 'text-olive-900'
                          )}
                        >
                          {allocated} / {requested}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className={cn(
                          'h-2',
                          isComplete && '[&>div]:bg-olive-500'
                        )}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>

        {/* Room Grid */}
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
                <RoomFloorGrid
                  rooms={getOrderedRooms('ground')}
                  assignedRooms={assignedRooms}
                  bookingId={booking.id}
                  getRoomStatus={getRoomStatus}
                  getConflictDetails={getConflictDetails}
                  onRoomClick={handleRoomClick}
                  isPending={isPending}
                />
              </TabsContent>

              <TabsContent value="upper">
                <RoomFloorGrid
                  rooms={getOrderedRooms('upper')}
                  assignedRooms={assignedRooms}
                  bookingId={booking.id}
                  getRoomStatus={getRoomStatus}
                  getConflictDetails={getConflictDetails}
                  onRoomClick={handleRoomClick}
                  isPending={isPending}
                />
              </TabsContent>
            </Tabs>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-text-light">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-border/70 bg-white" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-olive-300 bg-olive-50" />
                <span>Allocated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-red-200 bg-red-50/50" />
                <span>Conflicting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-dashed border-neutral-300 bg-neutral-100" />
                <span>Locked (Emergency)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShowerHead className="size-3.5 text-blue-500" />
                <span>Ensuite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bed className="size-3.5 text-amber-500" />
                <span>Extra bed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-green-600" />
                <span>Private study</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unlock Inactive Room Dialog */}
        <Dialog
          open={!!roomToUnlock}
          onOpenChange={() => setRoomToUnlock(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Unlock Room {roomToUnlock?.room_number || roomToUnlock?.name}?
              </DialogTitle>
              <DialogDescription>
                This room is normally reserved for emergencies and kept
                inactive. Unlocking it will allocate it to this booking only.
                The room will remain inactive for other bookings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoomToUnlock(null)}>
                Cancel
              </Button>
              <Button onClick={handleUnlockRoom} disabled={isPending}>
                {isPending ? 'Unlocking...' : 'Unlock & Allocate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Room Floor Grid Component
function RoomFloorGrid({
  rooms,
  assignedRooms,
  bookingId,
  getRoomStatus,
  getConflictDetails,
  onRoomClick,
  isPending,
}: {
  rooms: { leftColumn: RoomWithMeta[]; rightColumn: RoomWithMeta[] };
  assignedRooms: RoomWithAssignments[];
  bookingId: string;
  getRoomStatus: (room: RoomWithMeta) => RoomCardStatus;
  getConflictDetails: (roomId: string) =>
    | {
        id: string;
        reference: string | null;
        status: string;
        customer_name: string | null;
        contact_name: string | null;
      }
    | null
    | undefined;
  onRoomClick: (room: RoomWithMeta) => void;
  isPending: boolean;
}) {
  const maxRows = Math.max(rooms.leftColumn.length, rooms.rightColumn.length);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Left Column */}
      <div className="space-y-2">
        {rooms.leftColumn.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            status={getRoomStatus(room)}
            conflictDetails={getConflictDetails(room.id)}
            assignment={getAssignmentForRoom(room.id, assignedRooms)}
            bookingId={bookingId}
            onClick={() => onRoomClick(room)}
            disabled={isPending}
          />
        ))}
        {/* Padding for alignment */}
        {Array(Math.max(0, maxRows - rooms.leftColumn.length))
          .fill(null)
          .map((_, i) => (
            <div key={`pad-l-${i}`} className="h-[68px]" />
          ))}
      </div>

      {/* Right Column */}
      <div className="space-y-2">
        {rooms.rightColumn.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            status={getRoomStatus(room)}
            conflictDetails={getConflictDetails(room.id)}
            assignment={getAssignmentForRoom(room.id, assignedRooms)}
            bookingId={bookingId}
            onClick={() => onRoomClick(room)}
            disabled={isPending}
          />
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

// Room Card Component
function RoomCard({
  room,
  status,
  conflictDetails,
  assignment,
  bookingId,
  onClick,
  disabled,
}: {
  room: RoomWithMeta;
  status: RoomCardStatus;
  conflictDetails:
    | {
        id: string;
        reference: string | null;
        status: string;
        customer_name: string | null;
        contact_name: string | null;
      }
    | null
    | undefined;
  assignment: RoomAssignmentWithDetails | null;
  bookingId: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Local state for editing (only used when allocated)
  const capacity = room.room_types?.capacity || 1;
  const [guestNames, setGuestNames] = useState<string[]>(() => {
    const saved = assignment?.guest_names || [];
    // Ensure we have at least 'capacity' slots
    return [...saved, ...Array(Math.max(0, capacity - saved.length)).fill('')];
  });
  const [extras, setExtras] = useState({
    extraBed: assignment?.extra_bed_selected || false,
    ensuite: assignment?.ensuite_selected || false,
    privateStudy: assignment?.private_study_selected || false,
  });
  const [isDirty, setIsDirty] = useState(false);

  // Calculate total capacity (base + extra bed if selected)
  const totalCapacity = extras.extraBed && room.extra_bed_allowed ? capacity + 1 : capacity;

  // Adjust guest names array when extra bed changes
  const handleExtraBedChange = (checked: boolean) => {
    setExtras((prev) => ({ ...prev, extraBed: checked }));
    setIsDirty(true);
    if (checked) {
      // Add slot for extra guest
      setGuestNames((prev) => [...prev, '']);
    } else {
      // Remove extra slot
      setGuestNames((prev) => prev.slice(0, capacity));
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
      await updateRoomAllocationDetails(bookingId, room.id, {
        guestNames: guestNames.slice(0, totalCapacity),
        extraBed: extras.extraBed,
        ensuite: extras.ensuite,
        privateStudy: extras.privateStudy,
      });
      setIsDirty(false);
      setIsExpanded(false); // Close the expanded view after saving
      toast({
        title: 'Saved',
        description: 'Room details updated.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const statusStyles: Record<RoomCardStatus, string> = {
    available:
      'bg-white/90 border-border/70 hover:ring-2 hover:ring-green-200 cursor-pointer',
    allocated:
      'bg-white border-2 border-green-600',
    conflicting: 'bg-red-50/50 border-red-200 cursor-not-allowed opacity-75',
    inactive:
      'bg-neutral-100 border-neutral-300 border-dashed hover:ring-2 hover:ring-neutral-300 cursor-pointer',
  };

  const StatusIcon = () => {
    switch (status) {
      case 'allocated':
        return <CheckCircle2 className="size-4 text-green-600" />;
      case 'conflicting':
        return <Ban className="size-4 text-red-500" />;
      case 'inactive':
        return <Lock className="size-4 text-neutral-400" />;
      default:
        return null;
    }
  };

  // Expanded view for editing guest details
  if (status === 'allocated' && isExpanded) {
    const hasExtras = room.extra_bed_allowed || room.ensuite_available || room.private_study_available;

    return (
      <div
        className={cn(
          'rounded-xl border-2 border-green-600 bg-white p-3 transition-all duration-200 shadow-sm'
        )}
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-green-900">
              {room.room_number || room.name}
            </span>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {room.room_types?.name || 'Room'}
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <X className="size-4 text-neutral-500" />
          </button>
        </div>

        {/* Guest Name Inputs */}
        <div className={cn(
          'gap-1.5',
          totalCapacity >= 2 ? 'grid grid-cols-2' : 'grid grid-cols-1'
        )}>
          {Array.from({ length: totalCapacity }).map((_, i) => (
            <Input
              key={i}
              value={guestNames[i] || ''}
              onChange={(e) => handleGuestNameChange(i, e.target.value)}
              placeholder={`Guest ${i + 1}`}
              className="h-7 text-xs px-2"
            />
          ))}
        </div>

        {/* Extras Selection with Switches */}
        {hasExtras && (
          <div className="mt-3 space-y-2">
            {room.extra_bed_allowed && (
              <div className="flex items-center justify-between gap-2">
                <Switch
                  checked={extras.extraBed}
                  onCheckedChange={handleExtraBedChange}
                  className="scale-75"
                />
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-xs text-neutral-700">Extra Bed</span>
                  <span className="text-[10px] text-muted-foreground">+${room.extra_bed_fee || 50}</span>
                </div>
                <Bed className="size-3.5 text-amber-500" />
              </div>
            )}
            {room.ensuite_available && (
              <div className="flex items-center justify-between gap-2">
                <Switch
                  checked={extras.ensuite}
                  onCheckedChange={(checked) => {
                    setExtras((prev) => ({ ...prev, ensuite: checked }));
                    setIsDirty(true);
                  }}
                  className="scale-75"
                />
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-xs text-neutral-700">Ensuite</span>
                  <span className="text-[10px] text-muted-foreground">+${room.ensuite_fee || 50}</span>
                </div>
                <ShowerHead className="size-3.5 text-blue-500" />
              </div>
            )}
            {room.private_study_available && (
              <div className="flex items-center justify-between gap-2">
                <Switch
                  checked={extras.privateStudy}
                  onCheckedChange={(checked) => {
                    setExtras((prev) => ({ ...prev, privateStudy: checked }));
                    setIsDirty(true);
                  }}
                  className="scale-75"
                />
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-xs text-neutral-700">Private Study</span>
                  <span className="text-[10px] text-muted-foreground">+${room.private_study_fee || 100}</span>
                </div>
                <BookOpen className="size-3.5 text-green-600" />
              </div>
            )}
          </div>
        )}

        {/* Save Button - more pronounced */}
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Details'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Collapsed card for allocated rooms (with edit icon)
  if (status === 'allocated') {
    return (
      <div
        className={cn(
          'relative rounded-xl p-3 transition-all duration-200',
          'min-h-[68px] flex flex-col justify-between',
          statusStyles[status]
        )}
      >
        {/* Room Number - clickable to deallocate */}
        <div
          className="cursor-pointer hover:opacity-80"
          onClick={!disabled ? onClick : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              onClick();
            }
          }}
        >
          <span className="text-xl font-bold text-green-900">
            {room.room_number || room.name}
          </span>
        </div>

        {/* Feature Icons */}
        <div className="flex items-center gap-1.5 mt-1">
          {room.ensuite_available && (
            <ShowerHead className="size-3.5 text-blue-500" />
          )}
          {room.extra_bed_allowed && <Bed className="size-3.5 text-amber-500" />}
          {room.private_study_available && (
            <BookOpen className="size-3.5 text-green-600" />
          )}
        </div>

        {/* Right side: Status icon and Edit button */}
        <div className="absolute top-2 right-2 flex flex-col items-center gap-1">
          <StatusIcon />
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 rounded-md hover:bg-green-100 transition-colors"
            title="Edit guest details"
          >
            <UserPen className="size-4 text-green-600" />
          </button>
        </div>
      </div>
    );
  }

  // Collapsed card for non-allocated rooms
  const card = (
    <div
      className={cn(
        'relative rounded-xl border p-3 transition-all duration-200',
        'min-h-[68px] flex flex-col justify-between',
        statusStyles[status],
        disabled && status !== 'conflicting' && 'opacity-50 pointer-events-none'
      )}
      onClick={status !== 'conflicting' && !disabled ? onClick : undefined}
      role="button"
      tabIndex={status !== 'conflicting' ? 0 : -1}
      onKeyDown={(e) => {
        if (
          (e.key === 'Enter' || e.key === ' ') &&
          status !== 'conflicting' &&
          !disabled
        ) {
          onClick();
        }
      }}
    >
      {/* Room Number */}
      <span
        className={cn(
          'text-xl font-bold',
          status === 'inactive' ? 'text-neutral-500' : 'text-green-900'
        )}
      >
        {room.room_number || room.name}
      </span>

      {/* Feature Icons */}
      <div className="flex items-center gap-1.5 mt-1">
        {room.ensuite_available && (
          <ShowerHead className="size-3.5 text-blue-500" />
        )}
        {room.extra_bed_allowed && <Bed className="size-3.5 text-amber-500" />}
        {room.private_study_available && (
          <BookOpen className="size-3.5 text-green-600" />
        )}
      </div>

      {/* Status Icon */}
      <div className="absolute top-2 right-2">
        <StatusIcon />
      </div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-semibold">
            {room.room_types?.name || 'Unknown Type'}
          </p>
          <p className="text-xs text-muted-foreground">
            Capacity: {room.room_types?.capacity || '?'}{' '}
            {room.room_types?.capacity === 1 ? 'bed' : 'beds'}
          </p>
          {room.ensuite_available && (
            <p className="text-xs text-blue-600">Ensuite bathroom available</p>
          )}
          {room.extra_bed_allowed && (
            <p className="text-xs text-amber-600">Extra bed available</p>
          )}
          {room.private_study_available && (
            <p className="text-xs text-green-700">Private study available</p>
          )}
          {status === 'conflicting' && conflictDetails && (
            <div className="mt-2 rounded bg-red-50 p-2 text-xs">
              <p className="font-medium text-red-700">Conflict with:</p>
              <p className="text-red-600">
                {conflictDetails.reference || conflictDetails.id.slice(0, 8)}
                {' - '}
                {conflictDetails.customer_name ||
                  conflictDetails.contact_name ||
                  'Unknown'}
              </p>
            </div>
          )}
          {status === 'inactive' && (
            <p className="text-xs text-amber-600">
              Click to unlock for this booking
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
