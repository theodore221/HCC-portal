'use client';

import type { BookingFormState } from '../booking-form';

interface ContactStepProps {
  formState: BookingFormState;
  onChange: (updates: Partial<BookingFormState>) => void;
}

export function ContactStep({ formState, onChange }: ContactStepProps) {
  const isGroup = formState.booking_type === 'Group';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Details</h2>
        <p className="text-sm text-gray-500">Tell us who we&apos;re booking for.</p>
      </div>

      {/* Booking Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type *</label>
        <div className="grid grid-cols-2 gap-3">
          {(['Group', 'Individual'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ booking_type: type })}
              className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                formState.booking_type === type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {type === 'Group' ? '👥 Group / Organisation' : '👤 Individual'}
            </button>
          ))}
        </div>
      </div>

      {/* Organisation (Group only) */}
      {isGroup && (
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
            Organisation / Group Name *
          </label>
          <input
            id="organization"
            type="text"
            value={formState.organization ?? ''}
            onChange={(e) => onChange({ organization: e.target.value })}
            placeholder="e.g. St Mary's Parish"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {/* Contact Name */}
      <div>
        <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
          {isGroup ? 'Contact Name *' : 'Full Name *'}
        </label>
        <input
          id="contact_name"
          type="text"
          value={formState.contact_name ?? ''}
          onChange={(e) => onChange({ contact_name: e.target.value })}
          placeholder="Full name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
          {isGroup ? 'Contact Email *' : 'Email Address *'}
        </label>
        <input
          id="contact_email"
          type="email"
          value={formState.contact_email ?? ''}
          onChange={(e) => onChange({ contact_email: e.target.value })}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
          {isGroup ? 'Contact Phone *' : 'Phone Number *'}
        </label>
        <input
          id="contact_phone"
          type="tel"
          value={formState.contact_phone ?? ''}
          onChange={(e) => onChange({ contact_phone: e.target.value })}
          placeholder="04xx xxx xxx"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}
