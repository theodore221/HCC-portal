/**
 * New Booking Page
 * Path B: Direct Booking Form with Standard Pricing
 */

import { Metadata } from 'next';
import { getOrCreateCSRFToken } from '@/lib/security/csrf-actions';
import { BookingForm } from './booking-form';

export const metadata: Metadata = {
  title: 'New Booking | Holy Cross Centre',
  description: 'Book the Holy Cross Centre for your event with our online booking form.',
};

export default async function NewBookingPage() {
  const csrfToken = await getOrCreateCSRFToken();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Holy Cross Centre
          </h1>
          <p className="text-lg text-gray-600">
            Complete this form to request your booking. We&apos;ll review it and get back to you shortly.
          </p>
        </div>

        <BookingForm csrfToken={csrfToken} />
      </div>
    </div>
  );
}
