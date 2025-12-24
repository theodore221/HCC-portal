"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusChip } from "@/components/ui/status-chip";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import type {
  BookingWithMeta,
  DietaryProfile,
  SpaceReservation,
  Space,
  RoomWithAssignments,
} from "@/lib/queries/bookings";
import type { EnrichedMealJob } from "@/lib/catering";

import { CustomerOverviewTab } from "./overview-tab";
import { CustomerSpacesTab } from "./spaces-tab";
import { CustomerCateringTab } from "./catering-tab";
import { CustomerAccommodationTab } from "./accommodation-tab";

// Meal attendance type: { dietaryProfileId: { mealJobId: boolean } }
export type MealAttendanceMap = Record<string, Record<string, boolean>>;

interface CustomerPortalClientProps {
  booking: BookingWithMeta;
  cateringJobs: EnrichedMealJob[];
  menuItems: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
  dietaryProfiles: DietaryProfile[];
  mealAttendance: MealAttendanceMap;
  rooms: RoomWithAssignments[];
  reservations: SpaceReservation[];
  allSpaces: Space[];
}

export default function CustomerPortalClient({
  booking,
  cateringJobs,
  menuItems,
  dietaryProfiles,
  mealAttendance,
  rooms,
  reservations,
  allSpaces,
}: CustomerPortalClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getBookingDisplayName(booking)}
          </h1>
          <p className="text-muted-foreground">
            Reference: {booking.reference ?? booking.id}
          </p>
        </div>
        <StatusChip status={booking.status} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spaces">Spaces</TabsTrigger>
          <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
          <TabsTrigger value="catering">Catering</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CustomerOverviewTab booking={booking} />
        </TabsContent>

        <TabsContent value="spaces">
          <CustomerSpacesTab
            booking={booking}
            reservations={reservations}
            allSpaces={allSpaces}
          />
        </TabsContent>

        <TabsContent value="accommodation">
          <CustomerAccommodationTab
            booking={booking}
            rooms={rooms}
          />
        </TabsContent>

        <TabsContent value="catering">
          <CustomerCateringTab
            cateringJobs={cateringJobs}
            menuItems={menuItems}
            dietaryProfiles={dietaryProfiles}
            mealAttendance={mealAttendance}
            bookingId={booking.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
