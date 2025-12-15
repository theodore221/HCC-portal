"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusChip } from "@/components/ui/status-chip";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import type {
  BookingWithMeta,
  DietaryProfile,
  SpaceReservation,
  Space,
} from "@/lib/queries/bookings";
import type { EnrichedMealJob } from "@/lib/catering";
import type { Tables } from "@/lib/database.types";

import { CustomerOverviewTab } from "./overview-tab";
import { CustomerSpacesTab } from "./spaces-tab";
import { CustomerCateringTab } from "./catering-tab";
import { CustomerAccommodationTab } from "./accommodation-tab";

interface CustomerPortalClientProps {
  booking: BookingWithMeta;
  cateringJobs: EnrichedMealJob[];
  dietaryProfiles: DietaryProfile[];
  roomingGroups: Tables<"rooming_groups">[];
  unassignedGuests: { id: string; name: string }[];
  allGuests: { id: string; name: string }[];
  roomTypes: { id: string; name: string }[];
  reservations: SpaceReservation[];
  allSpaces: Space[];
}

export default function CustomerPortalClient({
  booking,
  cateringJobs,
  dietaryProfiles,
  roomingGroups,
  unassignedGuests,
  allGuests,
  roomTypes,
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
            bookingId={booking.id}
            roomingGroups={roomingGroups}
            unassignedGuests={unassignedGuests}
            allGuests={allGuests}
            roomTypes={roomTypes}
          />
        </TabsContent>

        <TabsContent value="catering">
          <CustomerCateringTab
            cateringJobs={cateringJobs}
            dietaryProfiles={dietaryProfiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
