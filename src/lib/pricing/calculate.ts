/**
 * Dynamic Pricing Calculation Engine
 *
 * Server-side pricing calculation that fetches current prices from the database
 * and calculates booking totals with optional discount application.
 *
 * Design principles:
 * - All calculations are server-side only (prevents price manipulation)
 * - Prices are fetched fresh from database for each calculation
 * - Price snapshots capture the exact prices used at calculation time
 * - Supports percentage discounts and per-item price overrides
 */

import { sbServer } from '../supabase-server';
import type {
  BookingSelections,
  DiscountConfig,
  PricingLineItem,
  PricingResult,
  PriceTableSnapshot,
} from './types';

// Constants
const WHOLE_CENTRE_DAILY_RATE = 1500;
const BYO_LINEN_DISCOUNT_PER_BED = 25;
const PERCOLATED_COFFEE_PRICE = 3;

/**
 * Main pricing calculation function
 *
 * This function is called during:
 * - Form display (for real-time pricing sidebar)
 * - Form submission (for final stored amounts)
 * - Admin pricing override
 *
 * @param selections - Customer's booking selections
 * @param discountConfig - Optional discount configuration
 * @returns Complete pricing breakdown with line items and totals
 */
export async function calculateBookingPricing(
  selections: BookingSelections,
  discountConfig?: DiscountConfig
): Promise<PricingResult> {
  const supabase = await sbServer();

  // Step 1: Fetch current prices from database
  const priceSnapshot = await fetchCurrentPrices(supabase);

  // Step 2: Calculate line items for each category
  const lineItems: PricingLineItem[] = [];

  // Accommodation line items
  if (selections.accommodation?.rooms) {
    const accommodationItems = calculateAccommodationPricing(
      selections.accommodation.rooms,
      selections.nights,
      priceSnapshot
    );
    lineItems.push(...accommodationItems);
  }

  // Catering line items
  if (selections.catering?.meals) {
    const cateringItems = calculateCateringPricing(
      selections.catering.meals,
      priceSnapshot
    );
    lineItems.push(...cateringItems);
  }

  // Percolated coffee
  if (selections.catering?.percolated_coffee?.quantity) {
    lineItems.push({
      category: 'catering',
      item: 'Percolated Coffee',
      qty: selections.catering.percolated_coffee.quantity,
      unit: 'serve',
      unit_price: PERCOLATED_COFFEE_PRICE,
      total: selections.catering.percolated_coffee.quantity * PERCOLATED_COFFEE_PRICE,
    });
  }

  // Venue line items
  if (selections.venue) {
    const venueItems = calculateVenuePricing(
      selections.venue,
      selections.nights,
      priceSnapshot
    );
    lineItems.push(...venueItems);
  }

  // Extras
  if (selections.extras) {
    const extrasItems = selections.extras.map((extra) => ({
      category: 'extras' as const,
      item: extra.item,
      qty: extra.quantity,
      unit: 'item',
      unit_price: extra.unit_price,
      total: extra.quantity * extra.unit_price,
    }));
    lineItems.push(...extrasItems);
  }

  // Step 3: Calculate subtotal (before discount)
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  // Step 4: Apply discount if provided
  let discountAmount = 0;

  if (discountConfig) {
    const discountResult = applyDiscount(lineItems, discountConfig);
    lineItems.splice(0, lineItems.length, ...discountResult.lineItems);
    discountAmount = discountResult.discountAmount;
  }

  // Step 5: Calculate final total
  const total = subtotal - discountAmount;

  return {
    line_items: lineItems,
    subtotal,
    discount_amount: discountAmount,
    total,
    price_snapshot: priceSnapshot,
    discount_config: discountConfig,
  };
}

/**
 * Fetch current prices from database tables
 */
async function fetchCurrentPrices(supabase: any): Promise<PriceTableSnapshot> {
  // Fetch meal prices
  const { data: mealPrices, error: mealError } = await supabase
    .from('meal_prices')
    .select('meal_type, price');

  if (mealError) throw new Error(`Failed to fetch meal prices: ${mealError.message}`);

  // Fetch room types
  const { data: roomTypes, error: roomError } = await supabase
    .from('room_types')
    .select('name, price');

  if (roomError) throw new Error(`Failed to fetch room types: ${roomError.message}`);

  // Fetch spaces
  const { data: spaces, error: spaceError } = await supabase
    .from('spaces')
    .select('name, price');

  if (spaceError) throw new Error(`Failed to fetch spaces: ${spaceError.message}`);

  // Convert to lookup maps
  const mealPriceMap: Record<string, number> = {};
  mealPrices?.forEach((mp) => {
    mealPriceMap[mp.meal_type] = mp.price;
  });

  const roomTypeMap: Record<string, number> = {};
  roomTypes?.forEach((rt) => {
    roomTypeMap[rt.name] = rt.price;
  });

  const spaceMap: Record<string, number> = {};
  spaces?.forEach((s) => {
    spaceMap[s.name] = s.price ?? 0;
  });

  return {
    meal_prices: mealPriceMap,
    room_types: roomTypeMap,
    spaces: spaceMap,
    captured_at: new Date().toISOString(),
  };
}

/**
 * Calculate accommodation pricing line items
 */
function calculateAccommodationPricing(
  rooms: BookingSelections['accommodation']['rooms'],
  nights: number,
  priceSnapshot: PriceTableSnapshot
): PricingLineItem[] {
  const items: PricingLineItem[] = [];

  rooms.forEach((room) => {
    const basePrice = priceSnapshot.room_types[room.room_type_name] || 0;
    const pricePerBed = room.byo_linen
      ? basePrice - BYO_LINEN_DISCOUNT_PER_BED
      : basePrice;

    const total = pricePerBed * room.quantity * nights;

    items.push({
      category: 'accommodation',
      item: room.room_type_name + (room.byo_linen ? ' (BYO Linen)' : ''),
      description: room.byo_linen
        ? `Base: $${basePrice} - $${BYO_LINEN_DISCOUNT_PER_BED} BYO discount`
        : undefined,
      qty: room.quantity * nights,
      unit: 'bed-night',
      unit_price: pricePerBed,
      total,
    });
  });

  return items;
}

/**
 * Calculate catering pricing line items
 */
function calculateCateringPricing(
  meals: BookingSelections['catering']['meals'],
  priceSnapshot: PriceTableSnapshot
): PricingLineItem[] {
  // Group meals by type and sum headcounts
  const mealSummary: Record<string, { count: number; headcount: number }> = {};

  meals.forEach((meal) => {
    if (!mealSummary[meal.meal_type]) {
      mealSummary[meal.meal_type] = { count: 0, headcount: 0 };
    }
    mealSummary[meal.meal_type].count += 1;
    mealSummary[meal.meal_type].headcount += meal.headcount;
  });

  // Create line items
  const items: PricingLineItem[] = [];

  Object.entries(mealSummary).forEach(([mealType, summary]) => {
    const unitPrice = priceSnapshot.meal_prices[mealType] || 0;
    const total = summary.headcount * unitPrice;

    items.push({
      category: 'catering',
      item: mealType,
      description: `${summary.count} meal${summary.count > 1 ? 's' : ''}, ${summary.headcount} total serves`,
      qty: summary.headcount,
      unit: 'serve',
      unit_price: unitPrice,
      total,
    });
  });

  return items;
}

/**
 * Calculate venue pricing line items
 */
function calculateVenuePricing(
  venue: BookingSelections['venue'],
  nights: number,
  priceSnapshot: PriceTableSnapshot
): PricingLineItem[] {
  const items: PricingLineItem[] = [];

  // Whole centre booking (exclusive use)
  if (venue.whole_centre) {
    // Whole centre is priced per day (not per night)
    const days = nights > 0 ? nights + 1 : 1; // Add 1 day for same-day bookings

    items.push({
      category: 'venue',
      item: 'Exclusive Use - Whole Centre',
      description: 'Private access to all facilities and grounds',
      qty: days,
      unit: 'day',
      unit_price: WHOLE_CENTRE_DAILY_RATE,
      total: days * WHOLE_CENTRE_DAILY_RATE,
    });
  }

  // Individual space bookings
  if (venue.spaces) {
    venue.spaces.forEach((space) => {
      const unitPrice = priceSnapshot.spaces[space.space_name] || 0;
      const total = space.days * unitPrice;

      items.push({
        category: 'venue',
        item: space.space_name,
        qty: space.days,
        unit: 'day',
        unit_price: unitPrice,
        total,
      });
    });
  }

  return items;
}

/**
 * Apply discount to line items
 *
 * Supports two discount types:
 * 1. Percentage discount - applies to all line items
 * 2. Per-item override - replaces specific unit prices
 */
function applyDiscount(
  lineItems: PricingLineItem[],
  discountConfig: DiscountConfig
): { lineItems: PricingLineItem[]; discountAmount: number } {
  const updatedItems = [...lineItems];
  let totalDiscount = 0;

  if (discountConfig.type === 'percentage' && discountConfig.percentage) {
    const discountMultiplier = discountConfig.percentage / 100;

    updatedItems.forEach((item) => {
      const itemDiscount = item.total * discountMultiplier;
      item.discounted_total = item.total - itemDiscount;
      totalDiscount += itemDiscount;
    });
  }

  if (discountConfig.type === 'per_item_override' && discountConfig.item_overrides) {
    discountConfig.item_overrides.forEach((override) => {
      const matchingItems = updatedItems.filter(
        (item) =>
          item.category === override.category && item.item.includes(override.item)
      );

      matchingItems.forEach((item) => {
        const oldTotal = item.total;
        item.discounted_unit_price = override.new_unit_price;
        item.discounted_total = item.qty * override.new_unit_price;
        totalDiscount += oldTotal - item.discounted_total;
      });
    });
  }

  return {
    lineItems: updatedItems,
    discountAmount: totalDiscount,
  };
}

/**
 * Calculate pricing for real-time display (form sidebar)
 *
 * This is a convenience wrapper that handles errors gracefully
 * for client-side display purposes.
 */
export async function calculatePricingForDisplay(
  selections: BookingSelections
): Promise<{ success: boolean; pricing?: PricingResult; error?: string }> {
  try {
    const pricing = await calculateBookingPricing(selections);
    return { success: true, pricing };
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
