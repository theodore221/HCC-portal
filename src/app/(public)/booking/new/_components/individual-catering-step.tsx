'use client';

import { useState } from 'react';
import type { BookingFormState, MealPriceOption } from '../booking-form';
import { formatCurrency } from '@/lib/pricing/utils';
import { MEAL_COLORS } from '@/lib/catering';

const MEAL_TYPES = ['Breakfast', 'Morning Tea', 'Lunch', 'Afternoon Tea', 'Dinner', 'Dessert'] as const;
type MealType = typeof MEAL_TYPES[number];

interface IndividualCateringStepProps {
  formState: BookingFormState;
  mealPrices: MealPriceOption[];
  onChange: (updates: Partial<BookingFormState>) => void;
}

// Preset shortcuts
const PRESETS: { label: string; meals: MealType[] }[] = [
  { label: 'All Meals', meals: ['Breakfast', 'Morning Tea', 'Lunch', 'Afternoon Tea', 'Dinner', 'Dessert'] },
  { label: 'Meals Only', meals: ['Breakfast', 'Lunch', 'Dinner'] },
  { label: 'Lunch & Dinner', meals: ['Lunch', 'Dinner'] },
];

function getDatesInRange(arrival: string, departure: string): string[] {
  if (!arrival || !departure) return [];
  const dates: string[] = [];
  const [ay, am, ad] = arrival.split('-').map(Number);
  const [dy, dm, dd] = departure.split('-').map(Number);
  const current = new Date(ay, am - 1, ad);
  const end = new Date(dy, dm - 1, dd);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateLabel(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function IndividualCateringStep({ formState, mealPrices, onChange }: IndividualCateringStepProps) {
  const [perDayOpen, setPerDayOpen] = useState(true);

  const dates = getDatesInRange(formState.arrival_date ?? '', formState.departure_date ?? '');
  const meals = formState.meals ?? [];
  const coffeeSessions = formState.coffee_sessions ?? [];

  const getMealPrice = (mealType: string): number =>
    mealPrices.find((m) => m.meal_type === mealType)?.price ?? 0;

  // Which meal types are enabled on ALL days
  const enabledMeals = new Set<MealType>(
    MEAL_TYPES.filter((mt) =>
      dates.length > 0 && dates.every((date) => meals.some((m) => m.date === date && m.meal_type === mt && m.headcount > 0))
    )
  );

  // Which meal types are on some but not all days
  const partialMeals = new Set<MealType>(
    MEAL_TYPES.filter((mt) =>
      !enabledMeals.has(mt) &&
      dates.some((date) => meals.some((m) => m.date === date && m.meal_type === mt && m.headcount > 0))
    )
  );

  const toggleMealType = (mealType: MealType) => {
    const isActive = enabledMeals.has(mealType) || partialMeals.has(mealType);
    if (isActive) {
      onChange({ meals: meals.filter((m) => m.meal_type !== mealType) });
    } else {
      const filtered = meals.filter((m) => m.meal_type !== mealType);
      const newMeals = [...filtered, ...dates.map((date) => ({ date, meal_type: mealType, headcount: 1 }))];
      onChange({ meals: newMeals });
    }
  };

  const applyPreset = (mealList: MealType[]) => {
    const filtered = meals.filter((m) => !MEAL_TYPES.includes(m.meal_type as MealType));
    const newMeals = [
      ...filtered,
      ...mealList.flatMap((mt) => dates.map((date) => ({ date, meal_type: mt, headcount: 1 }))),
    ];
    onChange({ meals: newMeals });
  };

  // Per-day overrides
  const getMealOnDate = (date: string, mealType: string): boolean =>
    meals.some((m) => m.date === date && m.meal_type === mealType && m.headcount > 0);

  const toggleMealOnDate = (date: string, mealType: string) => {
    if (getMealOnDate(date, mealType)) {
      onChange({ meals: meals.filter((m) => !(m.date === date && m.meal_type === mealType)) });
    } else {
      onChange({ meals: [...meals, { date, meal_type: mealType, headcount: 1 }] });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Meals during your stay</h2>
        <p className="text-sm text-gray-500">Choose which meals you&apos;d like us to prepare.</p>
      </div>

      {/* Catering toggle */}
      <div className="grid grid-cols-2 gap-3">
        {([true, false] as const).map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange({ catering_required: val, meals: val ? meals : [], coffee_sessions: val ? coffeeSessions : [] })}
            className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
              formState.catering_required === val
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {val ? 'Yes, please prepare meals' : "No, I'll self-cater"}
          </button>
        ))}
      </div>

      {formState.catering_required && (
        <>
          {dates.length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Please set your arrival and departure dates first.
            </p>
          ) : (
            <>
              {/* Meal times info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
                <p className="font-medium mb-1">Meal times</p>
                <ul className="text-xs space-y-0.5">
                  <li>• Breakfast: 6:00 AM &nbsp;|&nbsp; Morning Tea: 10:00 AM</li>
                  <li>• Lunch: 12:00 PM &nbsp;|&nbsp; Afternoon Tea: 3:00 PM</li>
                  <li>• Dinner: 6:00–8:00 PM &nbsp;|&nbsp; Dessert: with dinner</li>
                </ul>
                <p className="text-xs mt-1 text-primary/80">
                  Note: Continental breakfast is complimentary — only select breakfast if you want a catered breakfast.
                </p>
              </div>

              {/* Preset shortcuts */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.meals)}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal type chips */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Select meals for your stay</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MEAL_TYPES.map((mealType) => {
                    const isActive = enabledMeals.has(mealType);
                    const isPartial = partialMeals.has(mealType);
                    const colored = isActive || isPartial;
                    const hex = MEAL_COLORS[mealType]?.hex ?? '#6b7280';
                    const price = getMealPrice(mealType);

                    return (
                      <button
                        key={mealType}
                        type="button"
                        onClick={() => toggleMealType(mealType)}
                        className="rounded-xl border-2 px-3 py-3 text-left transition-all"
                        style={
                          colored
                            ? { backgroundColor: hex, borderColor: hex }
                            : { borderColor: hex + '30', backgroundColor: hex + '0A' }
                        }
                      >
                        <p
                          className="text-xs font-semibold"
                          style={colored ? { color: 'white' } : { color: hex }}
                        >
                          {mealType}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={colored ? { color: 'rgba(255,255,255,0.70)' } : { color: hex, opacity: 0.7 }}
                        >
                          {formatCurrency(price)}/serve
                        </p>
                      </button>
                    );
                  })}
                </div>
                {dates.length > 1 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Selections apply to all {dates.length} days of your stay.
                  </p>
                )}
              </div>

              {/* Stay Meal Schedule */}
              {dates.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPerDayOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <span>Stay Meal Schedule</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${perDayOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {perDayOpen && (
                    <div className="border-t border-gray-200">
                      {dates.map((date) => (
                        <div key={date} className="px-4 py-3 border-b border-gray-100 last:border-0">
                          <p className="text-xs font-semibold text-gray-600 mb-2">{formatDateLabel(date)}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {MEAL_TYPES.map((mt) => {
                              const has = getMealOnDate(date, mt);
                              const hex = MEAL_COLORS[mt]?.hex ?? '#6b7280';
                              return (
                                <button
                                  key={mt}
                                  type="button"
                                  onClick={() => toggleMealOnDate(date, mt)}
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                    !has ? 'border-gray-200 text-gray-500 hover:border-gray-300' : ''
                                  }`}
                                  style={has ? { backgroundColor: hex, borderColor: hex, color: 'white' } : undefined}
                                >
                                  {mt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Catering cost estimate */}
              {meals.length > 0 && (() => {
                // Group by meal type: count occurrences and compute subtotal
                const byType = MEAL_TYPES.map((mt) => {
                  const count = meals.filter((m) => m.meal_type === mt).length;
                  if (count === 0) return null;
                  const price = getMealPrice(mt);
                  return { label: mt, count, subtotal: price * count };
                }).filter(Boolean) as { label: string; count: number; subtotal: number }[];

                const total = byType.reduce((sum, row) => sum + row.subtotal, 0);

                return (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700">Estimated catering cost</h3>
                    </div>
                    <div className="px-4 py-3 space-y-1">
                      {byType.map((row) => (
                        <div key={row.label} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {row.label}
                            <span className="text-gray-400 ml-1">× {row.count} {row.count === 1 ? 'day' : 'days'}</span>
                          </span>
                          <span className="text-gray-900">{formatCurrency(row.subtotal)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-200 font-semibold">
                        <span className="text-sm text-gray-700">Total</span>
                        <span className="text-sm text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
}
