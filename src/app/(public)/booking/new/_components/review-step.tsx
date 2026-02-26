'use client';

import type { BookingFormState, SpaceOption, RoomTypeOption, MealPriceOption } from '../booking-form';
import { ROOM_DISPLAY_NAMES } from '../_constants';
import { formatCurrency, groupLineItemsByCategory } from '@/lib/pricing/utils';
import type { PricingResult } from '@/lib/pricing/types';
import { useState } from 'react';

const TERMS = `1. BOOKING CONFIRMATION
Your booking is not confirmed until you receive written confirmation from Holy Cross Centre staff. Submission of this form is a request only.

2. PAYMENT
An invoice will be issued upon confirmation. Payment is due 30 days prior to arrival unless otherwise agreed. Bookings made within 30 days require payment in full at time of confirmation.

3. CANCELLATION
Cancellations made more than 30 days before arrival: full refund less a $100 administration fee.
Cancellations 14–30 days before arrival: 50% of the total booking cost is forfeited.
Cancellations less than 14 days before arrival: 100% of the total booking cost is forfeited.

4. DAMAGE & CONDUCT
Guests are responsible for any damage caused to the Centre's property. Holy Cross Centre reserves the right to ask any guests to leave who are not conducting themselves appropriately.

5. CHILD SAFETY
Holy Cross Centre is committed to the safety of all children. Groups with children must comply with our Child Safety Policy available on request.

6. LIABILITY
Holy Cross Centre accepts no liability for loss, injury, or damage to persons or property except where caused by our negligence.

7. VARIATIONS
Holy Cross Centre reserves the right to alter or substitute facilities in exceptional circumstances.`;

interface ReviewStepProps {
  formState: BookingFormState;
  spaces: SpaceOption[];
  roomTypes: RoomTypeOption[];
  mealPrices: MealPriceOption[];
  pricing: PricingResult | null;
  pricingLoading: boolean;
  onChange: (updates: Partial<BookingFormState>) => void;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="px-4 py-3 space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function formatDateDisplay(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function ReviewStep({
  formState, spaces, roomTypes, pricing, pricingLoading, onChange,
}: ReviewStepProps) {
  const [termsOpen, setTermsOpen] = useState(false);

  const selectedSpaceNames = (formState.selected_spaces ?? [])
    .map((id) => spaces.find((s) => s.id === id)?.name ?? id)
    .join(', ');

  const nights = formState.arrival_date && formState.departure_date
    ? Math.max(0, Math.round(
        (new Date(formState.departure_date).getTime() - new Date(formState.arrival_date).getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 0;

  const grouped = pricing ? groupLineItemsByCategory(pricing.line_items) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Submit</h2>
        <p className="text-sm text-gray-500">Please review your booking details before submitting.</p>
      </div>

      {/* Contact */}
      <SectionCard title="Contact Details">
        <ReviewRow label="Type" value={formState.booking_type} />
        {formState.organization && <ReviewRow label="Organisation" value={formState.organization} />}
        <ReviewRow label="Name" value={formState.contact_name} />
        <ReviewRow label="Email" value={formState.contact_email} />
        <ReviewRow label="Phone" value={formState.contact_phone} />
      </SectionCard>

      {/* Event */}
      <SectionCard title="Event Details">
        {formState.event_type && <ReviewRow label="Event Type" value={formState.event_type} />}
        <ReviewRow label="Arrival" value={formState.arrival_date ? formatDateDisplay(formState.arrival_date) : '—'} />
        <ReviewRow label="Departure" value={formState.departure_date ? formatDateDisplay(formState.departure_date) : '—'} />
        <ReviewRow label="Duration" value={nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : 'Same day'} />
        <ReviewRow label="Guests" value={formState.headcount} />
        {formState.minors && <ReviewRow label="Minors" value="Includes children / care requirements" />}
      </SectionCard>

      {/* Venue */}
      <SectionCard title="Venue">
        {formState.whole_centre ? (
          <ReviewRow label="Venue" value="Exclusive use — Whole Centre" />
        ) : (
          <ReviewRow label="Spaces" value={selectedSpaceNames || 'None selected'} />
        )}
      </SectionCard>

      {/* Accommodation */}
      {formState.is_overnight && (
        <SectionCard title="Accommodation">
          {(formState.rooms ?? []).length > 0 ? (
            <>
              {(formState.rooms ?? []).map((r) => {
                const rt = roomTypes.find((x) => x.id === r.room_type_id);
                return (
                  <ReviewRow
                    key={r.room_type_id}
                    label={ROOM_DISPLAY_NAMES[rt?.name ?? ''] ?? rt?.name ?? r.room_type_id}
                    value={`${r.quantity} room${r.quantity !== 1 ? 's' : ''}`}
                  />
                );
              })}
              {formState.byo_linen && <ReviewRow label="Linen" value="BYO (−$25/bed discount)" />}
            </>
          ) : (
            <p className="text-sm text-gray-500">No rooms selected</p>
          )}
        </SectionCard>
      )}

      {/* Catering */}
      {formState.catering_required && (
        <SectionCard title="Catering">
          {(formState.meals ?? []).length > 0 ? (
            <div className="space-y-1">
              {(formState.meals ?? []).map((m, i) => (
                <ReviewRow
                  key={i}
                  label={`${m.meal_type} (${new Date(m.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`}
                  value={`${m.headcount} serves`}
                />
              ))}
              {(formState.coffee_sessions ?? []).map((c, i) => (
                <ReviewRow
                  key={`coffee-${i}`}
                  label={`Coffee w/ ${c.session} (${new Date(c.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`}
                  value={`${c.quantity} serves`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No meals selected</p>
          )}
        </SectionCard>
      )}

      {/* Pricing breakdown */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Estimated Pricing</h3>
        </div>
        <div className="px-4 py-3">
          {pricingLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
              Calculating...
            </div>
          ) : pricing && grouped ? (
            <div className="space-y-3">
              {Object.entries(grouped).map(([category, items]) => {
                if (items.length === 0) return null;
                const subtotal = items.reduce((s, i) => s + (i.discounted_total ?? i.total), 0);
                return (
                  <div key={category}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{category}</p>
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-600">{item.item}</span>
                        <span className="text-gray-900">{formatCurrency(item.discounted_total ?? item.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-medium border-t border-gray-100 pt-1 mt-1">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                );
              })}
              <div className="border-t-2 border-gray-200 pt-2 mt-2 flex justify-between font-bold">
                <span>Estimated Total</span>
                <span className="text-primary">{formatCurrency(pricing.total)}</span>
              </div>
              <p className="text-xs text-gray-400">
                This is an estimate only. Final pricing will be confirmed by Holy Cross Centre.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No pricing items selected yet.</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={4}
          value={formState.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Any special requirements, dietary needs, accessibility requests, etc."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          maxLength={2000}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">{(formState.notes ?? '').length}/2000</p>
      </div>

      {/* Terms */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTermsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Terms & Conditions</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${termsOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {termsOpen && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 max-h-48 overflow-y-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{TERMS}</pre>
          </div>
        )}
      </div>

      <div
        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          formState.terms_accepted ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
        }`}
        onClick={() => onChange({ terms_accepted: !formState.terms_accepted })}
      >
        <input
          id="terms_accepted"
          type="checkbox"
          checked={formState.terms_accepted ?? false}
          onChange={(e) => onChange({ terms_accepted: e.target.checked })}
          className="mt-0.5 rounded border-gray-300 text-primary"
          onClick={(e) => e.stopPropagation()}
          required
        />
        <label htmlFor="terms_accepted" className="text-sm text-gray-700 cursor-pointer">
          I have read and agree to the Holy Cross Centre Terms & Conditions *
        </label>
      </div>
    </div>
  );
}
