/**
 * Booking Form Server Actions
 */

'use server';

import { sbServer } from '@/lib/supabase-server';
import { validateBotDetection, HONEYPOT_FIELDS } from '@/lib/security';
import { calculateBookingPricing, createPriceSnapshot } from '@/lib/pricing';
import type { BookingSelections, PricingResult } from '@/lib/pricing';
import type { BookingFormState } from './booking-form';
import { ROOM_NAME_TO_SHORTHAND } from './_constants';

export interface BookingSubmissionResult {
  success: boolean;
  reference?: string;
  booking_id?: string;
  error?: string;
}

// ─── Pricing preview action ───────────────────────────────────────────────────

export async function calculatePricingPreview(
  formState: BookingFormState
): Promise<{ success: boolean; pricing?: PricingResult; error?: string }> {
  try {
    if (!formState.arrival_date || !formState.departure_date) {
      return { success: true, pricing: undefined };
    }

    const supabase = await sbServer();
    const nights = Math.max(
      0,
      Math.round(
        (new Date(formState.departure_date).getTime() - new Date(formState.arrival_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const days = nights > 0 ? nights + 1 : 1;

    // Fetch room type names for selected rooms
    const roomNames: Record<string, string> = {};
    if (formState.rooms && formState.rooms.length > 0) {
      const roomTypeIds = formState.rooms.map((r) => r.room_type_id);
      const { data: rtRows } = await supabase
        .from('room_types')
        .select('id, name')
        .in('id', roomTypeIds);
      rtRows?.forEach((rt: { id: string; name: string }) => {
        roomNames[rt.id] = rt.name;
      });
    }

    // Fetch space names for selected spaces
    const spaceNames: Record<string, string> = {};
    if (formState.selected_spaces && formState.selected_spaces.length > 0) {
      const { data: spRows } = await supabase
        .from('spaces')
        .select('id, name')
        .in('id', formState.selected_spaces);
      spRows?.forEach((s: { id: string; name: string }) => {
        spaceNames[s.id] = s.name;
      });
    }

    // Build selections
    const selections: BookingSelections = {
      arrival_date: formState.arrival_date,
      departure_date: formState.departure_date,
      nights,
      accommodation:
        formState.is_overnight && formState.rooms && formState.rooms.length > 0
          ? {
              rooms: formState.rooms
                .filter((r) => r.quantity > 0)
                .map((r) => ({
                  room_type_id: r.room_type_id,
                  room_type_name: roomNames[r.room_type_id] ?? '',
                  quantity: r.quantity,
                  byo_linen: formState.byo_linen,
                })),
            }
          : undefined,
      catering:
        formState.catering_required && formState.meals && formState.meals.length > 0
          ? {
              meals: formState.meals,
              percolated_coffee:
                formState.coffee_sessions && formState.coffee_sessions.length > 0
                  ? {
                      quantity: formState.coffee_sessions.reduce((s, c) => s + c.quantity, 0),
                    }
                  : undefined,
            }
          : undefined,
      venue: {
        whole_centre: formState.whole_centre,
        spaces:
          !formState.whole_centre && formState.selected_spaces && formState.selected_spaces.length > 0
            ? formState.selected_spaces.map((id) => ({
                space_id: id,
                space_name: spaceNames[id] ?? id,
                days,
              }))
            : undefined,
      },
    };

    const pricing = await calculateBookingPricing(selections);
    return { success: true, pricing };
  } catch (error) {
    console.error('Pricing preview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── Submit booking action ────────────────────────────────────────────────────

export async function submitBooking(
  formState: BookingFormState,
  csrfToken: string,
  timeToken: string
): Promise<BookingSubmissionResult> {
  try {
    // Bot detection using honeypot field name (expect the honeypot to be absent in formState)
    // FormState is a plain object so we check for the honeypot key explicitly
    const rawForBotCheck = {
      [HONEYPOT_FIELDS.booking]: (formState as Record<string, unknown>)[HONEYPOT_FIELDS.booking],
      _form_time: timeToken,
    };
    const botCheck = validateBotDetection(rawForBotCheck, HONEYPOT_FIELDS.booking);
    if (!botCheck.valid) {
      return { success: false, error: 'Invalid submission' };
    }

    // Basic validation
    if (!formState.contact_email || !formState.contact_name || !formState.arrival_date || !formState.departure_date) {
      return { success: false, error: 'Missing required fields' };
    }
    if (!formState.terms_accepted) {
      return { success: false, error: 'You must accept the Terms & Conditions' };
    }

    const supabase = await sbServer();

    const nights = Math.max(
      0,
      Math.round(
        (new Date(formState.departure_date).getTime() - new Date(formState.arrival_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const days = nights > 0 ? nights + 1 : 1;

    // Fetch room type names
    const roomNames: Record<string, string> = {};
    if (formState.rooms && formState.rooms.length > 0) {
      const roomTypeIds = formState.rooms.map((r) => r.room_type_id);
      const { data: rtRows } = await supabase
        .from('room_types')
        .select('id, name')
        .in('id', roomTypeIds);
      rtRows?.forEach((rt: { id: string; name: string }) => {
        roomNames[rt.id] = rt.name;
      });
    }

    // Fetch space names
    const spaceNames: Record<string, string> = {};
    if (formState.selected_spaces && formState.selected_spaces.length > 0) {
      const { data: spRows } = await supabase
        .from('spaces')
        .select('id, name')
        .in('id', formState.selected_spaces);
      spRows?.forEach((s: { id: string; name: string }) => {
        spaceNames[s.id] = s.name;
      });
    }

    // Build booking selections for pricing
    const selections: BookingSelections = {
      arrival_date: formState.arrival_date,
      departure_date: formState.departure_date,
      nights,
      accommodation:
        formState.is_overnight && formState.rooms && formState.rooms.length > 0
          ? {
              rooms: formState.rooms
                .filter((r) => r.quantity > 0)
                .map((r) => ({
                  room_type_id: r.room_type_id,
                  room_type_name: roomNames[r.room_type_id] ?? '',
                  quantity: r.quantity,
                  byo_linen: formState.byo_linen,
                })),
            }
          : undefined,
      catering:
        formState.catering_required && formState.meals && formState.meals.length > 0
          ? {
              meals: formState.meals,
              percolated_coffee:
                formState.coffee_sessions && formState.coffee_sessions.length > 0
                  ? {
                      quantity: formState.coffee_sessions.reduce((s, c) => s + c.quantity, 0),
                    }
                  : undefined,
            }
          : undefined,
      venue: {
        whole_centre: formState.whole_centre,
        spaces:
          !formState.whole_centre && formState.selected_spaces && formState.selected_spaces.length > 0
            ? formState.selected_spaces.map((id) => ({
                space_id: id,
                space_name: spaceNames[id] ?? id,
                days,
              }))
            : undefined,
      },
    };

    // Calculate pricing
    const pricing = await calculateBookingPricing(selections);

    // Build accommodation_requests JSONB
    const accommodationRequests: Record<string, number | boolean> = {
      singleBB: 0,
      doubleBB: 0,
      doubleEnsuite: 0,
      studySuite: 0,
      byo_linen: formState.byo_linen ?? false,
    };
    if (formState.is_overnight && formState.rooms && formState.rooms.length > 0) {
      for (const r of formState.rooms) {
        const name = roomNames[r.room_type_id];
        const key = name ? ROOM_NAME_TO_SHORTHAND[name] : undefined;
        if (key) {
          accommodationRequests[key] = r.quantity;
        }
      }
    }

    // Determine event type
    const eventType =
      formState.booking_type === 'Individual' ? 'Individual Stay' : (formState.event_type ?? null);

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      // @ts-ignore — type compatibility with generated types
      .insert({
        source: 'portal',
        booking_type: formState.booking_type,
        customer_name: formState.contact_name,
        customer_email: formState.contact_email,
        contact_name: formState.contact_name,
        contact_phone: formState.contact_phone ?? null,
        event_type: eventType,
        arrival_date: formState.arrival_date,
        departure_date: formState.departure_date,
        headcount: formState.headcount ?? 0,
        minors: formState.minors ?? false,
        whole_centre: formState.whole_centre ?? false,
        is_overnight: formState.is_overnight ?? false,
        catering_required: formState.catering_required ?? false,
        byo_linen: formState.byo_linen ?? false,
        accommodation_requests: accommodationRequests,
        notes: formState.notes ?? null,
        status: 'pending_admin_review',
      })
      .select('id, reference, customer_name, customer_email, arrival_date, departure_date, headcount')
      .single() as any;

    if (bookingError || !booking) {
      console.error('Booking insert error:', bookingError);
      return { success: false, error: 'Failed to create booking. Please try again.' };
    }

    // Create price snapshot
    try {
      await createPriceSnapshot(booking.id, pricing, 'standard');
    } catch (snapshotError) {
      console.error('Price snapshot error (non-fatal):', snapshotError);
    }

    // Send confirmation email
    try {
      const { sendBookingSubmittedEmail } = await import('@/lib/email/send-booking-submitted');
      await sendBookingSubmittedEmail(booking);
    } catch (emailError) {
      console.error('Confirmation email error (non-fatal):', emailError);
    }

    return {
      success: true,
      reference: booking.reference,
      booking_id: booking.id,
    };
  } catch (error) {
    console.error('Booking submission error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
