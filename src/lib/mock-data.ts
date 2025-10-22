export type BookingStatus =
  | "Pending"
  | "InTriage"
  | "Approved"
  | "DepositPending"
  | "DepositReceived"
  | "InProgress"
  | "Completed"
  | "Cancelled";

export interface BookingSummary {
  id: string;
  reference: string;
  groupName: string;
  arrival: string;
  departure: string;
  headcount: number;
  overnight: boolean;
  status: BookingStatus;
  spaces: string[];
  cateringRequired: boolean;
  conflicts?: string[];
}

export interface MealJob {
  id: string;
  bookingId: string;
  date: string;
  timeSlot: "Breakfast" | "Morning Tea" | "Lunch" | "Afternoon Tea" | "Dinner";
  menu: string[];
  dietaryCounts: Record<string, number>;
  percolatedCoffee: boolean;
  assignedCaterer?: string;
  status: "Assigned" | "Confirmed" | "InPrep" | "Served";
}

export interface Room {
  id: string;
  name: string;
  building: string;
  baseBeds: number;
  extraBedAllowed: boolean;
  extraBedFee?: number;
  occupants: string[];
}

export const MOCK_BOOKINGS: BookingSummary[] = [
  {
    id: "bkg_001",
    reference: "HCC-2411-ALPHA",
    groupName: "Alpha Youth Retreat",
    arrival: "2025-11-12",
    departure: "2025-11-14",
    headcount: 48,
    overnight: true,
    status: "DepositReceived",
    spaces: ["Corbett Room", "Dining Hall", "Chapel"],
    cateringRequired: true,
    conflicts: ["Dining Hall overlap on 13 Nov 12:00"],
  },
  {
    id: "bkg_002",
    reference: "HCC-2411-BETA",
    groupName: "Beta School Camp",
    arrival: "2025-11-18",
    departure: "2025-11-21",
    headcount: 72,
    overnight: true,
    status: "Approved",
    spaces: ["Dorm Wing A", "Dorm Wing B", "Morris Hall"],
    cateringRequired: true,
  },
  {
    id: "bkg_003",
    reference: "HCC-2411-GUEST",
    groupName: "Guest Conference",
    arrival: "2025-11-19",
    departure: "2025-11-19",
    headcount: 120,
    overnight: false,
    status: "Pending",
    spaces: ["Auditorium", "Dining Hall"],
    cateringRequired: true,
  },
];

export const MOCK_MEAL_JOBS: MealJob[] = [
  {
    id: "meal_001",
    bookingId: "bkg_001",
    date: "2025-11-12",
    timeSlot: "Dinner",
    menu: ["Roast Chicken", "Seasonal Vegetables"],
    dietaryCounts: { standard: 40, vegetarian: 5, vegan: 2, glutenFree: 1 },
    percolatedCoffee: false,
    assignedCaterer: "HCC Kitchen",
    status: "Assigned",
  },
  {
    id: "meal_002",
    bookingId: "bkg_001",
    date: "2025-11-13",
    timeSlot: "Morning Tea",
    menu: ["Scones", "Fruit Platter"],
    dietaryCounts: { standard: 35, glutenFree: 6, dairyFree: 2 },
    percolatedCoffee: true,
    assignedCaterer: "HCC Kitchen",
    status: "InPrep",
  },
  {
    id: "meal_003",
    bookingId: "bkg_002",
    date: "2025-11-19",
    timeSlot: "Lunch",
    menu: ["Pasta Bar", "Garden Salad"],
    dietaryCounts: { standard: 60, vegetarian: 8, vegan: 4 },
    percolatedCoffee: false,
    assignedCaterer: "Bella Catering",
    status: "Confirmed",
  },
];

export const MOCK_ROOMS: Room[] = [
  {
    id: "rm_101",
    name: "Dorm 1",
    building: "Wing A",
    baseBeds: 2,
    extraBedAllowed: true,
    extraBedFee: 40,
    occupants: ["Chris M.", "Jamie L."],
  },
  {
    id: "rm_102",
    name: "Dorm 2",
    building: "Wing A",
    baseBeds: 2,
    extraBedAllowed: true,
    extraBedFee: 40,
    occupants: ["Taylor R."],
  },
  {
    id: "rm_201",
    name: "Lodge Suite",
    building: "Wing B",
    baseBeds: 2,
    extraBedAllowed: false,
    occupants: ["Morgan S.", "Riley H."],
  },
];

export const MOCK_DIETARIES = [
  { name: "Chris M.", dietType: "Vegetarian", allergy: "Peanuts", severity: "Fatal" },
  { name: "Jamie L.", dietType: "Coeliac", allergy: "Gluten", severity: "High" },
  { name: "Taylor R.", dietType: "Standard", allergy: "", severity: "Low" },
];
