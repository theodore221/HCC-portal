/**
 * Admin Custom Booking Link Actions
 */

'use server';

import { sbServer } from '@/lib/supabase-server';
import { generateCustomPricingToken } from '@/lib/security';
import { revalidatePath } from 'next/cache';

export async function createCustomBookingLink(data: {
  customer_name: string;
  customer_email: string;
  organization?: string;
  discount_percentage?: number;
  custom_pricing_notes?: string;
  enquiry_id?: string;
}) {
  const supabase: any = await sbServer();

  // Generate secure token
  const { token, hash, expires_at } = generateCustomPricingToken();

  // Create booking record with 'awaiting_customer_details' status
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      source: 'admin_created',
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      contact_name: data.customer_name,
      status: 'AwaitingDetails',
      custom_pricing_token_hash: hash,
      custom_pricing_token_expires_at: expires_at.toISOString(),
      custom_pricing_applied: !!data.discount_percentage,
      discount_percentage: data.discount_percentage || 0,
      custom_pricing_notes: data.custom_pricing_notes || null,
      enquiry_id: data.enquiry_id || null,
      // Placeholder values (will be filled by customer)
      booking_type: 'Group',
      arrival_date: new Date().toISOString(),
      departure_date: new Date().toISOString(),
      nights: 0,
      headcount: 1,
      minors: false,
      whole_centre: false,
      is_overnight: false,
      catering_required: false,
    })
    .select('id, reference')
    .single();

  if (error) {
    console.error('Error creating custom booking:', error);
    throw new Error('Failed to create custom booking link');
  }

  // If linked to enquiry, update enquiry status
  if (data.enquiry_id) {
    await supabase
      .from('enquiries')
      .update({
        status: 'converted_to_booking',
        converted_to_booking_id: booking.id,
      })
      .eq('id', data.enquiry_id);
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/admin/enquiries');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const bookingUrl = `${baseUrl}/booking/custom/${token}`;

  // Send custom booking link email (don't fail creation if email fails)
  try {
    const { sendCustomBookingLinkEmail } = await import('@/lib/email/send-custom-booking-link');
    await sendCustomBookingLinkEmail({
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      reference: booking.reference,
      booking_url: bookingUrl,
      expires_at: expires_at.toISOString(),
      discount_percentage: data.discount_percentage,
      custom_pricing_notes: data.custom_pricing_notes,
    });
    console.log(`Custom booking link email sent for ${booking.reference}`);
  } catch (emailError) {
    console.error('Failed to send custom booking link email:', emailError);
    // Continue - email failure shouldn't block link creation
  }

  return {
    success: true,
    booking_id: booking.id,
    reference: booking.reference,
    token,
    booking_url: bookingUrl,
    expires_at: expires_at.toISOString(),
    customer_email: data.customer_email,
  };
}
