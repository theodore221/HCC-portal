/**
 * Portal New Booking Server Actions
 */

'use server';

import { sbServer } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/auth/server';
import { bookingSchema } from '@/lib/validation/booking';
import { validateBotDetection, HONEYPOT_FIELDS } from '@/lib/security';
import { calculateBookingPricing, createPriceSnapshot } from '@/lib/pricing';
import type { BookingSelections } from '@/lib/pricing';

export interface PortalBookingSubmissionResult {
  success: boolean;
  reference?: string;
  booking_id?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export async function submitPortalBooking(formData: FormData): Promise<PortalBookingSubmissionResult> {
  try {
    const supabase = await sbServer();
    const { profile } = await getCurrentProfile(supabase);

    // Ensure user is authenticated and is a customer
    if (!profile || profile.role !== 'customer') {
      return {
        success: false,
        error: 'You must be logged in to create a booking',
      };
    }

    const rawData = Object.fromEntries(formData);

    // Bot detection
    const botCheck = validateBotDetection(rawData, HONEYPOT_FIELDS.booking);
    if (!botCheck.valid) {
      return { success: false, error: 'Invalid submission' };
    }

    // Parse numbers and booleans
    if (rawData.headcount) rawData.headcount = parseInt(rawData.headcount as string, 10);
    rawData.minors = rawData.minors === 'true' || rawData.minors === true;
    rawData.whole_centre = rawData.whole_centre === 'true' || rawData.whole_centre === true;
    rawData.is_overnight = rawData.is_overnight === 'true' || rawData.is_overnight === true;
    rawData.catering_required = rawData.catering_required === 'true' || rawData.catering_required === true;

    // Add customer details from profile
    rawData.contact_name = profile.full_name || profile.email;
    rawData.contact_email = profile.email;

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

    // Calculate pricing
    const pricing = await calculateBookingPricing(selections);

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        source: 'portal',
        booking_type: data.booking_type,
        customer_name: profile.full_name || profile.email,
        customer_email: profile.email,
        customer_user_id: profile.id,
        contact_name: profile.full_name || profile.email,
        contact_phone: data.contact_phone,
        organization: data.organization,
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
      })
      .select('id, reference, customer_name, customer_email, arrival_date, departure_date, headcount')
      .single();

    if (bookingError) {
      console.error('Booking insert error:', bookingError);
      return { success: false, error: 'Failed to create booking' };
    }

    // Create price snapshot
    await createPriceSnapshot(booking.id, pricing, 'standard');

    // Send confirmation email (don't fail submission if email fails)
    try {
      const { sendBookingSubmittedEmail } = await import('@/lib/email/send-booking-submitted');
      await sendBookingSubmittedEmail(booking);
      console.log(`Portal booking confirmation email sent for ${booking.reference}`);
    } catch (emailError) {
      console.error('Failed to send portal booking confirmation email:', emailError);
      // Continue - email failure shouldn't block booking submission
    }

    return {
      success: true,
      reference: booking.reference,
      booking_id: booking.id,
    };
  } catch (error) {
    console.error('Portal booking submission error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
