'use client';

import type { BookingFormState, RoomTypeOption } from '../booking-form';
import { formatCurrency } from '@/lib/pricing/utils';
import { ROOM_DISPLAY_NAMES, ROOM_DISPLAY_DESCRIPTIONS } from '../_constants';

interface IndividualStayStepProps {
  formState: BookingFormState;
  roomTypes: RoomTypeOption[];
  onChange: (updates: Partial<BookingFormState>) => void;
}

function getNights(arrival: string, departure: string): number {
  if (!arrival || !departure) return 0;
  const a = new Date(arrival + 'T00:00:00');
  const d = new Date(departure + 'T00:00:00');
  return Math.max(0, Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDuration(arrival: string, departure: string): string | null {
  if (!arrival || !departure) return null;
  const nights = getNights(arrival, departure);
  if (nights <= 0) return null;
  const days = nights + 1;
  return `${nights} night${nights !== 1 ? 's' : ''}, ${days} days`;
}

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// The "recommended" room
const RECOMMENDED_ROOM = 'Double Bed + Ensuite';

export function IndividualStayStep({ formState, roomTypes, onChange }: IndividualStayStepProps) {
  const nights = getNights(formState.arrival_date ?? '', formState.departure_date ?? '');
  const duration = formatDuration(formState.arrival_date ?? '', formState.departure_date ?? '');
  const byoLinen = formState.byo_linen ?? false;

  const selectedRoomId = formState.rooms?.[0]?.room_type_id ?? null;

  const todayStr = toLocalDateString(new Date());

  const selectRoom = (roomTypeId: string) => {
    onChange({ rooms: [{ room_type_id: roomTypeId, quantity: 1 }] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Plan your stay</h2>
        <p className="text-sm text-gray-500">Choose your dates and select a room that suits you.</p>
      </div>

      {/* Section A: Dates */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="arrival_date" className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Date *
              </label>
              <input
                id="arrival_date"
                type="date"
                min={todayStr}
                value={formState.arrival_date ?? ''}
                onChange={(e) => onChange({ arrival_date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Time
              </label>
              <input
                id="arrival_time"
                type="time"
                value={formState.arrival_time ?? ''}
                onChange={(e) => onChange({ arrival_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date *
              </label>
              <input
                id="departure_date"
                type="date"
                min={formState.arrival_date ?? todayStr}
                value={formState.departure_date ?? ''}
                onChange={(e) => onChange({ departure_date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time
              </label>
              <input
                id="departure_time"
                type="time"
                value={formState.departure_time ?? ''}
                onChange={(e) => onChange({ departure_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {duration && (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{duration}</span>
          </div>
        )}
      </div>

      {/* Section B: Room */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Room</h3>

        {/* Info callout */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
          <p className="font-medium mb-1">Good to know</p>
          <ul className="space-y-0.5 text-xs">
            <li>• Check-in: 2:30 PM &nbsp;|&nbsp; Check-out: 9:00 AM</li>
            <li>• Continental breakfast included for all overnight guests</li>
            <li>• Linen provided (or bring your own for a $25 discount)</li>
          </ul>
        </div>

        {/* Room radio cards */}
        <div className="space-y-2">
          {roomTypes.map((rt) => {
            const isSelected = selectedRoomId === rt.id;
            const linedPrice = byoLinen ? (rt.price ?? 0) - 25 : (rt.price ?? 0);
            const totalCost = linedPrice * nights;
            const isRecommended = rt.name === RECOMMENDED_ROOM;

            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => selectRoom(rt.id)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">
                        {ROOM_DISPLAY_NAMES[rt.name] ?? rt.name}
                      </span>
                      {isRecommended && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Most Popular
                        </span>
                      )}
                    </div>
                    {(ROOM_DISPLAY_DESCRIPTIONS[rt.name] ?? rt.description) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ROOM_DISPLAY_DESCRIPTIONS[rt.name] ?? rt.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(linedPrice)}
                      <span className="text-xs font-normal text-gray-400">/night</span>
                    </p>
                    {nights > 0 && (
                      <p className="text-xs text-primary font-medium">{formatCurrency(totalCost)} total</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* BYO Linen toggle */}
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            byoLinen ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
          onClick={() => onChange({ byo_linen: !byoLinen })}
        >
          <input
            id="byo_linen"
            type="checkbox"
            checked={byoLinen}
            onChange={(e) => onChange({ byo_linen: e.target.checked })}
            className="rounded border-gray-300 text-primary shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          <div>
            <label htmlFor="byo_linen" className="text-sm font-medium text-gray-700 cursor-pointer">
              I will bring my own linen (−$25 discount)
            </label>
            {byoLinen && nights > 0 && (
              <p className="text-xs text-primary mt-0.5">Saving: {formatCurrency(25)} on this booking</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
