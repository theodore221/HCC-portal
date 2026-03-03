/**
 * Helpers to insert child records (space_reservations + meal_jobs) after a booking is created.
 * All functions are non-fatal — they log errors but never throw.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpaceReservationsOpts {
  arrival_date: string;
  departure_date: string;
  whole_centre?: boolean;
  selected_spaces?: string[];
}

export interface MealEntry {
  date: string;
  meal_type: string;
  headcount: number;
}

export interface MealJobsOpts {
  meals?: MealEntry[];
  /** Map keyed by "date|meal_type" → coffee quantity (public form per-session data) */
  coffeeOverlay?: Map<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an array of YYYY-MM-DD strings from start to end (inclusive). */
function dateRange(arrival: string, departure: string): string[] {
  const dates: string[] = [];
  const end = new Date(departure);
  for (const d = new Date(arrival); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// ─── Space Reservations ───────────────────────────────────────────────────────

export async function insertSpaceReservations(
  supabase: SupabaseClient,
  bookingId: string,
  opts: SpaceReservationsOpts
): Promise<void> {
  try {
    const { arrival_date, departure_date, whole_centre, selected_spaces } = opts;

    const dates = dateRange(arrival_date, departure_date);
    if (dates.length === 0) return;

    let spaceIds: string[];
    if (whole_centre) {
      const { data: spaces } = await supabase.from('spaces').select('id').eq('active', true);
      spaceIds = spaces?.map((s: { id: string }) => s.id) ?? [];
    } else {
      spaceIds = selected_spaces ?? [];
    }

    if (spaceIds.length === 0) return;

    const rows = dates.flatMap((service_date) =>
      spaceIds.map((space_id) => ({
        booking_id: bookingId,
        space_id,
        service_date,
        status: 'Held' as const,
      }))
    );

    const { error } = await supabase.from('space_reservations').insert(rows as any);
    if (error) console.error('insertSpaceReservations error:', error);
  } catch (err) {
    console.error('insertSpaceReservations unexpected error (non-fatal):', err);
  }
}

// ─── Meal Jobs ────────────────────────────────────────────────────────────────

export async function insertMealJobs(
  supabase: SupabaseClient,
  bookingId: string,
  opts: MealJobsOpts
): Promise<void> {
  try {
    const { meals, coffeeOverlay } = opts;

    if (!meals || meals.length === 0) return;

    const rows: object[] = [];
    const matchedCoffeeKeys = new Set<string>();

    for (const meal of meals) {
      const coffeeKey = `${meal.date}|${meal.meal_type}`;
      const coffeeQty = coffeeOverlay?.get(coffeeKey);
      const hasCoffee = coffeeQty !== undefined && coffeeQty > 0;
      if (hasCoffee) matchedCoffeeKeys.add(coffeeKey);

      rows.push({
        booking_id: bookingId,
        service_date: meal.date,
        meal: meal.meal_type,
        counts_total: meal.headcount,
        percolated_coffee: hasCoffee,
        percolated_coffee_quantity: hasCoffee ? coffeeQty : null,
        status: 'Draft',
      });
    }

    // Standalone coffee sessions with no matching meal
    if (coffeeOverlay) {
      for (const [key, qty] of coffeeOverlay.entries()) {
        if (matchedCoffeeKeys.has(key) || !qty) continue;
        const [date, meal_type] = key.split('|');
        rows.push({
          booking_id: bookingId,
          service_date: date,
          meal: meal_type,
          counts_total: 0,
          percolated_coffee: true,
          percolated_coffee_quantity: qty,
          status: 'Draft',
        });
      }
    }

    if (rows.length === 0) return;

    const { error } = await supabase.from('meal_jobs').insert(rows as any);
    if (error) console.error('insertMealJobs error:', error);
  } catch (err) {
    console.error('insertMealJobs unexpected error (non-fatal):', err);
  }
}
