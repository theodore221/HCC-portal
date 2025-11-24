"use client";

import { useState } from "react";
import { Tables } from "@/lib/database.types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Pencil, X } from "lucide-react";
import { updateRoom, updateRoomType } from "../actions";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface RoomsTabProps {
  rooms: (Tables<"rooms"> & { room_types: Tables<"room_types"> | null })[];
  roomTypes: Tables<"room_types">[];
}

export function RoomsTab({ rooms, roomTypes }: RoomsTabProps) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">
            Room Types & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoomTypesTable roomTypes={roomTypes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">Physical Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <PhysicalRoomsTable rooms={rooms} roomTypes={roomTypes} />
        </CardContent>
      </Card>
    </div>
  );
}

function RoomTypesTable({ roomTypes }: { roomTypes: Tables<"room_types">[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const columns: ColumnDef<Tables<"room_types">>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-text">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableDescriptionCell
              type={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {row.original.description || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Capacity" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableCapacityCell
              type={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {row.original.capacity} beds
          </span>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price ($)" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditablePriceCell
              type={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm font-semibold text-text">
            ${Number(row.original.price).toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase text-text-light">
          Actions
        </span>
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return null;
        }
        return (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditingId(row.original.id)}
            className="text-text-light hover:text-text"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        );
      },
      meta: "text-right",
    },
  ];

  return <DataTable columns={columns} data={roomTypes} zebra />;
}

function PhysicalRoomsTable({
  rooms,
  roomTypes,
}: {
  rooms: (Tables<"rooms"> & { room_types: Tables<"room_types"> | null })[];
  roomTypes: Tables<"room_types">[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const columns: ColumnDef<
    Tables<"rooms"> & { room_types: Tables<"room_types"> | null }
  >[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableRoomNameCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="font-medium text-text">{row.original.name}</span>
        );
      },
    },
    {
      accessorKey: "building",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Building" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableBuildingCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {row.original.building || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "room_type_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableRoomTypeCell
              room={row.original}
              roomTypes={roomTypes}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <Badge variant="outline" className="border-border/70 bg-white">
            {row.original.room_types?.name || "Unassigned"}
          </Badge>
        );
      },
    },
    {
      id: "extra_bed",
      header: () => (
        <span className="text-xs font-semibold uppercase text-text-light">
          Extra Bed
        </span>
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableExtraBedCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return row.original.extra_bed_allowed ? (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            Yes (${row.original.extra_bed_fee})
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold uppercase text-text-light">
          Actions
        </span>
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return null;
        }
        return (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditingId(row.original.id)}
            className="text-text-light hover:text-text"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        );
      },
      meta: "text-right",
    },
  ];

  return <DataTable columns={columns} data={rooms} zebra />;
}

// Room Type editable cells
function EditableDescriptionCell({
  type,
  onDone,
}: {
  type: Tables<"room_types">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(type.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoomType(type.id, { description: value });
      onDone();
      toast({ title: "Room type updated" });
    } catch (error) {
      toast({ title: "Error updating room type", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditableCapacityCell({
  type,
  onDone,
}: {
  type: Tables<"room_types">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(type.capacity.toString());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoomType(type.id, { capacity: parseInt(value) || 0 });
      onDone();
      toast({ title: "Room type updated" });
    } catch (error) {
      toast({ title: "Error updating room type", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20"
        disabled={isLoading}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditablePriceCell({
  type,
  onDone,
}: {
  type: Tables<"room_types">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(type.price.toString());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoomType(type.id, { price: parseFloat(value) || 0 });
      onDone();
      toast({ title: "Room type updated" });
    } catch (error) {
      toast({ title: "Error updating room type", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24"
        disabled={isLoading}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

// Room edit cells
function EditableRoomNameCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(room.name);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { name: value });
      onDone();
      toast({ title: "Room updated" });
    } catch (error) {
      toast({ title: "Error updating room", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditableBuildingCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [value, setValue] = useState(room.building || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { building: value });
      onDone();
      toast({ title: "Room updated" });
    } catch (error) {
      toast({ title: "Error updating room", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditableRoomTypeCell({
  room,
  roomTypes,
  onDone,
}: {
  room: Tables<"rooms">;
  roomTypes: Tables<"room_types">[];
  onDone: () => void;
}) {
  const [value, setValue] = useState(room.room_type_id || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { room_type_id: value });
      onDone();
      toast({ title: "Room updated" });
    } catch (error) {
      toast({ title: "Error updating room", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={setValue} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {roomTypes.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function EditableExtraBedCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [allowed, setAllowed] = useState(room.extra_bed_allowed || false);
  const [fee, setFee] = useState(room.extra_bed_fee?.toString() || "0");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, {
        extra_bed_allowed: allowed,
        extra_bed_fee: parseFloat(fee) || 0,
      });
      onDone();
      toast({ title: "Room updated" });
    } catch (error) {
      toast({ title: "Error updating room", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={allowed}
        onChange={(e) => setAllowed(e.target.checked)}
        className="h-4 w-4"
      />
      {allowed && (
        <Input
          type="number"
          step="0.01"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="w-20"
          placeholder="Fee"
        />
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone}>
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
