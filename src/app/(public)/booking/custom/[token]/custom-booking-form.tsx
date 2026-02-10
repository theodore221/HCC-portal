/**
 * Custom Booking Form with Pre-Applied Pricing
 */

'use client';

import { useState, useTransition, useEffect } from 'react';
import { submitCustomBooking } from './actions';
import { generateTimeToken, HoneypotField, HONEYPOT_FIELDS } from '@/lib/security/client';

interface CustomBookingFormProps {
  csrfToken: string;
  token: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  discountPercentage: number;
  customPricingNotes?: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export function CustomBookingForm({
  csrfToken,
  token,
  bookingId,
  customerName,
  customerEmail,
  discountPercentage,
  customPricingNotes,
}: CustomBookingFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [timeToken] = useState(() => generateTimeToken());
  const [result, setResult] = useState<any>(null);

  const steps = [
    'Event Details',
    'Venue & Spaces',
    'Accommodation',
    'Catering',
    'Additional Services',
    'Review & Submit',
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const stepData = Object.fromEntries(data);

    setFormData(prev => ({ ...prev, ...stepData }));

    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    // Merge all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (!data.has(key)) {
        data.append(key, value);
      }
    });

    // Add token and booking ID
    data.append('token', token);
    data.append('booking_id', bookingId);

    startTransition(async () => {
      const submitResult = await submitCustomBooking(data);
      setResult(submitResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Success state
  if (result?.success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-2">Booking Submitted!</h3>
          <p className="text-sm text-green-800">
            Your booking reference is <strong>{result.reference}</strong>.
            We'll review your booking and contact you at <strong>{customerEmail}</strong> shortly.
          </p>
          {discountPercentage > 0 && (
            <p className="text-sm text-green-700 mt-4 font-medium">
              ✓ Your {discountPercentage}% discount has been applied
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Customer Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Booking for:</p>
            <p className="text-sm text-blue-800">{customerName} • {customerEmail}</p>
          </div>
          {discountPercentage > 0 && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
              {discountPercentage}% discount
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx + 1 === currentStep ? 'bg-blue-600 text-white' :
                idx + 1 < currentStep ? 'bg-green-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  idx + 1 < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center">
          Step {currentStep} of 6: {steps[currentStep - 1]}
        </p>
      </div>

      {/* Error message */}
      {result?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{result.error}</p>
        </div>
      )}

      <form onSubmit={currentStep === 6 ? handleSubmit : handleNext} className="bg-white rounded-lg shadow-md p-6">
        <HoneypotField name={HONEYPOT_FIELDS.booking} />
        <input type="hidden" name="_form_time" value={timeToken} />

        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Event Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Type *
              </label>
              <select name="booking_type" required className="w-full rounded-md border-gray-300 shadow-sm">
                <option value="">-- Select --</option>
                <option value="Group">Group</option>
                <option value="Individual">Individual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization / Group Name
              </label>
              <input name="organization" type="text" className="w-full rounded-md border-gray-300 shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input name="contact_phone" type="tel" required className="w-full rounded-md border-gray-300 shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select name="event_type" required className="w-full rounded-md border-gray-300 shadow-sm">
                <option value="">-- Select --</option>
                <option value="Retreat">Retreat</option>
                <option value="Conference">Conference</option>
                <option value="School">School</option>
                <option value="Wedding">Wedding</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Date *
              </label>
              <input name="arrival_date" type="date" required className="w-full rounded-md border-gray-300 shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date *
              </label>
              <input name="departure_date" type="date" required className="w-full rounded-md border-gray-300 shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Guests *
              </label>
              <input name="headcount" type="number" min="1" required className="w-full rounded-md border-gray-300 shadow-sm" />
            </div>

            <div className="flex items-center">
              <input name="minors" type="checkbox" className="rounded border-gray-300" />
              <label className="ml-2 text-sm text-gray-700">
                Group includes children or adults with care requirements
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Venue & Spaces */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Venue & Spaces</h2>

            <div className="flex items-center">
              <input name="whole_centre" type="checkbox" className="rounded border-gray-300" />
              <label className="ml-2 text-sm text-gray-700">
                Exclusive use of entire centre ($1,500/day)
              </label>
            </div>

            <p className="text-sm text-gray-600">
              Individual space selections will be added in a future update.
            </p>
          </div>
        )}

        {/* Step 3: Accommodation */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Accommodation</h2>
            <div className="flex items-center">
              <input name="is_overnight" type="checkbox" className="rounded border-gray-300" />
              <label className="ml-2 text-sm text-gray-700">Overnight accommodation required</label>
            </div>
            <p className="text-sm text-gray-600">Room selection will be added in a future update.</p>
          </div>
        )}

        {/* Step 4: Catering */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Catering</h2>
            <div className="flex items-center">
              <input name="catering_required" type="checkbox" className="rounded border-gray-300" />
              <label className="ml-2 text-sm text-gray-700">Catering required</label>
            </div>
            <p className="text-sm text-gray-600">Meal selection will be added in a future update.</p>
          </div>
        )}

        {/* Step 5: Additional Services */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Additional Services</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests or Notes
              </label>
              <textarea name="notes" rows={4} className="w-full rounded-md border-gray-300 shadow-sm" />
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Review & Submit</h2>

            {discountPercentage > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Custom Pricing Applied</h3>
                <p className="text-sm text-green-800">
                  Your booking includes a <strong>{discountPercentage}% discount</strong> on all items.
                </p>
                {customPricingNotes && (
                  <p className="text-sm text-green-700 mt-2 italic">
                    Note: {customPricingNotes}
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Review your booking details above. Pricing will be calculated based on your selections
                {discountPercentage > 0 ? ' with your discount applied' : ''}.
              </p>
            </div>

            <div className="flex items-start">
              <input name="terms_accepted" type="checkbox" required className="mt-1 rounded border-gray-300" />
              <label className="ml-2 text-sm text-gray-700">
                I have read and agree to the Holy Cross Centre Terms & Conditions *
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ← Back
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Submitting...' : currentStep === 6 ? 'Submit Booking' : 'Next →'}
          </button>
        </div>
      </form>
    </div>
  );
}
