'use client';

import type { BookingFormState, MealPriceOption } from '../booking-form';
import { formatCurrency } from '@/lib/pricing/utils';

interface CateringStepProps {
  formState: BookingFormState;
  mealPrices: MealPriceOption[];
  onChange: (updates: Partial<BookingFormState>) => void;
}

// All meal types in display order
const MEAL_TYPES = [
  'Breakfast',
  'Morning Tea',
  'Lunch',
  'Afternoon Tea',
  'Dinner',
  'Dessert',
] as const;

type MealType = typeof MEAL_TYPES[number];

function getDatesInRange(arrival: string, departure: string): string[] {
  if (!arrival || !departure) return [];
  const dates: string[] = [];
  const current = new Date(arrival);
  const end = new Date(departure);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Meal types that show a "Percolated Coffee" toggle
const COFFEE_MEAL_TYPES: MealType[] = ['Morning Tea', 'Afternoon Tea'];

export function CateringStep({ formState, mealPrices, onChange }: CateringStepProps) {
  const dates = getDatesInRange(formState.arrival_date ?? '', formState.departure_date ?? '');
  const meals = formState.meals ?? [];
  const coffeeSessions = formState.coffee_sessions ?? [];
  const defaultHeadcount = formState.headcount ?? 1;

  const getMealQty = (date: string, mealType: string): number => {
    return meals.find((m) => m.date === date && m.meal_type === mealType)?.headcount ?? 0;
  };

  const setMealQty = (date: string, mealType: string, qty: number) => {
    const filtered = meals.filter((m) => !(m.date === date && m.meal_type === mealType));
    if (qty > 0) {
      onChange({ meals: [...filtered, { date, meal_type: mealType, headcount: qty }] });
    } else {
      onChange({ meals: filtered });
    }
  };

  const getCoffeeQty = (date: string, mealType: string): number => {
    return coffeeSessions.find((c) => c.date === date && c.session === mealType)?.quantity ?? 0;
  };

  const setCoffeeQty = (date: string, mealType: string, qty: number) => {
    const filtered = coffeeSessions.filter((c) => !(c.date === date && c.session === mealType));
    if (qty > 0) {
      onChange({ coffee_sessions: [...filtered, { date, session: mealType, quantity: qty }] });
    } else {
      onChange({ coffee_sessions: filtered });
    }
  };

  const getMealPrice = (mealType: string): number =>
    mealPrices.find((m) => m.meal_type === mealType)?.price ?? 0;

  const COFFEE_PRICE = 3;

  // Pre-fill all meals for a date with default headcount
  const prefillDate = (date: string) => {
    const newMeals = [...meals.filter((m) => m.date !== date)];
    MEAL_TYPES.forEach((mt) => {
      newMeals.push({ date, meal_type: mt, headcount: defaultHeadcount });
    });
    onChange({ meals: newMeals });
  };

  // Clear all meals for a date
  const clearDate = (date: string) => {
    onChange({
      meals: meals.filter((m) => m.date !== date),
      coffee_sessions: coffeeSessions.filter((c) => c.date !== date),
    });
  };

  const hasAnyMealOnDate = (date: string) =>
    MEAL_TYPES.some((mt) => getMealQty(date, mt) > 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Catering</h2>
        <p className="text-sm text-gray-500">Do you require catering for your event?</p>
      </div>

      {/* Catering toggle */}
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((val) => (
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
            {val ? '🍽 Yes, catering required' : '🥡 No, self-catered'}
          </button>
        ))}
      </div>

      {formState.catering_required && (
        <>
          {/* Info callout */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
            <p className="font-medium mb-1">Meal times</p>
            <ul className="text-xs space-y-0.5">
              <li>• Breakfast: 6:00 AM &nbsp;|&nbsp; Morning Tea: 10:00 AM</li>
              <li>• Lunch: 12:00 PM &nbsp;|&nbsp; Afternoon Tea: 3:00 PM</li>
              <li>• Dinner: 6:00–8:00 PM &nbsp;|&nbsp; Dessert: with dinner</li>
            </ul>
            {formState.is_overnight && (
              <p className="text-xs mt-1 text-primary/80">
                Note: Continental breakfast is complimentary for overnight guests — only enter breakfast serves if you want a catered breakfast.
              </p>
            )}
          </div>

          {dates.length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Please set your arrival and departure dates first.
            </p>
          ) : (
            <div className="space-y-4">
              {dates.map((date) => {
                const hasAny = hasAnyMealOnDate(date);
                return (
                  <div key={date} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Date header */}
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <span className="text-sm font-semibold text-gray-800">{formatDateLabel(date)}</span>
                      <div className="flex gap-2">
                        {!hasAny && (
                          <button
                            type="button"
                            onClick={() => prefillDate(date)}
                            className="text-xs text-primary hover:underline"
                          >
                            Fill all ({defaultHeadcount})
                          </button>
                        )}
                        {hasAny && (
                          <button
                            type="button"
                            onClick={() => clearDate(date)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meal rows */}
                    <div className="divide-y divide-gray-100">
                      {MEAL_TYPES.map((mealType) => {
                        const qty = getMealQty(date, mealType);
                        const price = getMealPrice(mealType);
                        const isCoffeeMeal = (COFFEE_MEAL_TYPES as readonly string[]).includes(mealType);
                        const coffeeQty = isCoffeeMeal ? getCoffeeQty(date, mealType) : 0;

                        return (
                          <div key={mealType} className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              {/* Meal type + price */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-700 font-medium">{mealType}</span>
                                  <span className="text-xs text-gray-400">{formatCurrency(price)}/serve</span>
                                </div>
                              </div>

                              {/* Serves input */}
                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-xs text-gray-500 hidden sm:block">Serves:</label>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setMealQty(date, mealType, Math.max(0, qty - 1))}
                                    disabled={qty === 0}
                                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-500 text-xs hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label={`Decrease ${mealType}`}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    max={200}
                                    value={qty === 0 ? '' : qty}
                                    onChange={(e) => setMealQty(date, mealType, Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    placeholder="0"
                                    className="w-14 text-center text-sm border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    aria-label={`${mealType} serves on ${date}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setMealQty(date, mealType, Math.min(200, qty + 1))}
                                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-500 text-xs hover:bg-gray-100"
                                    aria-label={`Increase ${mealType}`}
                                  >
                                    +
                                  </button>
                                </div>
                                {qty > 0 && (
                                  <span className="text-xs text-primary font-medium w-16 text-right hidden sm:block">
                                    {formatCurrency(qty * price)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Percolated Coffee sub-row */}
                            {isCoffeeMeal && qty > 0 && (
                              <div className="mt-2 ml-2 pl-3 border-l-2 border-amber-200">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500 flex-1">
                                    ☕ Percolated coffee ({formatCurrency(COFFEE_PRICE)}/serve)
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setCoffeeQty(date, mealType, Math.max(0, coffeeQty - 1))}
                                      disabled={coffeeQty === 0}
                                      className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center text-gray-500 text-xs hover:bg-gray-100 disabled:opacity-30"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      max={200}
                                      value={coffeeQty === 0 ? '' : coffeeQty}
                                      onChange={(e) => setCoffeeQty(date, mealType, Math.max(0, parseInt(e.target.value, 10) || 0))}
                                      placeholder="0"
                                      className="w-12 text-center text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setCoffeeQty(date, mealType, Math.min(200, coffeeQty + 1))}
                                      className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center text-gray-500 text-xs hover:bg-gray-100"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
