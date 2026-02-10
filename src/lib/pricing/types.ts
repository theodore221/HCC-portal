/**
 * Pricing Engine Type Definitions
 *
 * This module defines the type system for the dynamic pricing engine.
 * All pricing calculations are server-side only to prevent manipulation.
 */

import { Database } from '../database.types';

// Extract table types for convenience
type MealPrice = Database['public']['Tables']['meal_prices']['Row'];
type RoomType = Database['public']['Tables']['room_types']['Row'];
type Space = Database['public']['Tables']['spaces']['Row'];

/**
 * Represents a single line item in a booking's pricing breakdown
 */
export interface PricingLineItem {
  category: 'accommodation' | 'catering' | 'venue' | 'extras';
  item: string; // e.g., "Single Room", "Breakfast", "Chapel"
  description?: string; // Optional additional details
  qty: number; // Quantity (nights, meals, days, etc.)
  unit: string; // e.g., "night", "meal", "day", "item"
  unit_price: number; // Price per unit
  total: number; // qty * unit_price (before discount)
  discounted_unit_price?: number; // If per-item override applied
  discounted_total?: number; // If discount applied
}

/**
 * Configuration for discount application
 */
export interface DiscountConfig {
  type: 'percentage' | 'per_item_override';

  // For percentage discounts (applies to all line items)
  percentage?: number; // e.g., 15 for 15% off

  // For per-item price overrides (replaces specific unit prices)
  item_overrides?: {
    category: string;
    item: string;
    new_unit_price: number;
  }[];

  // Admin notes explaining the discount rationale
  notes?: string;
}

/**
 * Snapshot of source prices at time of calculation
 * Ensures historical accuracy even if base prices change
 */
export interface PriceTableSnapshot {
  meal_prices: Record<string, number>; // e.g., { "Breakfast": 19, "Lunch": 24 }
  room_types: Record<string, number>; // e.g., { "Single": 110, "Double": 149 }
  spaces: Record<string, number>; // e.g., { "Chapel": 700, "Corbett Hall": 700 }
  captured_at: string; // ISO timestamp
}

/**
 * Complete pricing breakdown result
 */
export interface PricingResult {
  line_items: PricingLineItem[];
  subtotal: number; // Sum of all line_items.total
  discount_amount: number; // Total discount applied
  total: number; // subtotal - discount_amount
  price_snapshot: PriceTableSnapshot; // Source prices used
  discount_config?: DiscountConfig; // Discount configuration if applied
}

/**
 * Selection data from booking form
 * This represents what the customer has selected
 */
export interface BookingSelections {
  // Date range
  arrival_date: string; // ISO date
  departure_date: string; // ISO date
  nights: number;

  // Accommodation
  accommodation?: {
    rooms: {
      room_type_id: string;
      room_type_name: string;
      quantity: number;
      byo_linen?: boolean; // Brings own linen for $25 discount per bed
    }[];
  };

  // Catering
  catering?: {
    meals: {
      meal_type: string; // "Breakfast", "Lunch", etc.
      date: string; // ISO date
      headcount: number;
    }[];
    percolated_coffee?: {
      quantity: number; // Number of serves
    };
  };

  // Venue spaces
  venue?: {
    whole_centre?: boolean; // $1500/day exclusive use
    spaces?: {
      space_id: string;
      space_name: string;
      days: number; // Number of days reserved
    }[];
  };

  // Additional services
  extras?: {
    item: string;
    quantity: number;
    unit_price: number;
  }[];
}

/**
 * Options for pricing calculation
 */
export interface PricingOptions {
  selections: BookingSelections;
  discount_config?: DiscountConfig;
  custom_pricing_token?: string; // If using pre-negotiated pricing
}

/**
 * Database row type for booking_price_snapshots
 */
export interface BookingPriceSnapshot {
  id: string;
  booking_id: string;
  snapshot_type: 'standard' | 'custom_link' | 'admin_override';
  line_items: PricingLineItem[];
  subtotal: number;
  discount_percentage: number | null;
  discount_amount: number | null;
  total: number;
  price_table_snapshot: PriceTableSnapshot | null;
  override_notes: string | null;
  overridden_by: string | null;
  created_at: string;
}
