/**
 * Pricing Utility Functions
 *
 * Helper functions for pricing calculations and formatting
 */

import type { BookingSelections, PricingLineItem } from './types';

/**
 * Format a number as currency (AUD)
 *
 * @param amount - Numeric amount
 * @param showCents - Whether to show cents (default: true)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number, showCents: boolean = true): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}

/**
 * Calculate number of days from date range
 *
 * For venue pricing, we need days (not nights)
 * Days = nights + 1 (includes both arrival and departure days)
 *
 * @param arrivalDate - ISO date string
 * @param departureDate - ISO date string
 * @returns Number of days
 */
export function calculateDays(arrivalDate: string, departureDate: string): number {
  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);

  const diffTime = Math.abs(departure.getTime() - arrival.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Add 1 to include both arrival and departure days
  return diffDays + 1;
}

/**
 * Calculate number of nights from date range
 *
 * @param arrivalDate - ISO date string
 * @param departureDate - ISO date string
 * @returns Number of nights
 */
export function calculateNights(arrivalDate: string, departureDate: string): number {
  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);

  const diffTime = Math.abs(departure.getTime() - arrival.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Validate booking selections before pricing calculation
 *
 * Ensures all required fields are present and valid
 *
 * @param selections - Booking selections to validate
 * @returns Validation result
 */
export function validatePricingSelections(selections: BookingSelections): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate dates
  if (!selections.arrival_date) {
    errors.push('Arrival date is required');
  }

  if (!selections.departure_date) {
    errors.push('Departure date is required');
  }

  if (selections.arrival_date && selections.departure_date) {
    const arrival = new Date(selections.arrival_date);
    const departure = new Date(selections.departure_date);

    if (departure <= arrival) {
      errors.push('Departure date must be after arrival date');
    }
  }

  // Validate nights
  if (selections.nights < 0) {
    errors.push('Number of nights must be non-negative');
  }

  // Validate accommodation
  if (selections.accommodation?.rooms) {
    selections.accommodation.rooms.forEach((room, index) => {
      if (!room.room_type_name) {
        errors.push(`Room ${index + 1}: Room type name is required`);
      }
      if (room.quantity <= 0) {
        errors.push(`Room ${index + 1}: Quantity must be greater than 0`);
      }
    });
  }

  // Validate catering
  if (selections.catering?.meals) {
    selections.catering.meals.forEach((meal, index) => {
      if (!meal.meal_type) {
        errors.push(`Meal ${index + 1}: Meal type is required`);
      }
      if (!meal.date) {
        errors.push(`Meal ${index + 1}: Date is required`);
      }
      if (meal.headcount <= 0) {
        errors.push(`Meal ${index + 1}: Headcount must be greater than 0`);
      }
    });
  }

  // Validate venue
  if (selections.venue?.spaces) {
    selections.venue.spaces.forEach((space, index) => {
      if (!space.space_name) {
        errors.push(`Space ${index + 1}: Space name is required`);
      }
      if (space.days <= 0) {
        errors.push(`Space ${index + 1}: Days must be greater than 0`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Group line items by category for display
 *
 * @param lineItems - Array of pricing line items
 * @returns Grouped line items by category
 */
export function groupLineItemsByCategory(lineItems: PricingLineItem[]) {
  const grouped: Record<string, PricingLineItem[]> = {
    accommodation: [],
    catering: [],
    venue: [],
    extras: [],
  };

  lineItems.forEach((item) => {
    grouped[item.category].push(item);
  });

  return grouped;
}

/**
 * Calculate category subtotals
 *
 * @param lineItems - Array of pricing line items
 * @returns Subtotals for each category
 */
export function calculateCategorySubtotals(lineItems: PricingLineItem[]): Record<
  string,
  number
> {
  const subtotals: Record<string, number> = {
    accommodation: 0,
    catering: 0,
    venue: 0,
    extras: 0,
  };

  lineItems.forEach((item) => {
    const amount = item.discounted_total || item.total;
    subtotals[item.category] += amount;
  });

  return subtotals;
}

/**
 * Generate a pricing summary text (for emails/documents)
 *
 * @param lineItems - Array of pricing line items
 * @param total - Total amount
 * @returns Formatted text summary
 */
export function generatePricingSummaryText(
  lineItems: PricingLineItem[],
  subtotal: number,
  discountAmount: number,
  total: number
): string {
  const grouped = groupLineItemsByCategory(lineItems);
  let summary = '';

  // Add each category
  Object.entries(grouped).forEach(([category, items]) => {
    if (items.length === 0) return;

    summary += `\n${category.toUpperCase()}\n`;
    summary += '-'.repeat(50) + '\n';

    items.forEach((item) => {
      const amount = item.discounted_total || item.total;
      summary += `${item.item}: ${item.qty} × ${formatCurrency(item.unit_price)} = ${formatCurrency(amount)}\n`;
      if (item.description) {
        summary += `  (${item.description})\n`;
      }
    });
  });

  // Add totals
  summary += '\n' + '='.repeat(50) + '\n';
  summary += `Subtotal: ${formatCurrency(subtotal)}\n`;

  if (discountAmount > 0) {
    summary += `Discount: -${formatCurrency(discountAmount)}\n`;
  }

  summary += `TOTAL: ${formatCurrency(total)}\n`;

  return summary;
}

/**
 * Check if selections have any pricing items
 *
 * @param selections - Booking selections
 * @returns True if there are items to price
 */
export function hasSelectionsForPricing(selections: BookingSelections): boolean {
  return !!(
    selections.accommodation?.rooms?.length ||
    selections.catering?.meals?.length ||
    selections.catering?.percolated_coffee?.quantity ||
    selections.venue?.whole_centre ||
    selections.venue?.spaces?.length ||
    selections.extras?.length
  );
}

/**
 * Calculate savings from discount
 *
 * @param subtotal - Original subtotal
 * @param discountAmount - Discount applied
 * @returns Savings amount and percentage
 */
export function calculateSavings(subtotal: number, discountAmount: number) {
  const percentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

  return {
    amount: discountAmount,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    formatted: `${formatCurrency(discountAmount)} (${percentage.toFixed(0)}% off)`,
  };
}
