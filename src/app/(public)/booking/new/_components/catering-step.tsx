'use client';

import React, { useState } from 'react';
import type { BookingFormState, MealPriceOption } from '../booking-form';
import { formatCurrency } from '@/lib/pricing/utils';
import { MEAL_COLORS } from '@/lib/catering';

interface CateringStepProps {
  formState: BookingFormState;
  mealPrices: MealPriceOption[];
  onChange: (updates: Partial<BookingFormState>) => void;
}

const MEAL_TYPES = [
  'Breakfast',
  'Morning Tea',
  'Lunch',
  'Afternoon Tea',
  'Dinner',
  'Dessert',
] as const;

type MealType = typeof MEAL_TYPES[number];

const MEAL_ABBR: Record<string, string> = {
  'Breakfast':     'Bfast',
  'Morning Tea':   'M.Tea',
  'Lunch':         'Lunch',
  'Afternoon Tea': 'A.Tea',
  'Dinner':        'Dinner',
  'Dessert':       'Dessert',
};

const MEAL_TIME_LABELS: Record<string, string> = {
  'Breakfast':     '7:30 AM',
  'Morning Tea':   '10:30 AM',
  'Lunch':         '12:30 PM',
  'Afternoon Tea': '3:00 PM',
  'Dinner':        '6:00 PM',
  'Dessert':       '7:30 PM',
};

const GROUP_PRESETS: { label: string; meals: MealType[] }[] = [
  { label: 'Full Board', meals: ['Breakfast', 'Morning Tea', 'Lunch', 'Afternoon Tea', 'Dinner', 'Dessert'] },
  { label: 'Main Meals', meals: ['Breakfast', 'Lunch', 'Dinner'] },
  { label: 'Lunch & Dinner', meals: ['Lunch', 'Dinner'] },
];

const COFFEE_MEAL_TYPES: MealType[] = ['Morning Tea', 'Afternoon Tea'];
const COFFEE_PRICE = 3;
const COFFEE_HEX = '#b07c5c'; // warm terracotta, earthy botanical tone distinct from all meal colors

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
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function CateringStep({ formState, mealPrices, onChange }: CateringStepProps) {
  const dates = getDatesInRange(formState.arrival_date ?? '', formState.departure_date ?? '');
  const [perDayOpen, setPerDayOpen] = useState(true);
  const [costOpen, setCostOpen] = useState(false);

  const meals = formState.meals ?? [];
  const coffeeSessions = formState.coffee_sessions ?? [];
  const defaultHeadcount = formState.headcount ?? 1;

  const getMealPrice = (mealType: string): number =>
    mealPrices.find((m) => m.meal_type === mealType)?.price ?? 0;

  const getMealQty = (date: string, mealType: string): number =>
    meals.find((m) => m.date === date && m.meal_type === mealType)?.headcount ?? 0;

  // Toggle a meal type on/off across all dates
  const toggleGlobalMeal = (mealType: string, currentlyActive: boolean) => {
    const filtered = meals.filter((m) => m.meal_type !== mealType);
    if (currentlyActive) {
      const filteredCoffee = (COFFEE_MEAL_TYPES as readonly string[]).includes(mealType)
        ? coffeeSessions.filter((c) => c.session !== mealType)
        : coffeeSessions;
      onChange({ meals: filtered, coffee_sessions: filteredCoffee });
    } else {
      const newMeals = [...filtered, ...dates.map((date) => ({ date, meal_type: mealType, headcount: defaultHeadcount }))];
      onChange({ meals: newMeals });
    }
  };

  // Apply a preset: set listed meals to defaultHeadcount, remove all others
  const applyPreset = (mealList: MealType[]) => {
    const filteredMeals = meals.filter((m) => !MEAL_TYPES.includes(m.meal_type as MealType));
    const newMeals = [
      ...filteredMeals,
      ...mealList.flatMap((mt) => dates.map((date) => ({ date, meal_type: mt, headcount: defaultHeadcount }))),
    ];
    const removedTeas = COFFEE_MEAL_TYPES.filter((t) => !mealList.includes(t));
    const filteredCoffee = coffeeSessions.filter((c) => !removedTeas.includes(c.session as MealType));
    onChange({ meals: newMeals, coffee_sessions: filteredCoffee });
  };

  // Is coffee opted in for a given tea session type?
  const isCoffeeOptedIn = (teaType: string): boolean =>
    coffeeSessions.some((c) => c.session === teaType);

  // Toggle coffee opt-in for a tea session — fills/clears all dates
  const toggleCoffeeOptIn = (teaType: string) => {
    if (isCoffeeOptedIn(teaType)) {
      onChange({ coffee_sessions: coffeeSessions.filter((c) => c.session !== teaType) });
    } else {
      const newEntries = dates
        .filter((d) => getMealQty(d, teaType) > 0)
        .map((d) => ({ date: d, session: teaType, quantity: defaultHeadcount }));
      onChange({ coffee_sessions: [...coffeeSessions, ...newEntries] });
    }
  };

  // Get combined coffee qty for a day (first opted-in session found)
  const getCoffeeDayQty = (date: string): number => {
    for (const t of COFFEE_MEAL_TYPES) {
      const entry = coffeeSessions.find((c) => c.date === date && c.session === t);
      if (entry) return entry.quantity;
    }
    return 0;
  };

  // Set coffee qty for a day across all opted-in tea sessions active on that day
  const setCoffeeDayQty = (date: string, qty: number) => {
    const filtered = coffeeSessions.filter((c) => c.date !== date);
    if (qty > 0) {
      const optedInTypes = COFFEE_MEAL_TYPES.filter(
        (t) => isCoffeeOptedIn(t) && getMealQty(date, t) > 0
      );
      onChange({ coffee_sessions: [...filtered, ...optedInTypes.map((session) => ({ date, session, quantity: qty }))] });
    } else {
      onChange({ coffee_sessions: filtered });
    }
  };

  // Active = on all dates; Partial = on some but not all dates
  const enabledMeals = new Set<MealType>(
    MEAL_TYPES.filter((mt) =>
      dates.length > 0 && dates.every((date) => getMealQty(date, mt) > 0)
    )
  );

  const partialMeals = new Set<MealType>(
    MEAL_TYPES.filter((mt) =>
      !enabledMeals.has(mt) &&
      dates.some((date) => getMealQty(date, mt) > 0)
    )
  );

  const setMealQtyOnDate = (date: string, mealType: string, qty: number) => {
    const filtered = meals.filter((m) => !(m.date === date && m.meal_type === mealType));
    if (qty > 0) {
      onChange({ meals: [...filtered, { date, meal_type: mealType, headcount: qty }] });
    } else {
      onChange({ meals: filtered });
    }
  };

  // Cost summary
  const totalCoffeeServes = coffeeSessions.reduce((sum, c) => sum + c.quantity, 0);
  const coffeeCost = totalCoffeeServes * COFFEE_PRICE;

  // Show coffee column when any tea session has coffee opted in
  const showCoffeeColumn = COFFEE_MEAL_TYPES.some(isCoffeeOptedIn);
  const colCount = MEAL_TYPES.length + (showCoffeeColumn ? 1 : 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Catering</h2>
        <p className="text-sm text-gray-500">Do you require catering for your event?</p>
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
            {val ? 'Yes, catering required' : 'No, self-catered'}
          </button>
        ))}
      </div>

      {formState.catering_required && (
        <>
          {/* Info callout */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
            <p className="font-medium mb-1">Meal times</p>
            <ul className="text-xs space-y-0.5">
              <li>• Breakfast: 7:30 AM &nbsp;|&nbsp; Morning Tea: 10:30 AM</li>
              <li>• Lunch: 12:30 PM &nbsp;|&nbsp; Afternoon Tea: 3:00 PM</li>
              <li>• Dinner: 6:00 PM &nbsp;|&nbsp; Dessert: 7:30 PM</li>
              <li>• Percolated coffee available as an add-on for Morning Tea and Afternoon Tea.</li>
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
            <>
              {/* Preset shortcuts */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {GROUP_PRESETS.map((preset) => (
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

              {/* Meal card grid */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Select meals{' '}
                  <span className="font-normal text-gray-400 text-xs">— quantities editable per day below</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MEAL_TYPES.map((mealType) => {
                    const isActive = enabledMeals.has(mealType);
                    const isPartial = partialMeals.has(mealType);
                    const colored = isActive || isPartial;
                    const isTeaMeal = (COFFEE_MEAL_TYPES as readonly string[]).includes(mealType);
                    const coffeeOn = isTeaMeal && isCoffeeOptedIn(mealType);
                    const hex = MEAL_COLORS[mealType]?.hex ?? '#6b7280';

                    return (
                      <div
                        key={mealType}
                        className="rounded-xl border-2 overflow-hidden transition-all"
                        style={
                          colored
                            ? { backgroundColor: hex, borderColor: hex }
                            : { borderColor: hex + '30', backgroundColor: hex + '0A' }
                        }
                      >
                        <button
                          type="button"
                          onClick={() => toggleGlobalMeal(mealType, colored)}
                          className="w-full p-3 text-left"
                        >
                          <p
                            className="text-sm font-semibold leading-tight"
                            style={colored ? { color: 'white' } : { color: hex }}
                          >
                            {mealType}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={colored ? { color: 'rgba(255,255,255,0.70)' } : { color: hex, opacity: 0.7 }}
                          >
                            {MEAL_TIME_LABELS[mealType]} · {formatCurrency(getMealPrice(mealType))}/serve
                          </p>
                        </button>

                        {/* Coffee opt-in — only for tea meals when selected */}
                        {isTeaMeal && colored && (
                          <button
                            type="button"
                            onClick={() => toggleCoffeeOptIn(mealType)}
                            className="w-full border-t border-white/20 px-4 py-2.5 flex items-center gap-2 bg-black/10 hover:bg-black/15 transition-colors text-left"
                          >
                            <span className="text-xs text-white/80 flex-1">
                              ☕ Percolated coffee · {formatCurrency(COFFEE_PRICE)}/serve
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              coffeeOn ? 'bg-white text-gray-700' : 'bg-white/20 text-white/50'
                            }`}>
                              {coffeeOn ? 'Yes' : 'No'}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Empty state */}
                {meals.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Select meal types above to build your catering plan
                  </p>
                )}
              </div>

              {/* Meal Schedule — aligned grid */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPerDayOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>Meal Schedule</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${perDayOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {perDayOpen && (
                  <div className="border-t border-gray-200 p-3">
                    <div className="overflow-x-auto -mx-3 px-3">
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `auto repeat(${colCount}, minmax(52px, 1fr))`,
                          gap: '4px',
                          minWidth: `${colCount * 64 + 90}px`,
                        }}
                      >
                        {/* Header row */}
                        <div />
                        {MEAL_TYPES.map((mt) => {
                          const hex = MEAL_COLORS[mt]?.hex ?? '#6b7280';
                          return (
                            <div key={mt} className="text-center pb-1">
                              <p className="text-xs font-medium text-gray-500">{MEAL_ABBR[mt]}</p>
                              <div className="w-2 h-2 rounded-full mx-auto mt-0.5" style={{ backgroundColor: hex }} />
                            </div>
                          );
                        })}
                        {showCoffeeColumn && (
                          <div className="text-center pb-1">
                            <p className="text-xs font-medium text-gray-500">Coffee</p>
                            <div className="w-2 h-2 rounded-full mx-auto mt-0.5" style={{ backgroundColor: COFFEE_HEX }} />
                          </div>
                        )}

                        {/* Data rows */}
                        {dates.map((date, rowIdx) => {
                          const isEven = rowIdx % 2 === 1;
                          const coffeeTeaOnDate = COFFEE_MEAL_TYPES.filter(
                            (t) => isCoffeeOptedIn(t) && getMealQty(date, t) > 0
                          );
                          const coffeeQty = getCoffeeDayQty(date);

                          return (
                            <React.Fragment key={date}>
                              {/* Date label — sticky left */}
                              <div
                                className={`sticky left-0 z-10 flex items-center pr-2 whitespace-nowrap text-xs font-semibold text-gray-700 ${
                                  isEven ? 'bg-gray-50' : 'bg-white'
                                }`}
                              >
                                {formatDateLabel(date)}
                              </div>

                              {/* Meal cells */}
                              {MEAL_TYPES.map((mt) => {
                                const qty = getMealQty(date, mt);
                                const hex = MEAL_COLORS[mt]?.hex ?? '#6b7280';
                                if (qty > 0) {
                                  return (
                                    <button
                                      key={mt}
                                      type="button"
                                      onClick={() => setMealQtyOnDate(date, mt, 0)}
                                      className="h-9 rounded-md flex items-center justify-center w-full"
                                      style={{ backgroundColor: hex }}
                                      aria-label={`Remove ${mt} on ${date}`}
                                      title="Click to remove"
                                    >
                                      <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={qty}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          setMealQtyOnDate(date, mt, isNaN(val) ? 0 : Math.max(0, val));
                                        }}
                                        className="w-9 h-7 bg-white rounded-sm text-center text-sm font-semibold text-gray-800 focus:outline-none pointer-events-auto"
                                        aria-label={`${mt} quantity on ${date}`}
                                      />
                                    </button>
                                  );
                                }
                                return (
                                  <button
                                    key={mt}
                                    type="button"
                                    onClick={() => setMealQtyOnDate(date, mt, defaultHeadcount)}
                                    className="h-9 rounded-md bg-gray-100 text-gray-300 text-sm font-semibold w-full hover:bg-gray-200 transition-colors"
                                    aria-label={`Add ${mt} on ${date}`}
                                  >
                                    —
                                  </button>
                                );
                              })}

                              {/* Coffee cell */}
                              {showCoffeeColumn && (
                                coffeeTeaOnDate.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setCoffeeDayQty(date, 0)}
                                    className="h-9 rounded-md flex items-center justify-center w-full"
                                    style={{ backgroundColor: COFFEE_HEX }}
                                    aria-label={`Remove coffee on ${date}`}
                                    title="Click to remove"
                                  >
                                    <input
                                      type="number"
                                      min={0}
                                      max={500}
                                      value={coffeeQty || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        setCoffeeDayQty(date, isNaN(val) ? 0 : Math.max(0, val));
                                      }}
                                      className="w-9 h-7 bg-white rounded-sm text-center text-sm font-semibold text-gray-800 focus:outline-none pointer-events-auto"
                                      aria-label={`Coffee quantity on ${date}`}
                                    />
                                  </button>
                                ) : (
                                  <div className="h-9 rounded-md bg-gray-50 w-full" />
                                )
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost summary — per day breakdown */}
              {meals.length > 0 &&
                (() => {
                  const grandTotal =
                    meals.reduce((sum, m) => sum + m.headcount * getMealPrice(m.meal_type), 0) + coffeeCost;

                  const dayRows = dates.map((date) => {
                    const dayMeals = MEAL_TYPES.map((mt) => {
                      const qty = getMealQty(date, mt);
                      if (qty === 0) return null;
                      return { label: mt, qty, subtotal: qty * getMealPrice(mt) };
                    }).filter(Boolean) as { label: string; qty: number; subtotal: number }[];

                    const coffeeTeaOnDate = COFFEE_MEAL_TYPES.filter(
                      (t) => isCoffeeOptedIn(t) && getMealQty(date, t) > 0
                    );
                    const coffeeQty = coffeeTeaOnDate.length > 0 ? getCoffeeDayQty(date) : 0;

                    if (dayMeals.length === 0 && coffeeQty === 0) return null;

                    const dayTotal =
                      dayMeals.reduce((sum, m) => sum + m.subtotal, 0) + coffeeQty * COFFEE_PRICE;

                    return { date, dayMeals, coffeeQty, dayTotal };
                  }).filter(Boolean) as {
                    date: string;
                    dayMeals: { label: string; qty: number; subtotal: number }[];
                    coffeeQty: number;
                    dayTotal: number;
                  }[];

                  return (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Always-visible total row — click to expand */}
                      <button
                        type="button"
                        onClick={() => setCostOpen((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-semibold text-gray-700">Estimated catering cost</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(grandTotal)}</span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${costOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expandable per-day breakdown */}
                      {costOpen && (
                        <>
                          <div className="divide-y divide-gray-100">
                            {dayRows.map(({ date, dayMeals, coffeeQty, dayTotal }) => (
                              <div key={date} className="px-4 py-2.5">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-xs font-semibold text-gray-700">{formatDateLabel(date)}</span>
                                  <span className="text-xs font-semibold text-gray-500 tabular-nums">{formatCurrency(dayTotal)}</span>
                                </div>
                                <div className="space-y-0.5">
                                  {dayMeals.map((row) => (
                                    <div key={row.label} className="flex justify-between items-center">
                                      <span className="text-xs text-gray-500">
                                        {row.label}
                                        <span className="text-gray-400 ml-1">· {row.qty} serves</span>
                                      </span>
                                      <span className="text-xs text-gray-600 tabular-nums">{formatCurrency(row.subtotal)}</span>
                                    </div>
                                  ))}
                                  {coffeeQty > 0 && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-500">
                                        Percolated Coffee
                                        <span className="text-gray-400 ml-1">· {coffeeQty} serves</span>
                                      </span>
                                      <span className="text-xs text-gray-600 tabular-nums">{formatCurrency(coffeeQty * COFFEE_PRICE)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
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
