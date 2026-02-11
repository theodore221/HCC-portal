/**
 * Custom Booking Page (Path C)
 * Tokenized booking form with pre-applied custom pricing
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { sbServer } from '@/lib/supabase-server';
import { validateCustomPricingToken, hashToken } from '@/lib/security/tokens';
import { getOrCreateCSRFToken } from '@/lib/security/csrf-actions';
import { CustomBookingForm } from './custom-booking-form';

export const metadata: Metadata = {
  title: 'Complete Your Booking | Holy Cross Centre',
  description: 'Complete your custom booking with pre-arranged pricing.',
};

interface CustomBookingPageProps {
  params: {
    token: string;
  };
}

export default async function CustomBookingPage({ params }: CustomBookingPageProps) {
  const { token } = params;
  const supabase = await sbServer();

  // Hash the token to look up in database
  const tokenHash = hashToken(token);

  // Fetch booking by token hash
  const { data: booking, error } = (await supabase
    .from('bookings')
    .select('*')
    .eq('custom_pricing_token_hash', tokenHash)
    .single()) as any;

  if (error || !booking) {
    notFound();
  }

  // Validate token
  const validation = validateCustomPricingToken(
    token,
    booking.custom_pricing_token_hash,
    booking.custom_pricing_token_expires_at,
    booking.status
  );

  // Handle invalid states
  if (!validation.valid) {
    if (validation.reason === 'expired') {
      return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">Link Expired</h2>
              <p className="text-sm text-yellow-800 mb-4">
                This booking link has expired. Custom booking links are valid for 30 days.
              </p>
              <p className="text-sm text-yellow-800">
                Please contact us to request a new booking link.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (validation.reason === 'already_used') {
      return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Booking Already Submitted</h2>
              <p className="text-sm text-blue-800 mb-4">
                Your booking <strong>{booking.reference}</strong> has already been submitted.
              </p>
              <p className="text-sm text-blue-800">
                We'll review your booking and contact you at <strong>{booking.customer_email}</strong> shortly.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Invalid token
    notFound();
  }

  // Get CSRF token
  const csrfToken = await getOrCreateCSRFToken();

  // Pass booking data to form
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Booking
          </h1>
          <p className="text-lg text-gray-600">
            Welcome, <strong>{booking.customer_name}</strong>! Complete the details below to finalize your booking.
          </p>
          {booking.discount_percentage > 0 && (
            <p className="text-sm text-green-700 mt-2 font-medium">
              ✓ Special pricing applied: {booking.discount_percentage}% discount
            </p>
          )}
          {booking.custom_pricing_notes && (
            <p className="text-sm text-gray-600 mt-1 italic">
              {booking.custom_pricing_notes}
            </p>
          )}
        </div>

        <CustomBookingForm
          csrfToken={csrfToken}
          token={token}
          bookingId={booking.id}
          customerName={booking.customer_name}
          customerEmail={booking.customer_email}
          discountPercentage={booking.discount_percentage}
          customPricingNotes={booking.custom_pricing_notes}
        />
      </div>
    </div>
  );
}
