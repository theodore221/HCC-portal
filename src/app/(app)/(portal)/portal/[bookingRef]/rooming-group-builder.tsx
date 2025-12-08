import { useState, useTransition } from "react";
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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  GripVertical,
  Users,
  BedDouble,
  UserPlus,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  createRoomingGroup,
  updateRoomingGroup,
  deleteRoomingGroup,
} from "./actions";
import { createGuest, deleteGuest, populateGuests } from "./guest-actions";
import { cn } from "@/lib/utils";
import { Draggable } from "@/components/ui/draggable";
import { Droppable } from "@/components/ui/droppable";

// Types
interface Guest {
  id: string;
  name: string;
}

interface RoomingGroup {
  id: string;
  group_name: string;
  members: string[]; // Guest IDs
  preferred_room_type: string | null;
  special_requests: string | null;
  status: string;
}

interface RoomingGroupBuilderProps {
  bookingId: string;
  initialGroups: RoomingGroup[];
  unassignedGuests: Guest[];
  allGuests: Guest[];
  roomTypes: { id: string; name: string }[];
}

export function RoomingGroupBuilder({
  bookingId,
  initialGroups,
  unassignedGuests: initialUnassigned,
  allGuests,
  roomTypes,
}: RoomingGroupBuilderProps) {
  const [groups, setGroups] = useState<RoomingGroup[]>(initialGroups || []);
  const [unassigned, setUnassigned] = useState<Guest[]>(
    initialUnassigned || []
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newGuestName, setNewGuestName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination containers
    const sourceContainer = findContainer(activeId);
    const destContainer =
      findContainer(overId) || (overId === "unassigned" ? "unassigned" : null);

    if (
      !sourceContainer ||
      !destContainer ||
      sourceContainer === destContainer
    ) {
      return;
    }

    // Moving from Unassigned to Group
    if (sourceContainer === "unassigned" && destContainer !== "unassigned") {
      const guest = unassigned.find((g) => g.id === activeId);
      if (guest) {
        // Optimistic update
        setUnassigned(unassigned.filter((g) => g.id !== activeId));
        setGroups(
          groups.map((g) =>
            g.id === destContainer
              ? { ...g, members: [...(g.members || []), activeId] }
              : g
          )
        );

        // Server action
        startTransition(async () => {
          const group = groups.find((g) => g.id === destContainer);
          if (group) {
            await updateRoomingGroup(group.id, {
              members: [...(group.members || []), activeId],
            });
          }
        });
      }
    }

    // Moving from Group to Unassigned
    if (sourceContainer !== "unassigned" && destContainer === "unassigned") {
      // Optimistic update
      const group = groups.find((g) => g.id === sourceContainer);
      if (group) {
        setGroups(
          groups.map((g) =>
            g.id === sourceContainer
              ? {
                  ...g,
                  members: (g.members || []).filter((m) => m !== activeId),
                }
              : g
          )
        );

        const guestName =
          allGuests.find((g) => g.id === activeId)?.name || "Unknown Guest";
        setUnassigned([...unassigned, { id: activeId, name: guestName }]);

        startTransition(async () => {
          await updateRoomingGroup(group.id, {
            members: (group.members || []).filter((m) => m !== activeId),
          });
        });
      }
    }

    // Moving between Groups
    if (sourceContainer !== "unassigned" && destContainer !== "unassigned") {
      const sourceGroup = groups.find((g) => g.id === sourceContainer);
      const destGroup = groups.find((g) => g.id === destContainer);

      if (sourceGroup && destGroup) {
        setGroups(
          groups.map((g) => {
            if (g.id === sourceContainer)
              return {
                ...g,
                members: (g.members || []).filter((m) => m !== activeId),
              };
            if (g.id === destContainer)
              return { ...g, members: [...(g.members || []), activeId] };
            return g;
          })
        );

        startTransition(async () => {
          await updateRoomingGroup(sourceGroup.id, {
            members: (sourceGroup.members || []).filter((m) => m !== activeId),
          });
          await updateRoomingGroup(destGroup.id, {
            members: [...(destGroup.members || []), activeId],
          });
        });
      }
    }
  };

  const findContainer = (id: string) => {
    if (unassigned.find((g) => g.id === id)) return "unassigned";
    const group = groups.find((g) => (g.members || []).includes(id));
    return group ? group.id : null;
  };

  const handleCreateGroup = () => {
    startTransition(async () => {
      await createRoomingGroup(bookingId);
    });
  };

  const handleAddGuest = () => {
    if (!newGuestName.trim()) return;
    startTransition(async () => {
      await createGuest(bookingId, newGuestName);
      setNewGuestName("");
    });
  };

  const handlePopulateGuests = () => {
    startTransition(async () => {
      await populateGuests(bookingId, 10); // Default to 10 or fetch headcount?
      // Ideally we should pass headcount prop, but for now 10 is a safe placeholder or we can just let them add manually.
      // Actually, let's just use a fixed number or rely on manual add.
      // The user asked "How do i add my own", so manual add is key.
      // But "unassignment guest just had a bunch of 'Guest 1'..." implies they might want to bulk create.
      // Let's stick to manual add for now to be safe, or small batch.
    });
  };

  const handleDeleteGuest = (guestId: string) => {
    // Optimistic
    setUnassigned(unassigned.filter((g) => g.id !== guestId));
    startTransition(async () => {
      await deleteGuest(guestId);
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Unassigned Guests Sidebar */}
        <Card className="lg:col-span-1 h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Unassigned Guests</CardTitle>
            <CardDescription>
              {unassigned.length} guests remaining
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Guest Name"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
              />
              <Button
                size="icon"
                onClick={handleAddGuest}
                disabled={!newGuestName.trim() || isPending}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            <Droppable
              id="unassigned"
              className="min-h-[200px] space-y-2 rounded-lg p-2"
            >
              {unassigned.map((guest) => (
                <DraggableGuest
                  key={guest.id}
                  guest={guest}
                  onDelete={() => handleDeleteGuest(guest.id)}
                />
              ))}
              {unassigned.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                  All guests assigned!
                </div>
              )}
            </Droppable>

            {allGuests.length === 0 && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() =>
                  startTransition(
                    async () => await populateGuests(bookingId, 5)
                  )
                }
              >
                <Wand2 className="h-4 w-4" /> Quick Add 5 Guests
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Rooming Groups Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-olive-800">
              Rooming Groups
            </h2>
            <Button onClick={handleCreateGroup} className="gap-2">
              <Plus className="h-4 w-4" /> Add Group
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <RoomingGroupCard
                key={group.id}
                group={group}
                roomTypes={roomTypes}
                allGuests={allGuests}
                onUpdate={(updated) => {
                  setGroups(
                    groups.map((g) => (g.id === group.id ? updated : g))
                  );
                  startTransition(async () => {
                    await updateRoomingGroup(group.id, {
                      group_name: updated.group_name,
                      preferred_room_type: updated.preferred_room_type,
                      special_requests: updated.special_requests,
                    });
                  });
                }}
                onDelete={() => {
                  setGroups(groups.filter((g) => g.id !== group.id));
                  // Return members to unassigned
                  const members = group.members || [];
                  const returnedGuests = members.map((m) => {
                    const name =
                      allGuests.find((g) => g.id === m)?.name || "Unknown";
                    return { id: m, name };
                  });
                  setUnassigned([...unassigned, ...returnedGuests]);

                  startTransition(async () => {
                    await deleteRoomingGroup(group.id);
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="flex items-center gap-3 rounded-md border bg-white p-3 shadow-lg">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {allGuests.find((g) => g.id === activeId)?.name || activeId}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DraggableGuest({
  guest,
  onDelete,
}: {
  guest: Guest;
  onDelete: () => void;
}) {
  return (
    <Draggable id={guest.id}>
      <div className="flex items-center justify-between gap-3 rounded-md border bg-white p-3 shadow-sm hover:border-primary/50 cursor-grab active:cursor-grabbing group">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{guest.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag start
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Draggable>
  );
}

function RoomingGroupCard({
  group,
  roomTypes,
  allGuests,
  onUpdate,
  onDelete,
}: {
  group: RoomingGroup;
  roomTypes: { id: string; name: string }[];
  allGuests: Guest[];
  onUpdate: (group: RoomingGroup) => void;
  onDelete: () => void;
}) {
  return (
    <Droppable id={group.id}>
      <Card className="relative group h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <Input
              value={group.group_name}
              onChange={(e) =>
                onUpdate({ ...group, group_name: e.target.value })
              }
              className="h-8 font-semibold"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone for Guests */}
          <div className="min-h-[100px] rounded-lg border-2 border-dashed border-muted p-4 transition-colors hover:bg-muted/50">
            {(group.members || []).length > 0 ? (
              <div className="space-y-2">
                {(group.members || []).map((memberId) => (
                  <Draggable key={memberId} id={memberId}>
                    <div className="flex items-center gap-2 text-sm bg-white p-2 rounded border shadow-sm">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {allGuests.find((g) => g.id === memberId)?.name ||
                        "Unknown Guest"}
                    </div>
                  </Draggable>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground">
                <span>Drag guests here</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Preferred Room Type
              </label>
              <Select
                value={group.preferred_room_type || ""}
                onValueChange={(val) =>
                  onUpdate({ ...group, preferred_room_type: val })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Special Requests
              </label>
              <Input
                value={group.special_requests || ""}
                onChange={(e) =>
                  onUpdate({ ...group, special_requests: e.target.value })
                }
                placeholder="e.g. Ground floor"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Droppable>
  );
}
