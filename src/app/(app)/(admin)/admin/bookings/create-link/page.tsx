/**
 * Admin: Create Custom Booking Link
 */

'use client';

import { useState, useTransition } from 'react';
import { createCustomBookingLink } from './actions';

export default function CreateCustomBookingLinkPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      customer_name: formData.get('customer_name') as string,
      customer_email: formData.get('customer_email') as string,
      organization: formData.get('organization') as string || undefined,
      discount_percentage: formData.get('discount_percentage')
        ? parseFloat(formData.get('discount_percentage') as string)
        : undefined,
      custom_pricing_notes: formData.get('custom_pricing_notes') as string || undefined,
    };

    startTransition(async () => {
      try {
        const res = await createCustomBookingLink(data);
        setResult(res);
      } catch (error) {
        setResult({ success: false, error: 'Failed to create link' });
      }
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.booking_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result?.success) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-2">
            ✓ Custom Booking Link Created
          </h2>
          <p className="text-sm text-green-800">
            Reference: <strong>{result.reference}</strong>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-900 mb-4">Booking Link</h3>

          <div className="bg-gray-50 p-4 rounded border mb-4">
            <code className="text-sm break-all">{result.booking_url}</code>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>

            <a
              href={`mailto:${result.customer_email}?subject=Your Holy Cross Centre Booking Link&body=Please use this link to complete your booking: ${result.booking_url}`}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Send via Email
            </a>
          </div>

          <div className="text-sm text-gray-600">
            <p>• Link expires: {new Date(result.expires_at).toLocaleString()}</p>
            <p>• Single-use token (invalidates after submission)</p>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                setResult(null);
                window.location.reload();
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Create Another Link →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Custom Booking Link</h1>
        <p className="text-sm text-gray-600 mt-2">
          Generate a secure booking link with custom pricing for a specific customer.
        </p>
      </div>

      {result?.error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name *
          </label>
          <input
            name="customer_name"
            type="text"
            required
            disabled={isPending}
            className="w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email *
          </label>
          <input
            name="customer_email"
            type="email"
            required
            disabled={isPending}
            className="w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization (Optional)
          </label>
          <input
            name="organization"
            type="text"
            disabled={isPending}
            className="w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Percentage (Optional)
          </label>
          <input
            name="discount_percentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            disabled={isPending}
            placeholder="e.g., 15 for 15% off"
            className="w-full rounded-md border-gray-300 shadow-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty for standard pricing
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pricing Notes (Optional)
          </label>
          <textarea
            name="custom_pricing_notes"
            rows={3}
            disabled={isPending}
            placeholder="e.g., Parish member discount, Returning customer discount"
            className="w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Generating...' : 'Generate Custom Booking Link'}
        </button>
      </form>
    </div>
  );
}
