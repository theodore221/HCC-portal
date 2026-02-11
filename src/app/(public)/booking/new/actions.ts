/**
 * Booking Form Server Actions
 */

'use server';

import { sbServer } from '@/lib/supabase-server';
import { bookingSchema } from '@/lib/validation/booking';
import { validateBotDetection, HONEYPOT_FIELDS } from '@/lib/security';
import { calculateBookingPricing, createPriceSnapshot } from '@/lib/pricing';
import type { BookingSelections } from '@/lib/pricing';

export interface BookingSubmissionResult {
  success: boolean;
  reference?: string;
  booking_id?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export async function submitBooking(formData: FormData): Promise<BookingSubmissionResult> {
  try {
    const rawData: any = Object.fromEntries(formData);

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
    const supabase = await sbServer();

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
          room_type_name: '', // Will be fetched in pricing engine
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
      // @ts-ignore - Type compatibility issue
      .insert({
        source: 'portal',
        booking_type: data.booking_type,
        customer_name: data.contact_name,
        customer_email: data.contact_email,
        contact_name: data.contact_name,
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
      })
      .select('id, reference, customer_name, customer_email, arrival_date, departure_date, headcount')
      .single() as any;

    if (bookingError || !booking) {
      console.error('Booking insert error:', bookingError);
      return { success: false, error: 'Failed to create booking' };
    }

    // Create price snapshot
    await createPriceSnapshot(booking.id, pricing, 'standard');

    // Send confirmation email (don't fail submission if email fails)
    try {
      const { sendBookingSubmittedEmail } = await import('@/lib/email/send-booking-submitted');
      await sendBookingSubmittedEmail(booking);
      console.log(`Booking submission confirmation email sent for ${booking.reference}`);
    } catch (emailError) {
      console.error('Failed to send booking submission confirmation email:', emailError);
      // Continue - email failure shouldn't block booking submission
    }

    return {
      success: true,
      reference: booking.reference,
      booking_id: booking.id,
    };
  } catch (error) {
    console.error('Booking submission error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
