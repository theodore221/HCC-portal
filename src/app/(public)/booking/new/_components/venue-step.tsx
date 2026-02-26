'use client';

import type { BookingFormState, SpaceOption } from '../booking-form';
import { formatCurrency } from '@/lib/pricing/utils';

interface VenueStepProps {
  formState: BookingFormState;
  spaces: SpaceOption[];
  onChange: (updates: Partial<BookingFormState>) => void;
}

function getDays(arrival: string, departure: string): number {
  if (!arrival || !departure) return 1;
  const a = new Date(arrival);
  const d = new Date(departure);
  const nights = Math.max(0, Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
  return nights > 0 ? nights + 1 : 1;
}

export function VenueStep({ formState, spaces, onChange }: VenueStepProps) {
  const days = getDays(formState.arrival_date ?? '', formState.departure_date ?? '');
  const wholeCentreTotal = 1500 * days;

  const toggleSpace = (spaceId: string) => {
    const current = formState.selected_spaces ?? [];
    const updated = current.includes(spaceId)
      ? current.filter((id) => id !== spaceId)
      : [...current, spaceId];
    onChange({ selected_spaces: updated });
  };

  const selectedSpaces = formState.selected_spaces ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Venue & Spaces</h2>
        <p className="text-sm text-gray-500">Select the spaces you need for your event.</p>
      </div>

      {/* Whole Centre toggle */}
      <div
        className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
          formState.whole_centre
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
        onClick={() => onChange({ whole_centre: !formState.whole_centre, selected_spaces: [] })}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                formState.whole_centre ? 'border-primary bg-primary' : 'border-gray-300'
              }`}
            >
              {formState.whole_centre && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Exclusive use — Whole Centre</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Private access to all facilities, grounds, and spaces. Ideal for large groups or events requiring full privacy.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-gray-900">$1,500<span className="text-sm font-normal text-gray-500">/day</span></p>
            {days > 0 && (
              <p className="text-sm text-primary font-medium">{formatCurrency(wholeCentreTotal)} est.</p>
            )}
          </div>
        </div>
      </div>

      {/* Individual spaces (shown when whole centre is NOT selected) */}
      {!formState.whole_centre && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Or select individual spaces:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spaces.map((space) => {
              const isSelected = selectedSpaces.includes(space.id);
              const spaceTotal = (space.price ?? 0) * days;

              return (
                <div
                  key={space.id}
                  className={`rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => toggleSpace(space.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{space.name}</p>
                        {space.capacity && (
                          <p className="text-xs text-gray-500">Up to {space.capacity} people</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {space.price != null && space.price > 0 ? (
                        <>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(space.price)}<span className="text-xs font-normal text-gray-500">/day</span>
                          </p>
                          {days > 1 && (
                            <p className="text-xs text-primary">{formatCurrency(spaceTotal)}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-medium text-primary">Free</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation hint */}
      {!formState.whole_centre && selectedSpaces.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          Please select at least one space, or choose exclusive whole-centre use above.
        </p>
      )}
    </div>
  );
}
