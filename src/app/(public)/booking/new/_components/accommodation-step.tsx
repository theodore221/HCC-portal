'use client';

import type { BookingFormState, RoomTypeOption } from '../booking-form';
import { formatCurrency } from '@/lib/pricing/utils';
import { ROOM_DISPLAY_NAMES, ROOM_DISPLAY_DESCRIPTIONS } from '../_constants';

interface AccommodationStepProps {
  formState: BookingFormState;
  roomTypes: RoomTypeOption[];
  onChange: (updates: Partial<BookingFormState>) => void;
}

function getNights(arrival: string, departure: string): number {
  if (!arrival || !departure) return 0;
  const a = new Date(arrival);
  const d = new Date(departure);
  return Math.max(0, Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

// Ensuite rooms (Ensuite and Ensuite + Private Study) share a pool of 5 physical rooms.
const ENSUITE_POOL = 5;
const ENSUITE_DB_NAME = 'Double Bed + Ensuite';
const STUDY_DB_NAME = 'Double Bed + Ensuite + Priv Study';

export function AccommodationStep({ formState, roomTypes, onChange }: AccommodationStepProps) {
  const nights = getNights(formState.arrival_date ?? '', formState.departure_date ?? '');
  const rooms = formState.rooms ?? [];
  const byoLinen = formState.byo_linen ?? false;

  const getRoomQty = (roomTypeId: string): number =>
    rooms.find((r) => r.room_type_id === roomTypeId)?.quantity ?? 0;

  const setRoomQty = (roomTypeId: string, qty: number) => {
    const existing = rooms.filter((r) => r.room_type_id !== roomTypeId);
    if (qty > 0) {
      onChange({ rooms: [...existing, { room_type_id: roomTypeId, quantity: qty }] });
    } else {
      onChange({ rooms: existing });
    }
  };

  // Shared ensuite pool calculations
  const ensuiteRt = roomTypes.find((rt) => rt.name === ENSUITE_DB_NAME);
  const studyRt = roomTypes.find((rt) => rt.name === STUDY_DB_NAME);
  const ensuiteQty = getRoomQty(ensuiteRt?.id ?? '');
  const studyQty = getRoomQty(studyRt?.id ?? '');
  const ensuitePoolUsed = ensuiteQty + studyQty;

  // Returns the effective max qty for a room type, accounting for shared ensuite pool.
  const getEffectiveMax = (rt: RoomTypeOption): number => {
    const ownMax = rt.max_qty ?? 99;
    if (rt.name === ENSUITE_DB_NAME) return Math.min(ownMax, ENSUITE_POOL - studyQty);
    if (rt.name === STUDY_DB_NAME) return Math.min(ownMax, ENSUITE_POOL - ensuiteQty);
    return ownMax;
  };

  // Returns a message explaining why a room is fully blocked, or null if available.
  const getPoolBlockedReason = (rt: RoomTypeOption): string | null => {
    if (rt.name !== ENSUITE_DB_NAME && rt.name !== STUDY_DB_NAME) return null;
    const effectiveMax = getEffectiveMax(rt);
    const qty = getRoomQty(rt.id);
    if (effectiveMax === 0 && qty === 0) {
      return `All ${ENSUITE_POOL} ensuite rooms are already selected (${ensuitePoolUsed}/${ENSUITE_POOL} used)`;
    }
    return null;
  };

  const totalRooms = rooms.reduce((sum, r) => sum + r.quantity, 0);
  const totalBedsNights = rooms.reduce((sum, r) => sum + r.quantity * nights, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Accommodation</h2>
        <p className="text-sm text-gray-500">Do you need overnight accommodation?</p>
      </div>

      {/* Overnight toggle */}
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange({ is_overnight: val, rooms: val ? rooms : [] })}
            className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
              formState.is_overnight === val
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {val ? '🛏 Yes, overnight' : '☀️ No, day visit'}
          </button>
        ))}
      </div>

      {formState.is_overnight && (
        <>
          {/* Info callout */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
            <p className="font-medium mb-1">Accommodation info</p>
            <ul className="space-y-0.5 text-xs">
              <li>• Check-in: 2:30 PM &nbsp;|&nbsp; Check-out: 9:00 AM</li>
              <li>• Continental breakfast included for overnight guests</li>
              <li>• Linen provided (or bring your own for a $25/bed discount)</li>
            </ul>
          </div>

          {/* Room type cards */}
          <div className="space-y-3">
            {roomTypes.map((rt) => {
              const qty = getRoomQty(rt.id);
              const effectiveMax = getEffectiveMax(rt);
              const blockedReason = getPoolBlockedReason(rt);
              const isBlocked = blockedReason !== null;
              const linedPrice = byoLinen ? (rt.price ?? 0) - 25 : (rt.price ?? 0);
              const subtotal = linedPrice * qty * nights;

              return (
                <div
                  key={rt.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    isBlocked
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : qty > 0
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold ${isBlocked ? 'text-gray-400' : 'text-gray-900'}`}>
                          {ROOM_DISPLAY_NAMES[rt.name] ?? rt.name}
                        </p>
                        {rt.capacity && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {rt.capacity} person{rt.capacity !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {(ROOM_DISPLAY_DESCRIPTIONS[rt.name] ?? rt.description) && (
                        <p className="text-xs text-gray-500 mt-0.5">{ROOM_DISPLAY_DESCRIPTIONS[rt.name] ?? rt.description}</p>
                      )}
                      {isBlocked ? (
                        <p className="text-xs text-amber-600 mt-1 font-medium">{blockedReason}</p>
                      ) : (
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {formatCurrency(rt.price ?? 0)}/bed/night
                          {byoLinen && (
                            <span className="text-primary ml-1">→ {formatCurrency(linedPrice)} (BYO)</span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setRoomQty(rt.id, Math.max(0, qty - 1))}
                        disabled={isBlocked || qty === 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Decrease ${ROOM_DISPLAY_NAMES[rt.name] ?? rt.name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setRoomQty(rt.id, Math.min(effectiveMax, qty + 1))}
                        disabled={isBlocked || qty >= effectiveMax}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Increase ${ROOM_DISPLAY_NAMES[rt.name] ?? rt.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {qty > 0 && nights > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/20 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {qty} room{qty !== 1 ? 's' : ''} × {nights} night{nights !== 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-semibold text-primary">{formatCurrency(subtotal)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* BYO Linen toggle */}
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              byoLinen ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => onChange({ byo_linen: !byoLinen })}
          >
            <input
              id="byo_linen"
              type="checkbox"
              checked={byoLinen}
              onChange={(e) => onChange({ byo_linen: e.target.checked })}
              className="mt-0.5 rounded border-gray-300 text-primary"
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <label htmlFor="byo_linen" className="text-sm font-medium text-gray-700 cursor-pointer">
                We will bring our own linen (−$25/bed discount)
              </label>
              {byoLinen && totalRooms > 0 && nights > 0 && (
                <p className="text-xs text-primary mt-0.5">
                  Saving: {formatCurrency(25 * totalBedsNights)} on this booking
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
