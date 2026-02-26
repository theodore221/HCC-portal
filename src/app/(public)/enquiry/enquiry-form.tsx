/**
 * Enquiry Form Component
 *
 * Client component for the public enquiry form
 */

'use client';

import { useState, useTransition } from 'react';
import { submitEnquiry, type EnquirySubmissionResult } from './actions';
import { generateTimeToken, HoneypotField, HONEYPOT_FIELDS } from '@/lib/security/client';

interface EnquiryFormProps {
  csrfToken: string;
}

export function EnquiryForm({ csrfToken }: EnquiryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EnquirySubmissionResult | null>(null);
  const [timeToken] = useState(() => generateTimeToken());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const submitResult = await submitEnquiry(formData);
      setResult(submitResult);

      // Scroll to top to show result message
      if (submitResult.success || submitResult.error) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // Success state
  if (result?.success) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Enquiry Submitted Successfully
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>
                  Thank you for your enquiry! Your reference number is{' '}
                  <strong>{result.reference_number}</strong>.
                </p>
                <p className="mt-2">
                  We&apos;ll review your enquiry and get back to you shortly at the email
                  address you provided.
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    window.location.reload();
                  }}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Submit Another Enquiry →
                </button>
              </div>
            </div>
          </div>
        </div>

        {result.duplicate_warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="ml-3 text-sm text-amber-800">{result.duplicate_warning}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Error message */}
      {result?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{result.error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Security fields */}
        <HoneypotField name={HONEYPOT_FIELDS.enquiry} />
        <input type="hidden" name="_form_time" value={timeToken} />
        <input type="hidden" name="_csrf" value={csrfToken} />

        {/* Customer Name */}
        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            required
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {result?.errors?.customer_name && (
            <p className="mt-1 text-sm text-red-600">{result.errors.customer_name[0]}</p>
          )}
        </div>

        {/* Customer Email */}
        <div>
          <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="customer_email"
            name="customer_email"
            required
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {result?.errors?.customer_email && (
            <p className="mt-1 text-sm text-red-600">{result.errors.customer_email[0]}</p>
          )}
        </div>

        {/* Customer Phone (Optional) */}
        <div>
          <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="customer_phone"
            name="customer_phone"
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Organization (Optional) */}
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
            Organization / Group Name
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            disabled={isPending}
            placeholder="e.g., St Mary's Parish, Smith Family"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">
            Event Type <span className="text-red-500">*</span>
          </label>
          <select
            id="event_type"
            name="event_type"
            required
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Select Event Type --</option>
            <option value="Retreat">Retreat</option>
            <option value="Conference">Conference</option>
            <option value="Wedding">Wedding</option>
            <option value="School">School</option>
            <option value="Young Adults">Young Adults</option>
            <option value="Training">Training</option>
            <option value="Silent Retreat">Silent Retreat</option>
            <option value="Other">Other</option>
          </select>
          {result?.errors?.event_type && (
            <p className="mt-1 text-sm text-red-600">{result.errors.event_type[0]}</p>
          )}
        </div>

        {/* Approximate Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="approximate_start_date"
              className="block text-sm font-medium text-gray-700"
            >
              Approximate Start Date
            </label>
            <input
              type="date"
              id="approximate_start_date"
              name="approximate_start_date"
              disabled={isPending}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="approximate_end_date"
              className="block text-sm font-medium text-gray-700"
            >
              Approximate End Date
            </label>
            <input
              type="date"
              id="approximate_end_date"
              name="approximate_end_date"
              disabled={isPending}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Estimated Guests */}
        <div>
          <label htmlFor="estimated_guests" className="block text-sm font-medium text-gray-700">
            Estimated Number of Guests
          </label>
          <input
            type="number"
            id="estimated_guests"
            name="estimated_guests"
            min="1"
            max="200"
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Your Message <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Please tell us about your event and what you&apos;d like to know.
          </p>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            disabled={isPending}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {result?.errors?.message && (
            <p className="mt-1 text-sm text-red-600">{result.errors.message[0]}</p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPending ? 'Submitting...' : 'Submit Enquiry'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          By submitting this form, you agree to be contacted by Holy Cross Centre regarding
          your enquiry.
        </p>
      </form>
    </div>
  );
}
