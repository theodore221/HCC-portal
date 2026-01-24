/**
 * Caching utilities for Next.js server-side data fetching
 * Uses Next.js unstable_cache with tag-based revalidation
 */

import { unstable_cache } from "next/cache";
import { getBookingsForAdminPaginated } from "./queries/bookings.server";
import type { BookingStatus } from "./queries/bookings";

/**
 * Cache tags used for granular cache invalidation
 */
export const CACHE_TAGS = {
  BOOKINGS: "bookings",
  BOOKING_DETAIL: "booking-detail",
  BOOKING_STATUS_COUNTS: "booking-status-counts",
  MEAL_JOBS: "meal-jobs",
  SPACE_RESERVATIONS: "space-reservations",
  ROOM_ASSIGNMENTS: "room-assignments",
  DIETARY_PROFILES: "dietary-profiles",
} as const;

/**
 * Get booking status counts with caching
 * Cached for 60 seconds, tagged for invalidation when bookings change
 */
export const getBookingStatusCountsCached = unstable_cache(
  async () => {
    const { statusCounts } = await getBookingsForAdminPaginated({
      page: 1,
      pageSize: 1, // We only need counts, not the bookings themselves
    });
    return statusCounts;
  },
  ["booking-status-counts"],
  {
    tags: [CACHE_TAGS.BOOKING_STATUS_COUNTS, CACHE_TAGS.BOOKINGS],
    revalidate: 60, // Revalidate after 60 seconds
  }
);

/**
 * Get paginated bookings with caching
 * Caches each unique combination of filters for 30 seconds
 */
export const getBookingsPaginatedCached = (params: {
  page?: number;
  pageSize?: number;
  status?: BookingStatus[];
  search?: string;
}) => {
  // Create a unique cache key based on the parameters
  const cacheKey = [
    "bookings-paginated",
    `page-${params.page ?? 1}`,
    `size-${params.pageSize ?? 50}`,
    `status-${params.status?.join(",") ?? "all"}`,
    `search-${params.search ?? "none"}`,
  ];

  return unstable_cache(
    async () => {
      return await getBookingsForAdminPaginated(params);
    },
    cacheKey,
    {
      tags: [CACHE_TAGS.BOOKINGS, CACHE_TAGS.BOOKING_STATUS_COUNTS],
      revalidate: 30, // Revalidate after 30 seconds
    }
  )();
};

/**
 * Helper function to build cache tags for a specific booking
 * Use this when invalidating cache for a specific booking
 */
export const getBookingCacheTags = (bookingId: string) => {
  return [
    CACHE_TAGS.BOOKINGS,
    CACHE_TAGS.BOOKING_STATUS_COUNTS,
    `${CACHE_TAGS.BOOKING_DETAIL}:${bookingId}`,
  ];
};

/**
 * Helper function to get all meal job related tags
 */
export const getMealJobCacheTags = (bookingId?: string) => {
  const tags = [CACHE_TAGS.MEAL_JOBS];
  if (bookingId) {
    tags.push(`${CACHE_TAGS.MEAL_JOBS}:${bookingId}`);
  }
  return tags;
};

/**
 * Helper function to get all space reservation related tags
 */
export const getSpaceReservationCacheTags = (bookingId?: string) => {
  const tags = [CACHE_TAGS.SPACE_RESERVATIONS, CACHE_TAGS.BOOKINGS];
  if (bookingId) {
    tags.push(`${CACHE_TAGS.SPACE_RESERVATIONS}:${bookingId}`);
  }
  return tags;
};

/**
 * Helper function to get all room assignment related tags
 */
export const getRoomAssignmentCacheTags = (bookingId?: string) => {
  const tags = [CACHE_TAGS.ROOM_ASSIGNMENTS];
  if (bookingId) {
    tags.push(`${CACHE_TAGS.ROOM_ASSIGNMENTS}:${bookingId}`);
  }
  return tags;
};

/**
 * Helper function to get all dietary profile related tags
 */
export const getDietaryProfileCacheTags = (bookingId?: string) => {
  const tags = [CACHE_TAGS.DIETARY_PROFILES];
  if (bookingId) {
    tags.push(`${CACHE_TAGS.DIETARY_PROFILES}:${bookingId}`);
  }
  return tags;
};
