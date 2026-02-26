/**
 * Public Enquiry Page
 *
 * Path A: Enquiry Form - For customers needing pricing info before committing
 */

import { Metadata } from 'next';
import { getOrCreateCSRFToken } from '@/lib/security/csrf-actions';
import { EnquiryForm } from './enquiry-form';

export const metadata: Metadata = {
  title: 'Enquiry | Holy Cross Centre',
  description:
    'Get in touch with Holy Cross Centre for pricing information and availability for your event.',
};

export default async function EnquiryPage() {
  // Generate CSRF token for form
  const csrfToken = await getOrCreateCSRFToken();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Holy Cross Centre Enquiry
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about booking the Holy Cross Centre? Fill out the form below and
            our team will get back to you with pricing information and availability.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-primary mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Quick Response</h3>
            <p className="text-sm text-gray-600">
              We aim to respond to all enquiries within 24 hours
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-primary mb-2">
              <svg
                className="w-8 h-8 mx-auto"
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
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Obligation</h3>
            <p className="text-sm text-gray-600">
              Enquiries are free and don&apos;t commit you to booking
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-primary mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Personal Service</h3>
            <p className="text-sm text-gray-600">
              We&apos;ll work with you to find the right package
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md">
          <EnquiryForm csrfToken={csrfToken} />
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">Prefer to talk? You can reach us directly:</p>
          <p>
            <strong>Phone:</strong> (03) 9846 6014 |{' '}
            <strong>Address:</strong> 207 Serpells Road, Templestowe, VIC
          </p>
        </div>
      </div>
    </div>
  );
}
