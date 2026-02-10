/**
 * Dynamic Pricing Engine
 *
 * Centralized pricing calculation system for the HCC Portal.
 * All pricing logic is server-side only to prevent manipulation.
 *
 * Usage:
 * ```ts
 * import { calculateBookingPricing } from '@/lib/pricing';
 *
 * const pricing = await calculateBookingPricing(selections, discountConfig);
 * ```
 */

// Main calculation functions
export {
  calculateBookingPricing,
  calculatePricingForDisplay,
} from './calculate';

// Snapshot management
export {
  createPriceSnapshot,
  getLatestPriceSnapshot,
  getAllPriceSnapshots,
  getPriceSnapshotById,
  comparePriceSnapshots,
  formatPriceSnapshot,
} from './snapshot';

// Type definitions
export type {
  PricingLineItem,
  DiscountConfig,
  PriceTableSnapshot,
  PricingResult,
  BookingSelections,
  PricingOptions,
  BookingPriceSnapshot,
} from './types';

// Utility functions
export { formatCurrency, calculateDays, validatePricingSelections } from './utils';
