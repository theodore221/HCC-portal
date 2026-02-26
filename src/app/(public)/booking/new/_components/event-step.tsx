'use client';

import type { BookingFormState } from '../booking-form';

const EVENT_TYPES = [
  'Retreat',
  'Conference',
  'Wedding',
  'School',
  'Young Adults',
  'Training',
  'Silent Retreat',
  'Other',
] as const;

interface EventStepProps {
  formState: BookingFormState;
  onChange: (updates: Partial<BookingFormState>) => void;
}

function formatDuration(arrival: string, departure: string): string | null {
  if (!arrival || !departure) return null;
  const a = new Date(arrival);
  const d = new Date(departure);
  if (isNaN(a.getTime()) || isNaN(d.getTime()) || d <= a) return null;
  const nights = Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  const days = nights + 1;
  if (nights === 0) return '1 day (same day)';
  return `${nights} night${nights !== 1 ? 's' : ''}, ${days} days`;
}

export function EventStep({ formState, onChange }: EventStepProps) {
  const isGroup = formState.booking_type === 'Group';
  const duration = formatDuration(formState.arrival_date ?? '', formState.departure_date ?? '');

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Event & Dates</h2>
        <p className="text-sm text-gray-500">Tell us about your event and when you&apos;d like to visit.</p>
      </div>

      {/* Event Type (Group only) */}
      {isGroup && (
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
            Event Type *
          </label>
          <select
            id="event_type"
            value={formState.event_type ?? ''}
            onChange={(e) => onChange({ event_type: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">— Select event type —</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="arrival_date" className="block text-sm font-medium text-gray-700 mb-1">
            Arrival Date *
          </label>
          <input
            id="arrival_date"
            type="date"
            min={today}
            value={formState.arrival_date ?? ''}
            onChange={(e) => onChange({ arrival_date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700 mb-1">
            Departure Date *
          </label>
          <input
            id="departure_date"
            type="date"
            min={formState.arrival_date ?? today}
            value={formState.departure_date ?? ''}
            onChange={(e) => onChange({ departure_date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Duration display */}
      {duration && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">{duration}</span>
        </div>
      )}

      {/* Total Guests */}
      <div>
        <label htmlFor="headcount" className="block text-sm font-medium text-gray-700 mb-1">
          Total Guests *
        </label>
        <input
          id="headcount"
          type="number"
          min={1}
          max={200}
          value={formState.headcount ?? ''}
          onChange={(e) => onChange({ headcount: parseInt(e.target.value, 10) || undefined })}
          placeholder="Number of attendees"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-gray-400 mt-1">Maximum 200 guests</p>
      </div>

      {/* Minors */}
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          formState.minors ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
        }`}
        onClick={() => onChange({ minors: !formState.minors })}
      >
        <input
          id="minors"
          type="checkbox"
          checked={formState.minors ?? false}
          onChange={(e) => onChange({ minors: e.target.checked })}
          className="mt-0.5 rounded border-gray-300 text-primary"
          onClick={(e) => e.stopPropagation()}
        />
        <div>
          <label htmlFor="minors" className="text-sm font-medium text-gray-700 cursor-pointer">
            Group includes children or adults with care requirements
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            We&apos;ll follow our child-safe policies and may ask for additional information.
          </p>
        </div>
      </div>
    </div>
  );
}
