"use client";
import { toast } from 'sonner';

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
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-text">
              ${Number(row.original.price).toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              /{" "}
              {(row.original as any).pricing_unit === "PerBed" ? "bed" : "room"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "pricing_unit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditablePricingUnitCell
              type={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <Badge variant="secondary">
            {(row.original as any).pricing_unit === "PerBed"
              ? "Per Bed"
              : "Per Room"}
          </Badge>
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

  const columns: ColumnDef<
    Tables<"rooms"> & { room_types: Tables<"room_types"> | null }
  >[] = [
    {
      accessorKey: "room_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Room No." />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableRoomNumberCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="font-medium text-text">
            {(row.original as any).room_number || row.original.name}
          </span>
        );
      },
    },
    {
      accessorKey: "level",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Level" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableLevelCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {(row.original as any).level || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "wing",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Wing" />
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableWingCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <span className="text-sm text-text">
            {(row.original as any).wing || "—"}
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
          <div className="flex flex-col">
            <Badge
              variant="outline"
              className="border-border/70 bg-white w-fit"
            >
              {row.original.room_types?.name || "Unassigned"}
            </Badge>
            <span className="text-xs text-muted-foreground mt-1">
              Cap: {row.original.room_types?.capacity || 0}
            </span>
          </div>
        );
      },
    },
    {
      id: "ensuite",
      header: () => (
        <span className="text-xs font-semibold uppercase text-text-light">
          Ensuite
        </span>
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditableEnsuiteCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        const avail = (row.original as any).ensuite_available;
        const fee = (row.original as any).ensuite_fee;
        return avail ? (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Yes (${fee})
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        );
      },
    },
    {
      id: "private_study",
      header: () => (
        <span className="text-xs font-semibold uppercase text-text-light">
          Study
        </span>
      ),
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <EditablePrivateStudyCell
              room={row.original}
              onDone={() => setEditingId(null)}
            />
          );
        }
        const avail = (row.original as any).private_study_available;
        const fee = (row.original as any).private_study_fee;
        return avail ? (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            Yes (${fee})
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoomType(type.id, { description: value });
      onDone();
      toast.success("Room type updated");
    } catch (error) {
      toast.error("Error updating room type");
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoomType(type.id, { capacity: parseInt(value) || 0 });
      onDone();
      toast.success("Room type updated");
    } catch (error) {
      toast.error("Error updating room type");
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoomType(type.id, { price: parseFloat(value) || 0 });
      onDone();
      toast.success("Room type updated");
    } catch (error) {
      toast.error("Error updating room type");
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

function EditablePricingUnitCell({
  type,
  onDone,
}: {
  type: Tables<"room_types">;
  onDone: () => void;
}) {
  const [value, setValue] = useState((type as any).pricing_unit || "PerRoom");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoomType(type.id, { pricing_unit: value } as any);
      onDone();
      toast.success("Room type updated");
    } catch (error) {
      toast.error("Error updating room type");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={setValue} disabled={isLoading}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PerRoom">Per Room</SelectItem>
          <SelectItem value="PerBed">Per Bed</SelectItem>
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { name: value });
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { building: value });
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { room_type_id: value });
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, {
        extra_bed_allowed: allowed,
        extra_bed_fee: parseFloat(fee) || 0,
      });
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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
function EditableRoomNumberCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [value, setValue] = useState((room as any).room_number || room.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { room_number: value, name: value } as any);
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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
        className="w-20"
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

function EditableLevelCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [value, setValue] = useState((room as any).level || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { level: value } as any);
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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

function EditableWingCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [value, setValue] = useState((room as any).wing || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, { wing: value } as any);
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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

function EditableEnsuiteCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [allowed, setAllowed] = useState(
    (room as any).ensuite_available || false
  );
  const [fee, setFee] = useState((room as any).ensuite_fee?.toString() || "0");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, {
        ensuite_available: allowed,
        ensuite_fee: parseFloat(fee) || 0,
      } as any);
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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

function EditablePrivateStudyCell({
  room,
  onDone,
}: {
  room: Tables<"rooms">;
  onDone: () => void;
}) {
  const [allowed, setAllowed] = useState(
    (room as any).private_study_available || false
  );
  const [fee, setFee] = useState(
    (room as any).private_study_fee?.toString() || "0"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateRoom(room.id, {
        private_study_available: allowed,
        private_study_fee: parseFloat(fee) || 0,
      } as any);
      onDone();
      toast.success("Room updated");
    } catch (error) {
      toast.error("Error updating room");
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
