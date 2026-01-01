"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DietaryProfile } from "@/lib/queries/bookings";
import type { EnrichedMealJob } from "@/lib/catering";
import type { Enums } from "@/lib/database.types";

interface DietaryDataTableProps {
  dietaryProfiles: DietaryProfile[];
  mealJobs: EnrichedMealJob[];
  mealAttendance: Record<string, Record<string, boolean>>;
  onAttendanceChange?: (
    profileId: string,
    mealJobId: string,
    attending: boolean
  ) => Promise<void>;
  onAddProfile?: (data: {
    personName: string;
    dietType: string;
    allergy?: string;
    severity?: Enums<"severity">;
    notes?: string;
  }) => Promise<void>;
  onEditProfile?: (
    profileId: string,
    data: {
      personName?: string;
      dietType?: string;
      allergy?: string;
      severity?: Enums<"severity"> | null;
      notes?: string;
    }
  ) => Promise<void>;
  onDeleteProfile?: (profileId: string) => Promise<void>;
  editable?: boolean;
}

const DIET_TYPES = [
  "Vegetarian",
  "Vegan",
  "Gluten Free",
  "Dairy Free",
  "Nut Allergy",
  "Shellfish Allergy",
  "Halal",
  "Kosher",
  "Other",
];

const SEVERITY_OPTIONS: Enums<"severity">[] = ["Low", "Moderate", "High", "Fatal"];

function getMealColumnLabel(meal: EnrichedMealJob) {
  const date = new Date(meal.date);
  const dayAbbr = date.toLocaleDateString(undefined, { weekday: "short" });
  const mealAbbr =
    meal.meal === "Morning Tea"
      ? "MT"
      : meal.meal === "Afternoon Tea"
      ? "AT"
      : meal.meal.charAt(0);
  return `${dayAbbr} ${mealAbbr}`;
}

function getSeverityVariant(
  severity: Enums<"severity"> | null
): "destructive" | "default" | "secondary" {
  switch (severity) {
    case "Fatal":
      return "destructive";
    case "High":
      return "default";
    default:
      return "secondary";
  }
}

export function DietaryDataTable({
  dietaryProfiles,
  mealJobs,
  mealAttendance,
  onAttendanceChange,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
  editable = false,
}: DietaryDataTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<DietaryProfile | null>(
    null
  );
  const [formData, setFormData] = useState({
    personName: "",
    dietType: "",
    allergy: "",
    severity: "" as Enums<"severity"> | "",
    notes: "",
  });
  const [isPending, setIsPending] = useState(false);
  const [pendingAttendance, setPendingAttendance] = useState<string | null>(
    null
  );

  const handleOpenDialog = (profile?: DietaryProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        personName: profile.person_name,
        dietType: profile.diet_type,
        allergy: profile.allergy ?? "",
        severity: profile.severity ?? "",
        notes: profile.notes ?? "",
      });
    } else {
      setEditingProfile(null);
      setFormData({
        personName: "",
        dietType: "",
        allergy: "",
        severity: "",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.personName || !formData.dietType) return;

    setIsPending(true);
    try {
      if (editingProfile && onEditProfile) {
        await onEditProfile(editingProfile.id, {
          personName: formData.personName,
          dietType: formData.dietType,
          allergy: formData.allergy || undefined,
          severity: (formData.severity as Enums<"severity">) || null,
          notes: formData.notes || undefined,
        });
      } else if (onAddProfile) {
        await onAddProfile({
          personName: formData.personName,
          dietType: formData.dietType,
          allergy: formData.allergy || undefined,
          severity: (formData.severity as Enums<"severity">) || undefined,
          notes: formData.notes || undefined,
        });
      }
      setIsDialogOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!onDeleteProfile) return;
    if (!confirm("Are you sure you want to delete this dietary requirement?"))
      return;
    setIsPending(true);
    try {
      await onDeleteProfile(profileId);
    } finally {
      setIsPending(false);
    }
  };

  const handleAttendanceChange = async (
    profileId: string,
    mealJobId: string,
    attending: boolean
  ) => {
    if (!onAttendanceChange) return;
    const key = `${profileId}-${mealJobId}`;
    setPendingAttendance(key);
    try {
      await onAttendanceChange(profileId, mealJobId, attending);
    } finally {
      setPendingAttendance(null);
    }
  };

  // Sort meals by date and meal order
  const sortedMeals = [...mealJobs].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startDate.getTime() - b.startDate.getTime();
  });

  // Define columns
  const columns: ColumnDef<DietaryProfile>[] = [
    {
      accessorKey: "person_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Guest Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.person_name}</span>
      ),
    },
    {
      accessorKey: "diet_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Diet Type" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.diet_type}</span>
      ),
    },
    {
      accessorKey: "allergy",
      header: "Allergy",
      cell: ({ row }) => (
        <span className="text-sm text-text-light">
          {row.original.allergy || "—"}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => (
        <Badge variant={getSeverityVariant(row.original.severity)}>
          {row.original.severity || "Low"}
        </Badge>
      ),
    },
    // Dynamic meal attendance columns
    ...sortedMeals.map((meal): ColumnDef<DietaryProfile> => ({
      id: `meal-${meal.id}`,
      header: () => (
        <div
          className="text-center text-xs"
          title={`${meal.formattedDate} - ${meal.meal}`}
        >
          {getMealColumnLabel(meal)}
        </div>
      ),
      cell: ({ row }) => {
        const isAttending = mealAttendance[row.original.id]?.[meal.id] ?? true;
        const isPendingThis =
          pendingAttendance === `${row.original.id}-${meal.id}`;

        return (
          <div className="flex justify-center">
            {isPendingThis ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Checkbox
                checked={isAttending}
                onCheckedChange={(checked) =>
                  handleAttendanceChange(
                    row.original.id,
                    meal.id,
                    checked as boolean
                  )
                }
                disabled={!editable || !onAttendanceChange}
              />
            )}
          </div>
        );
      },
      meta: "text-center",
    })),
    // Actions column (only if editable)
    ...(editable
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: any }) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleOpenDialog(row.original)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                {onDeleteProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(row.original.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ),
            meta: "w-[80px]",
          } as ColumnDef<DietaryProfile>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={dietaryProfiles}
        emptyMessage="No dietary requirements recorded."
        renderToolbar={() =>
          editable && onAddProfile ? (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDialog()}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                Add Dietary Requirement
              </Button>
            </div>
          ) : null
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProfile
                ? "Edit Dietary Requirement"
                : "Add Dietary Requirement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Guest Name *</label>
              <Input
                value={formData.personName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, personName: e.target.value }))
                }
                placeholder="Enter guest name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Diet Type *</label>
              <Select
                value={formData.dietType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, dietType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select diet type" />
                </SelectTrigger>
                <SelectContent>
                  {DIET_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Allergy Details</label>
              <Input
                value={formData.allergy}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allergy: e.target.value }))
                }
                placeholder="Specify any allergies"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    severity: value as Enums<"severity">,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((sev) => (
                    <SelectItem key={sev} value={sev}>
                      {sev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !formData.personName || !formData.dietType}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingProfile ? "Save Changes" : "Add Requirement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
