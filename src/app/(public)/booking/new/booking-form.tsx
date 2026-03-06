/**
 * Multi-Step Booking Form
 * Group: 6-step wizard (Contact → Event & Dates → Venue → Accommodation → Catering → Review)
 * Individual: 4-step wizard (Your Details → Dates & Room → Catering → Review & Confirm)
 */

'use client';

import { useState, useTransition, useCallback } from 'react';
import { submitBooking, calculatePricingPreview } from './actions';
import { HoneypotField, HONEYPOT_FIELDS, generateTimeToken } from '@/lib/security/client';
import type { PricingResult } from '@/lib/pricing/types';

import { BookingTypeGateway } from './_components/booking-type-gateway';
import { StepIndicator } from './_components/step-indicator';
import { ContactStep } from './_components/contact-step';
import { EventStep } from './_components/event-step';
import { VenueStep } from './_components/venue-step';
import { AccommodationStep } from './_components/accommodation-step';
import { CateringStep } from './_components/catering-step';
import { ReviewStep } from './_components/review-step';
import { IndividualStayStep } from './_components/individual-stay-step';
import { IndividualCateringStep } from './_components/individual-catering-step';
import { IndividualReviewStep } from './_components/individual-review-step';
import { PricingSidebar } from './_components/pricing-sidebar';

// ─── Data types passed from server ───────────────────────────────────────────

export interface SpaceOption {
  id: string;
  name: string;
  capacity: number | null;
  price: number | null;
}

export interface RoomTypeOption {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  capacity: number | null;
  max_qty?: number;
}

export interface MealPriceOption {
  meal_type: string;
  price: number;
}

// ─── Form state ───────────────────────────────────────────────────────────────

export interface MealEntry {
  date: string;
  meal_type: string;
  headcount: number;
}

export interface RoomEntry {
  room_type_id: string;
  quantity: number;
}

export interface CoffeeSession {
  date: string;
  session: string; // 'Morning Tea' | 'Afternoon Tea'
  quantity: number;
}

export interface BookingFormState {
  // Step 1
  booking_type?: 'Group' | 'Individual';
  organization?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;

  // Step 2
  event_type?: string;
  arrival_date?: string;
  departure_date?: string;
  arrival_time?: string;
  departure_time?: string;
  headcount?: number;
  minors?: boolean;

  // Step 3
  whole_centre?: boolean;
  selected_spaces?: string[];

  // Step 4
  is_overnight?: boolean;
  rooms?: RoomEntry[];
  byo_linen?: boolean;

  // Step 5
  catering_required?: boolean;
  meals?: MealEntry[];
  coffee_sessions?: CoffeeSession[];

  // Step 6
  notes?: string;
  terms_accepted?: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingFormProps {
  csrfToken: string;
  spaces: SpaceOption[];
  roomTypes: RoomTypeOption[];
  mealPrices: MealPriceOption[];
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const GROUP_STEPS = ['Contact', 'Event & Dates', 'Venue', 'Accommodation', 'Catering', 'Review'];
const INDIVIDUAL_STEPS = ['Your Details', 'Dates & Room', 'Catering', 'Review & Confirm'];

// Steps where pricing sidebar is shown (1-indexed)
const GROUP_PRICING_STEPS = [3, 4, 5, 6];
const INDIVIDUAL_PRICING_STEPS = [2, 3, 4];

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateGroupStep(step: number, state: BookingFormState): string | null {
  switch (step) {
    case 1:
      if (!state.booking_type) return 'Please select a booking type.';
      if (state.booking_type === 'Group' && !state.organization?.trim()) return 'Organisation name is required.';
      if (!state.contact_name?.trim() || state.contact_name.length < 2) return 'Contact name must be at least 2 characters.';
      if (!state.contact_email?.trim() || !state.contact_email.includes('@')) return 'A valid email address is required.';
      if (!state.contact_phone?.trim() || state.contact_phone.length < 6) return 'A valid phone number is required.';
      return null;
    case 2:
      if (!state.event_type) return 'Please select an event type.';
      if (!state.arrival_date) return 'Arrival date is required.';
      if (!state.departure_date) return 'Departure date is required.';
      if (state.arrival_date && state.departure_date && state.departure_date < state.arrival_date)
        return 'Departure date must be on or after arrival date.';
      if (!state.headcount || state.headcount < 1) return 'Please enter the number of guests.';
      return null;
    case 3:
      if (!state.whole_centre && (!state.selected_spaces || state.selected_spaces.length === 0))
        return 'Please select at least one space, or choose exclusive whole-centre use.';
      return null;
    case 4:
      if (state.is_overnight === undefined) return 'Please indicate whether you require overnight accommodation.';
      return null;
    case 5:
      if (state.catering_required === undefined) return 'Please indicate whether you require catering.';
      return null;
    case 6:
      if (!state.terms_accepted) return 'You must accept the Terms & Conditions to submit.';
      return null;
    default:
      return null;
  }
}

function validateIndividualStep(step: number, state: BookingFormState): string | null {
  switch (step) {
    case 1:
      if (!state.contact_name?.trim() || state.contact_name.length < 2) return 'Full name must be at least 2 characters.';
      if (!state.contact_email?.trim() || !state.contact_email.includes('@')) return 'A valid email address is required.';
      if (!state.contact_phone?.trim() || state.contact_phone.length < 6) return 'A valid phone number is required.';
      return null;
    case 2:
      if (!state.arrival_date) return 'Arrival date is required.';
      if (!state.departure_date) return 'Departure date is required.';
      if (state.arrival_date && state.departure_date && state.departure_date < state.arrival_date)
        return 'Departure date must be on or after arrival date.';
      if (!state.rooms || state.rooms.length === 0) return 'Please select a room for your stay.';
      return null;
    case 3:
      if (state.catering_required === undefined) return 'Please indicate whether you require catering.';
      return null;
    case 4:
      if (!state.terms_accepted) return 'You must accept the Terms & Conditions to submit.';
      return null;
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingForm({ csrfToken, spaces, roomTypes, mealPrices }: BookingFormProps) {
  // Gateway: shown before the wizard until user picks booking type
  const [gatewayComplete, setGatewayComplete] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<BookingFormState>({
    minors: false,
    whole_centre: false,
    is_overnight: undefined,
    catering_required: undefined,
    rooms: [],
    meals: [],
    coffee_sessions: [],
    selected_spaces: [],
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; reference?: string; error?: string } | null>(null);
  const [timeToken] = useState(() => generateTimeToken());
  const [isPending, startTransition] = useTransition();

  // Pricing state
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const isIndividual = formState.booking_type === 'Individual';
  const steps = isIndividual ? INDIVIDUAL_STEPS : GROUP_STEPS;
  const pricingSteps = isIndividual ? INDIVIDUAL_PRICING_STEPS : GROUP_PRICING_STEPS;
  const totalSteps = steps.length;

  const updateForm = useCallback((updates: Partial<BookingFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const refreshPricing = useCallback(async (state: BookingFormState) => {
    setPricingLoading(true);
    try {
      const result = await calculatePricingPreview(state);
      if (result.success && result.pricing) {
        setPricing(result.pricing);
      }
    } catch {
      // Silently fail — pricing is display-only
    } finally {
      setPricingLoading(false);
    }
  }, []);

  // Handle gateway selection
  const handleGatewaySelect = (type: 'Group' | 'Individual') => {
    const individualDefaults: Partial<BookingFormState> =
      type === 'Individual'
        ? { headcount: 1, minors: false, whole_centre: false, selected_spaces: [], is_overnight: true }
        : {};
    setFormState((prev) => ({ ...prev, booking_type: type, ...individualDefaults }));
    setGatewayComplete(true);
  };

  const handleNext = async () => {
    const validate = isIndividual ? validateIndividualStep : validateGroupStep;
    const error = validate(currentStep, formState);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);

    const nextStep = currentStep + 1;

    // Refresh pricing when entering pricing-visible steps
    const pricingThreshold = isIndividual ? 2 : 3;
    if (nextStep >= pricingThreshold) {
      refreshPricing(formState);
    }

    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStepError(null);
    setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToGateway = () => {
    setStepError(null);
    setGatewayComplete(false);
    setCurrentStep(1);
    setFormState({
      minors: false,
      whole_centre: false,
      is_overnight: undefined,
      catering_required: undefined,
      rooms: [],
      meals: [],
      coffee_sessions: [],
      selected_spaces: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validate = isIndividual ? validateIndividualStep : validateGroupStep;
    const error = validate(totalSteps, formState);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);

    startTransition(async () => {
      const result = await submitBooking(formState, csrfToken, timeToken);
      setSubmitResult(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Success screen
  if (submitResult?.success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isIndividual ? 'Your retreat is booked!' : 'Booking Submitted!'}
          </h2>
          <p className="text-gray-700 mb-4">
            Your booking reference is{' '}
            <strong className="font-mono bg-primary/10 px-2 py-0.5 rounded">{submitResult.reference}</strong>
          </p>
          <p className="text-sm text-gray-600">
            We&apos;ve sent a confirmation to <strong>{formState.contact_email}</strong>.
            Our team will review your booking and get back to you shortly.
          </p>
        </div>
      </div>
    );
  }

  // Gateway screen
  if (!gatewayComplete) {
    return <BookingTypeGateway onSelect={handleGatewaySelect} />;
  }

  const showSidebar = pricingSteps.includes(currentStep);

  return (
    <div className={`max-w-6xl mx-auto ${showSidebar ? 'lg:grid lg:grid-cols-3 lg:gap-6' : ''}`}>
      {/* Main form area */}
      <div className={showSidebar ? 'lg:col-span-2' : 'max-w-2xl mx-auto w-full'}>
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Global error */}
        {submitResult?.error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-800">{submitResult.error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <HoneypotField name={HONEYPOT_FIELDS.booking} />
          <input type="hidden" name="_form_time" value={timeToken} />
          <input type="hidden" name="_csrf" value={csrfToken} />

          {/* ─── Individual flow ─── */}
          {isIndividual && (
            <>
              {currentStep === 1 && (
                <ContactStep formState={formState} onChange={updateForm} hideBookingTypeToggle />
              )}
              {currentStep === 2 && (
                <IndividualStayStep formState={formState} roomTypes={roomTypes} onChange={updateForm} />
              )}
              {currentStep === 3 && (
                <IndividualCateringStep formState={formState} mealPrices={mealPrices} onChange={updateForm} />
              )}
              {currentStep === 4 && (
                <IndividualReviewStep
                  formState={formState}
                  roomTypes={roomTypes}
                  mealPrices={mealPrices}
                  pricing={pricing}
                  pricingLoading={pricingLoading}
                  onChange={updateForm}
                />
              )}
            </>
          )}

          {/* ─── Group flow ─── */}
          {!isIndividual && (
            <>
              {currentStep === 1 && (
                <ContactStep formState={formState} onChange={updateForm} />
              )}
              {currentStep === 2 && (
                <EventStep formState={formState} onChange={updateForm} />
              )}
              {currentStep === 3 && (
                <VenueStep formState={formState} spaces={spaces} onChange={updateForm} />
              )}
              {currentStep === 4 && (
                <AccommodationStep formState={formState} roomTypes={roomTypes} onChange={updateForm} />
              )}
              {currentStep === 5 && (
                <CateringStep formState={formState} mealPrices={mealPrices} onChange={updateForm} />
              )}
              {currentStep === 6 && (
                <ReviewStep
                  formState={formState}
                  spaces={spaces}
                  roomTypes={roomTypes}
                  mealPrices={mealPrices}
                  pricing={pricing}
                  pricingLoading={pricingLoading}
                  onChange={updateForm}
                />
              )}
            </>
          )}

          {/* Step error */}
          {stepError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-800">{stepError}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-5 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBackToGateway}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change booking type
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50 transition-colors"
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Booking
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Pricing sidebar (steps with pricing) */}
      {showSidebar && (
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <PricingSidebar pricing={pricing} loading={pricingLoading} />
          </div>
        </div>
      )}

      {/* Mobile pricing summary (collapsible) */}
      {showSidebar && (
        <div className="lg:hidden mt-4">
          <details className="border border-gray-200 rounded-xl overflow-hidden">
            <summary className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer">
              View estimated pricing
              {pricing && (
                <span className="ml-2 text-primary font-semibold">
                  {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(pricing.total)}
                </span>
              )}
            </summary>
            <div className="p-4">
              <PricingSidebar pricing={pricing} loading={pricingLoading} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
