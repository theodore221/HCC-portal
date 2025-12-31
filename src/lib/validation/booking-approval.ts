import type { EnrichedMealJob } from "@/lib/catering";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  type: 'space_conflict' | 'room_allocation' | 'catering_assignment';
  message: string;
  details?: Record<string, any>;
}

export interface BookingValidationChecks {
  spaceConflicts: {
    passed: boolean;
    conflictCount: number;
  };
  roomAllocation: {
    passed: boolean;
    requested: number;
    allocated: number;
    breakdown: {
      doubleBB: { requested: number; allocated: number };
      singleBB: { requested: number; allocated: number };
      studySuite: { requested: number; allocated: number };
      doubleEnsuite: { requested: number; allocated: number };
    };
  };
  cateringAssignment: {
    passed: boolean;
    totalMeals: number;
    assignedMeals: number;
    unassignedMeals: number;
  };
}

interface RoomAssignment {
  extra_bed_selected?: boolean | null;
  ensuite_selected?: boolean | null;
  private_study_selected?: boolean | null;
}

interface RoomWithAssignment {
  id: string;
  room_types?: {
    name: string;
  } | null;
  extra_bed_allowed?: boolean;
  ensuite_available?: boolean;
  private_study_available?: boolean;
  // The assignments array contains the selected options
  assignments: RoomAssignment[];
}

interface BookingForValidation {
  is_overnight: boolean;
  accommodation_requests: unknown;
  catering_required: boolean;
}

/**
 * Validates room allocation completeness
 * Returns true if allocated rooms match or exceed requested rooms
 *
 * Logic matches room-allocation-grid.tsx calculateAllocatedCounts():
 * - Study Suite: Double/Queen/King bed WITH ensuite_selected AND private_study_selected
 * - Double Ensuite: Rooms WITH ensuite_selected but WITHOUT private_study
 * - Double BB: Double/Queen/King bed rooms without special features
 * - Single BB: Single rooms (1 bed) + Twin Single rooms (2 beds, or 3 if extra_bed_selected)
 */
export function validateRoomAllocation(
  booking: BookingForValidation,
  rooms: RoomWithAssignment[]
): {
  passed: boolean;
  breakdown: BookingValidationChecks['roomAllocation']['breakdown'];
  totalRequested: number;
  totalAllocated: number;
} {
  // Skip validation if booking doesn't require accommodation
  if (!booking.is_overnight) {
    return {
      passed: true,
      breakdown: {
        doubleBB: { requested: 0, allocated: 0 },
        singleBB: { requested: 0, allocated: 0 },
        studySuite: { requested: 0, allocated: 0 },
        doubleEnsuite: { requested: 0, allocated: 0 },
      },
      totalRequested: 0,
      totalAllocated: 0
    };
  }

  const requests = (booking.accommodation_requests as Record<string, number | boolean>) || {};

  const breakdown: BookingValidationChecks['roomAllocation']['breakdown'] = {
    doubleBB: {
      requested: (requests.doubleBB as number) || 0,
      allocated: 0
    },
    singleBB: {
      requested: (requests.singleBB as number) || 0,
      allocated: 0
    },
    studySuite: {
      requested: (requests.studySuite as number) || 0,
      allocated: 0
    },
    doubleEnsuite: {
      requested: (requests.doubleEnsuite as number) || 0,
      allocated: 0
    }
  };

  // Count allocated rooms by type - matching the logic from room-allocation-grid.tsx
  rooms.forEach(room => {
    const typeName = room.room_types?.name || '';
    // Get the first assignment to check for selected options
    const assignment = room.assignments?.[0];
    const hasExtraBed = assignment?.extra_bed_selected && room.extra_bed_allowed;
    const hasEnsuite = assignment?.ensuite_selected && room.ensuite_available;
    const hasPrivateStudy = assignment?.private_study_selected && room.private_study_available;

    // Study Suite: Double bed + Ensuite + Private Study
    if (hasEnsuite && hasPrivateStudy && (typeName.includes('Double') || typeName.includes('Queen') || typeName.includes('King'))) {
      breakdown.studySuite.allocated += 1;
    }
    // Double Ensuite: Rooms with ensuite (but not study suite to avoid double counting)
    else if (hasEnsuite && !hasPrivateStudy) {
      breakdown.doubleEnsuite.allocated += 1;
    }
    // Double BB: Double/Queen/King bed rooms without special features
    else if (typeName.includes('Double') || typeName.includes('Queen') || typeName.includes('King')) {
      breakdown.doubleBB.allocated += 1;
    }
    // Single BB: Single bed rooms + Twin Single rooms
    // Twin Single counts as 2 beds (or 3 if extra bed is selected)
    else if (typeName === 'Single') {
      breakdown.singleBB.allocated += 1;
    } else if (typeName === 'Twin Single') {
      // Twin Single has capacity of 2, plus 1 if extra bed is selected
      breakdown.singleBB.allocated += hasExtraBed ? 3 : 2;
    }
  });

  // Check if all requested rooms are allocated
  const allMet = Object.entries(breakdown).every(
    ([_, data]) => data.allocated >= data.requested
  );

  const totalRequested = Object.values(breakdown).reduce((sum, d) => sum + d.requested, 0);
  const totalAllocated = Object.values(breakdown).reduce((sum, d) => sum + d.allocated, 0);

  return {
    passed: allMet && totalAllocated >= totalRequested,
    breakdown,
    totalRequested,
    totalAllocated
  };
}

/**
 * Validates catering assignments for approval
 *
 * For APPROVAL, a meal only needs an assigned caterer.
 * Menu items and coffee selections are filled in by the customer
 * via the portal after approval.
 */
export function validateCateringAssignments(
  mealJobs: EnrichedMealJob[]
): { passed: boolean; totalMeals: number; assignedMeals: number; unassignedMeals: number } {
  let assignedMeals = 0;
  const totalMeals = mealJobs.length;

  for (const meal of mealJobs) {
    // For approval, only check if a caterer has been assigned
    const hasCaterer = meal.assignedCatererId !== null && meal.assignedCatererId !== undefined;

    if (hasCaterer) {
      assignedMeals++;
    }
  }

  return {
    passed: assignedMeals === totalMeals,
    totalMeals,
    assignedMeals,
    unassignedMeals: totalMeals - assignedMeals
  };
}

/**
 * Comprehensive booking approval validation
 */
export function validateBookingForApproval(
  booking: BookingForValidation,
  rooms: RoomWithAssignment[],
  mealJobs: EnrichedMealJob[],
  spaceConflictCount: number
): BookingValidationChecks {
  const roomValidation = validateRoomAllocation(booking, rooms);
  const cateringValidation = booking.catering_required
    ? validateCateringAssignments(mealJobs)
    : { passed: true, totalMeals: 0, assignedMeals: 0, unassignedMeals: 0 };

  return {
    spaceConflicts: {
      passed: spaceConflictCount === 0,
      conflictCount: spaceConflictCount
    },
    roomAllocation: {
      passed: roomValidation.passed,
      requested: roomValidation.totalRequested,
      allocated: roomValidation.totalAllocated,
      breakdown: roomValidation.breakdown
    },
    cateringAssignment: cateringValidation
  };
}
