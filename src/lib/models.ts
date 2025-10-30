import type { BookingStatus, Severity } from "./queries/bookings";

export interface BookingSummary {
  id: string;
  reference: string | null;
  groupName: string;
  arrival: string;
  departure: string;
  headcount: number;
  overnight: boolean;
  status: BookingStatus;
  spaces: string[];
  cateringRequired: boolean;
  conflicts: string[];
}

export interface DietaryProfileSummary {
  id: string;
  personName: string;
  dietType: string;
  allergy: string | null;
  severity: Severity | null;
}

export interface RoomSummary {
  id: string;
  name: string;
  building: string | null;
  baseBeds: number;
  extraBedAllowed: boolean;
  extraBedFee?: number | null;
  occupants: string[];
}
