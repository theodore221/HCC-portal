/**
 * Price Snapshot Management
 *
 * Creates and stores pricing snapshots for bookings.
 * Ensures that future price changes don't affect historical bookings.
 */

import { sbServer } from '../supabase-server';
import type { PricingResult, BookingPriceSnapshot } from './types';

/**
 * Create a price snapshot for a booking
 *
 * This function stores the complete pricing breakdown in the
 * booking_price_snapshots table, creating an immutable audit trail.
 *
 * @param bookingId - UUID of the booking
 * @param pricingResult - Result from calculateBookingPricing()
 * @param snapshotType - Type of snapshot (standard, custom_link, admin_override)
 * @param overriddenBy - Profile ID of admin who made override (optional)
 * @returns Created snapshot record
 */
export async function createPriceSnapshot(
  bookingId: string,
  pricingResult: PricingResult,
  snapshotType: 'standard' | 'custom_link' | 'admin_override',
  overriddenBy?: string
): Promise<BookingPriceSnapshot> {
  const supabase: any = await sbServer();

  const snapshotData = {
    booking_id: bookingId,
    snapshot_type: snapshotType,
    line_items: pricingResult.line_items,
    subtotal: pricingResult.subtotal,
    discount_percentage: pricingResult.discount_config?.percentage || null,
    discount_amount: pricingResult.discount_amount,
    total: pricingResult.total,
    price_table_snapshot: pricingResult.price_snapshot,
    override_notes: pricingResult.discount_config?.notes || null,
    overridden_by: overriddenBy || null,
  };

  const { data, error } = await supabase
    .from('booking_price_snapshots')
    .insert(snapshotData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create price snapshot: ${error.message}`);
  }

  return data as BookingPriceSnapshot;
}

/**
 * Get the latest price snapshot for a booking
 *
 * @param bookingId - UUID of the booking
 * @returns Latest snapshot or null if none exists
 */
export async function getLatestPriceSnapshot(
  bookingId: string
): Promise<BookingPriceSnapshot | null> {
  const supabase: any = await sbServer();

  const { data, error } = await supabase
    .from('booking_price_snapshots')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - this is OK
      return null;
    }
    throw new Error(`Failed to fetch price snapshot: ${error.message}`);
  }

  return data as BookingPriceSnapshot;
}

/**
 * Get all price snapshots for a booking (full audit trail)
 *
 * @param bookingId - UUID of the booking
 * @returns Array of snapshots in chronological order (oldest first)
 */
export async function getAllPriceSnapshots(
  bookingId: string
): Promise<BookingPriceSnapshot[]> {
  const supabase: any = await sbServer();

  const { data, error } = await supabase
    .from('booking_price_snapshots')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch price snapshots: ${error.message}`);
  }

  return (data || []) as BookingPriceSnapshot[];
}

/**
 * Get price snapshot by ID
 *
 * @param snapshotId - UUID of the snapshot
 * @returns Snapshot or null if not found
 */
export async function getPriceSnapshotById(
  snapshotId: string
): Promise<BookingPriceSnapshot | null> {
  const supabase: any = await sbServer();

  const { data, error } = await supabase
    .from('booking_price_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch price snapshot: ${error.message}`);
  }

  return data as BookingPriceSnapshot;
}

/**
 * Compare two price snapshots to show what changed
 *
 * Useful for admin UI to show pricing adjustments
 *
 * @param originalSnapshot - Original snapshot
 * @param newSnapshot - New snapshot after adjustment
 * @returns Comparison summary
 */
export function comparePriceSnapshots(
  originalSnapshot: BookingPriceSnapshot,
  newSnapshot: BookingPriceSnapshot
) {
  const changes = {
    subtotal_change: newSnapshot.subtotal - originalSnapshot.subtotal,
    discount_change:
      (newSnapshot.discount_amount || 0) - (originalSnapshot.discount_amount || 0),
    total_change: newSnapshot.total - originalSnapshot.total,
    line_items_changed: false,
    new_discount_applied: !originalSnapshot.discount_percentage && newSnapshot.discount_percentage,
  };

  // Check if line items changed
  if (originalSnapshot.line_items.length !== newSnapshot.line_items.length) {
    changes.line_items_changed = true;
  } else {
    // Check if any line item totals changed
    const originalTotals = originalSnapshot.line_items.map((item) => item.total);
    const newTotals = newSnapshot.line_items.map((item) => item.total);

    changes.line_items_changed = !originalTotals.every(
      (total, i) => total === newTotals[i]
    );
  }

  return changes;
}

/**
 * Format price snapshot for display
 *
 * Converts a snapshot into a human-readable format
 */
export function formatPriceSnapshot(snapshot: BookingPriceSnapshot) {
  return {
    type: snapshot.snapshot_type,
    created: new Date(snapshot.created_at).toLocaleString(),
    subtotal: `$${snapshot.subtotal.toFixed(2)}`,
    discount: snapshot.discount_amount
      ? `$${snapshot.discount_amount.toFixed(2)}`
      : 'None',
    total: `$${snapshot.total.toFixed(2)}`,
    line_items: snapshot.line_items.map((item) => ({
      description: `${item.item} (${item.qty} × $${item.unit_price})`,
      total: `$${item.total.toFixed(2)}`,
      discounted: item.discounted_total
        ? `$${item.discounted_total.toFixed(2)}`
        : null,
    })),
  };
}
