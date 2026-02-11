/**
 * Custom Booking Form Server Actions
 */

'use server';

import { sbServer } from '@/lib/supabase-server';
import { bookingSchema } from '@/lib/validation/booking';
import { validateBotDetection, HONEYPOT_FIELDS, validateCustomPricingToken, hashToken } from '@/lib/security';
import { calculateBookingPricing, createPriceSnapshot } from '@/lib/pricing';
import type { BookingSelections } from '@/lib/pricing';

export interface CustomBookingSubmissionResult {
  success: boolean;
  reference?: string;
  booking_id?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export async function submitCustomBooking(formData: FormData): Promise<CustomBookingSubmissionResult> {
  try {
    const rawData: any = Object.fromEntries(formData);

    // Extract token and booking ID
    const token = rawData.token as string;
    const bookingId = rawData.booking_id as string;

    if (!token || !bookingId) {
      return { success: false, error: 'Invalid booking link' };
    }

    const supabase = await sbServer();

    // Fetch booking to validate token
    const { data: booking, error: fetchError } = (await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()) as any;

    if (fetchError || !booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Validate token
    const validation = validateCustomPricingToken(
      token,
      booking.custom_pricing_token_hash,
      booking.custom_pricing_token_expires_at,
      booking.status
    );

    if (!validation.valid) {
      if (validation.reason === 'expired') {
        return { success: false, error: 'This booking link has expired' };
      }
      if (validation.reason === 'already_used') {
        return { success: false, error: 'This booking link has already been used' };
      }
      return { success: false, error: 'Invalid booking link' };
    }

    // Bot detection
    const botCheck = validateBotDetection(rawData, HONEYPOT_FIELDS.booking);
    if (!botCheck.valid) {
      return { success: false, error: 'Invalid submission' };
    }

    // Parse numbers
    if (rawData.headcount) rawData.headcount = parseInt(rawData.headcount as string, 10);

    // Validate with Zod
    const validationResult = bookingSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return { success: false, error: 'Validation failed', errors };
    }

    const data = validationResult.data;

    // Calculate arrival/departure times
    const arrivalDate = new Date(data.arrival_date);
    const departureDate = new Date(data.departure_date);
    const nights = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create booking selections for pricing
    const selections: BookingSelections = {
      arrival_date: data.arrival_date,
      departure_date: data.departure_date,
      nights,
      accommodation: data.is_overnight && data.rooms ? {
        rooms: data.rooms.map(r => ({
          room_type_id: r.room_type_id,
          room_type_name: '',
          quantity: r.quantity,
          byo_linen: r.byo_linen,
        })),
      } : undefined,
      catering: data.catering_required && data.meals ? {
        meals: data.meals,
        percolated_coffee: data.percolated_coffee_quantity ? {
          quantity: data.percolated_coffee_quantity,
        } : undefined,
      } : undefined,
      venue: {
        whole_centre: data.whole_centre,
        spaces: data.selected_spaces?.map(id => ({
          space_id: id,
          space_name: '',
          days: nights + 1,
        })),
      },
    };

    // Calculate pricing with discount
    const pricing = await calculateBookingPricing(selections, {
      type: 'percentage',
      value: booking.discount_percentage || 0,
    } as any);

    // Update booking with details
    const { error: updateError } = await supabase
      .from('bookings')
      // @ts-ignore - Type compatibility issue
      .update({
        booking_type: data.booking_type,
        contact_phone: data.contact_phone,
        event_type: data.event_type,
        arrival_date: data.arrival_date,
        departure_date: data.departure_date,
        nights,
        headcount: data.headcount,
        minors: data.minors,
        whole_centre: data.whole_centre,
        is_overnight: data.is_overnight,
        catering_required: data.catering_required,
        notes: data.notes,
        status: 'pending_admin_review',
        // Nullify token after use
        custom_pricing_token_hash: null,
        custom_pricing_token_expires_at: null,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Booking update error:', updateError);
      return { success: false, error: 'Failed to update booking' };
    }

    // Create price snapshot
    await createPriceSnapshot(bookingId, pricing, 'custom_link');

    return {
      success: true,
      reference: booking.reference,
      booking_id: bookingId,
    };
  } catch (error) {
    console.error('Custom booking submission error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
