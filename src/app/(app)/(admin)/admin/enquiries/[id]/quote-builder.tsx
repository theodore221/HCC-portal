"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Loader2, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { calculateQuotePricing, createEnquiryQuote } from "./actions";
import type { Enquiry } from "@/lib/queries/enquiries";
import type {
  BookingSelections,
  DiscountConfig,
  PricingResult,
  PricingLineItem,
} from "@/lib/pricing/types";

export interface PricingReferenceData {
  roomTypes: { id: string; name: string; price: number }[];
  spaces: { id: string; name: string; price: number }[];
  mealPrices: { meal_type: string; price: number }[];
}

interface QuoteBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enquiry: Enquiry;
  pricingData: PricingReferenceData;
  existingQuotesCount: number;
  initialSelections?: BookingSelections | null;
  initialDiscountConfig?: DiscountConfig | null;
  onQuoteCreated?: () => void;
}

const SINGLE_BED_PRESETS = [65, 60, 55];
const WHOLE_CENTRE_DAILY_RATE = 1500;

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
}

function calcNights(arrival: string, departure: string): number {
  if (!arrival || !departure) return 0;
  const a = new Date(arrival);
  const d = new Date(departure);
  return Math.max(0, Math.ceil((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Qty spinner ────────────────────────────────────────────────────────────────
function QtySpinner({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
        disabled={value >= max}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Pricing Preview ────────────────────────────────────────────────────────────
function PricingPreview({
  pricing,
  loading,
}: {
  pricing: PricingResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Calculating…</p>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        Select dates and items to see a live pricing preview
      </div>
    );
  }

  const categories: Array<{ key: PricingLineItem["category"]; label: string }> = [
    { key: "accommodation", label: "Accommodation" },
    { key: "venue", label: "Venue" },
    { key: "catering", label: "Catering" },
    { key: "extras", label: "Extras" },
  ];

  return (
    <div className="space-y-4 text-sm">
      {categories.map(({ key, label }) => {
        const items = pricing.line_items.filter((i) => i.category === key);
        if (!items.length) return null;
        return (
          <div key={key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {label}
            </p>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const hasOverride =
                  item.discounted_total !== undefined && item.discounted_total !== item.total;
                const displayTotal = item.discounted_total ?? item.total;
                return (
                  <div key={idx} className="flex justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-700">{item.item}</p>
                      <p className="text-xs text-gray-500">
                        {item.qty} × {fmtCurrency(item.discounted_unit_price ?? item.unit_price)}/
                        {item.unit}
                        {hasOverride && item.discounted_unit_price !== undefined && (
                          <span className="ml-1 text-gray-400 line-through">
                            {fmtCurrency(item.unit_price)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {hasOverride && (
                        <p className="text-xs text-gray-400 line-through">
                          {fmtCurrency(item.total)}
                        </p>
                      )}
                      <p
                        className={
                          hasOverride ? "font-medium text-emerald-700" : "text-gray-700"
                        }
                      >
                        {fmtCurrency(displayTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span>{fmtCurrency(pricing.subtotal)}</span>
        </div>
        {pricing.discount_amount > 0 && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Savings</span>
            <span>−{fmtCurrency(pricing.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2">
          <span>Total</span>
          <span>{fmtCurrency(pricing.total)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Helpers to parse initial state from existing quote ─────────────────────────
function parseInitialRoomQty(sel?: BookingSelections | null) {
  const m: Record<string, number> = {};
  sel?.accommodation?.rooms.forEach((r) => { m[r.room_type_id] = r.quantity; });
  return m;
}
function parseInitialRoomByoLinen(sel?: BookingSelections | null) {
  const m: Record<string, boolean> = {};
  sel?.accommodation?.rooms.forEach((r) => { m[r.room_type_id] = r.byo_linen || false; });
  return m;
}
function parseInitialSpaceSelected(sel?: BookingSelections | null) {
  const m: Record<string, boolean> = {};
  sel?.venue?.spaces?.forEach((s) => { m[s.space_id] = true; });
  return m;
}
function parseInitialSpaceDays(sel?: BookingSelections | null) {
  const m: Record<string, number> = {};
  sel?.venue?.spaces?.forEach((s) => { m[s.space_id] = s.days; });
  return m;
}
function parseInitialMealOccasions(sel?: BookingSelections | null) {
  const m: Record<string, number> = {};
  sel?.catering?.meals.forEach((ml) => { m[ml.meal_type] = (m[ml.meal_type] || 0) + 1; });
  return m;
}
function parseInitialMealHeadcount(sel?: BookingSelections | null) {
  const m: Record<string, number> = {};
  sel?.catering?.meals.forEach((ml) => { m[ml.meal_type] = ml.headcount; });
  return m;
}
function parseInitialRoomOverrides(
  cfg?: DiscountConfig | null,
  roomTypes?: { id: string; name: string }[]
) {
  const m: Record<string, string> = {};
  cfg?.item_overrides?.forEach((ov) => {
    if (ov.category === "accommodation") {
      const rt = roomTypes?.find((r) => r.name === ov.item || ov.item.startsWith(r.name));
      if (rt) m[rt.id] = String(ov.new_unit_price);
    }
  });
  return m;
}
function parseInitialSpaceOverrides(
  cfg?: DiscountConfig | null,
  spaces?: { id: string; name: string }[]
) {
  const m: Record<string, string> = {};
  cfg?.item_overrides?.forEach((ov) => {
    if (ov.category === "venue" && ov.item !== "Exclusive Use - Whole Centre") {
      const sp = spaces?.find((s) => s.name === ov.item);
      if (sp) m[sp.id] = String(ov.new_unit_price);
    }
  });
  return m;
}
function parseInitialVenueWaived(cfg?: DiscountConfig | null) {
  const venueOvr = cfg?.item_overrides?.filter((ov) => ov.category === "venue") ?? [];
  return venueOvr.length > 0 && venueOvr.every((ov) => ov.new_unit_price === 0);
}
function parseInitialWholeCentreOverride(cfg?: DiscountConfig | null) {
  const ov = cfg?.item_overrides?.find(
    (o) => o.category === "venue" && o.item === "Exclusive Use - Whole Centre"
  );
  return ov ? String(ov.new_unit_price) : "";
}

// ── Main component ─────────────────────────────────────────────────────────────
// NOTE: This component is always remounted via a `key` prop change when the sheet
// opens, so lazy useState initializers correctly reflect the latest props.
export function QuoteBuilder({
  open,
  onOpenChange,
  enquiry,
  pricingData,
  existingQuotesCount,
  initialSelections,
  initialDiscountConfig,
  onQuoteCreated,
}: QuoteBuilderProps) {
  const [isPending, startTransition] = useTransition();

  // ── Form state — lazy initializers pick up `initialSelections` on mount ──────
  const [arrivalDate, setArrivalDate] = useState(
    () => initialSelections?.arrival_date || enquiry.approximate_start_date || ""
  );
  const [departureDate, setDepartureDate] = useState(
    () => initialSelections?.departure_date || enquiry.approximate_end_date || ""
  );

  const nights = calcNights(arrivalDate, departureDate);

  const [roomQty, setRoomQty] = useState<Record<string, number>>(
    () => parseInitialRoomQty(initialSelections)
  );
  const [roomByoLinen, setRoomByoLinen] = useState<Record<string, boolean>>(
    () => parseInitialRoomByoLinen(initialSelections)
  );
  const [roomOverride, setRoomOverride] = useState<Record<string, string>>(
    () => parseInitialRoomOverrides(initialDiscountConfig, pricingData.roomTypes)
  );

  const [wholeCentre, setWholeCentre] = useState(
    () => initialSelections?.venue?.whole_centre || false
  );
  const [wholeCentreOverride, setWholeCentreOverride] = useState(
    () => parseInitialWholeCentreOverride(initialDiscountConfig)
  );
  const [venueWaived, setVenueWaived] = useState(
    () => parseInitialVenueWaived(initialDiscountConfig)
  );
  const [spaceSelected, setSpaceSelected] = useState<Record<string, boolean>>(
    () => parseInitialSpaceSelected(initialSelections)
  );
  const [spaceDays, setSpaceDays] = useState<Record<string, number>>(
    () => parseInitialSpaceDays(initialSelections)
  );
  const [spaceOverride, setSpaceOverride] = useState<Record<string, string>>(
    () => parseInitialSpaceOverrides(initialDiscountConfig, pricingData.spaces)
  );

  const [mealOccasions, setMealOccasions] = useState<Record<string, number>>(
    () => parseInitialMealOccasions(initialSelections)
  );
  const [mealHeadcount, setMealHeadcount] = useState<Record<string, number>>(
    () => parseInitialMealHeadcount(initialSelections)
  );
  const [coffeeQuantity, setCoffeeQuantity] = useState(
    () => initialSelections?.catering?.percolated_coffee?.quantity || 0
  );

  const [description, setDescription] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [reasonForChange, setReasonForChange] = useState("");

  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // ── Build BookingSelections ────────────────────────────────────────────────
  const buildSelections = useCallback((): BookingSelections | null => {
    if (!arrivalDate || !departureDate || nights <= 0) return null;

    const rooms = pricingData.roomTypes
      .filter((rt) => (roomQty[rt.id] || 0) > 0)
      .map((rt) => ({
        room_type_id: rt.id,
        room_type_name: rt.name,
        quantity: roomQty[rt.id] || 0,
        byo_linen: roomByoLinen[rt.id] || false,
      }));

    const meals: NonNullable<BookingSelections["catering"]>["meals"] = [];
    pricingData.mealPrices.forEach((mp) => {
      const occasions = mealOccasions[mp.meal_type] || 0;
      // Fall back to enquiry's estimated_guests if the user hasn't touched the headcount field
      const headcount = mealHeadcount[mp.meal_type] || enquiry.estimated_guests || 0;
      if (occasions > 0 && headcount > 0) {
        for (let i = 0; i < occasions; i++) {
          meals.push({ meal_type: mp.meal_type, date: arrivalDate, headcount });
        }
      }
    });

    const spaces = pricingData.spaces
      .filter((s) => spaceSelected[s.id])
      .map((s) => ({
        space_id: s.id,
        space_name: s.name,
        days: spaceDays[s.id] || nights + 1,
      }));

    return {
      arrival_date: arrivalDate,
      departure_date: departureDate,
      nights,
      accommodation: rooms.length > 0 ? { rooms } : undefined,
      catering:
        meals.length > 0 || coffeeQuantity > 0
          ? {
              meals,
              percolated_coffee: coffeeQuantity > 0 ? { quantity: coffeeQuantity } : undefined,
            }
          : undefined,
      venue:
        wholeCentre || spaces.length > 0
          ? {
              whole_centre: wholeCentre || undefined,
              spaces: !wholeCentre && spaces.length > 0 ? spaces : undefined,
            }
          : undefined,
    };
  }, [
    arrivalDate,
    departureDate,
    nights,
    roomQty,
    roomByoLinen,
    mealOccasions,
    mealHeadcount,
    coffeeQuantity,
    wholeCentre,
    spaceSelected,
    spaceDays,
    pricingData,
    enquiry.estimated_guests,
  ]);

  // ── Build DiscountConfig ───────────────────────────────────────────────────
  const buildDiscountConfig = useCallback((): DiscountConfig | undefined => {
    const overrides: NonNullable<DiscountConfig["item_overrides"]> = [];

    pricingData.roomTypes.forEach((rt) => {
      if ((roomQty[rt.id] || 0) === 0) return;
      const val = roomOverride[rt.id];
      if (val !== undefined && val !== "" && !isNaN(parseFloat(val))) {
        overrides.push({
          category: "accommodation",
          item: rt.name,
          new_unit_price: parseFloat(val),
        });
      }
    });

    if (wholeCentre) {
      if (venueWaived) {
        overrides.push({
          category: "venue",
          item: "Exclusive Use - Whole Centre",
          new_unit_price: 0,
        });
      } else if (wholeCentreOverride !== "" && !isNaN(parseFloat(wholeCentreOverride))) {
        overrides.push({
          category: "venue",
          item: "Exclusive Use - Whole Centre",
          new_unit_price: parseFloat(wholeCentreOverride),
        });
      }
    } else {
      pricingData.spaces.forEach((s) => {
        if (!spaceSelected[s.id]) return;
        if (venueWaived) {
          overrides.push({ category: "venue", item: s.name, new_unit_price: 0 });
        } else {
          const val = spaceOverride[s.id];
          if (val !== undefined && val !== "" && !isNaN(parseFloat(val))) {
            overrides.push({ category: "venue", item: s.name, new_unit_price: parseFloat(val) });
          }
        }
      });
    }

    if (overrides.length === 0) return undefined;
    return { type: "per_item_override", item_overrides: overrides };
  }, [
    roomQty,
    roomOverride,
    wholeCentre,
    venueWaived,
    wholeCentreOverride,
    spaceSelected,
    spaceOverride,
    pricingData,
  ]);

  // ── Debounced pricing recalculation ───────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      const selections = buildSelections();
      if (!selections) {
        setPricing(null);
        setPricingLoading(false);
        return;
      }
      setPricingLoading(true);
      const result = await calculateQuotePricing(selections, buildDiscountConfig());
      if (result.success && result.pricing) {
        setPricing(result.pricing);
      }
      setPricingLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [buildSelections, buildDiscountConfig]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const selections = buildSelections();
    if (!selections || !pricing) return;

    startTransition(async () => {
      await createEnquiryQuote(enquiry.id, {
        amount: pricing.total,
        description: description || undefined,
        notes: internalNotes || undefined,
        reasonForChange: existingQuotesCount > 0 ? reasonForChange || undefined : undefined,
        selections,
        line_items: pricing.line_items,
        discount_config: buildDiscountConfig() || null,
        price_snapshot: pricing.price_snapshot,
      });
      onQuoteCreated?.();
      onOpenChange(false);
    });
  };

  // ── Venue waiver toggle ────────────────────────────────────────────────────
  const toggleVenueWaiver = () => {
    setVenueWaived((v) => {
      if (v) {
        setSpaceOverride({});
        setWholeCentreOverride("");
      }
      return !v;
    });
  };

  const canSubmit = !!buildSelections() && !!pricing && !pricingLoading && !isPending;
  const isRevision = existingQuotesCount > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-4xl flex flex-col p-0 overflow-hidden gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 bg-primary shrink-0">
          <SheetTitle className="text-white">
            {isRevision ? `Revise Quote — v${existingQuotesCount + 1}` : "Create Quote"}
          </SheetTitle>
          <SheetDescription className="text-white/80">
            {enquiry.customer_name}
            {enquiry.organization ? ` · ${enquiry.organization}` : ""}
            {enquiry.estimated_guests ? ` · ~${enquiry.estimated_guests} guests` : ""}
          </SheetDescription>
        </SheetHeader>

        {/* Body: two columns */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-[1fr_320px]">
            {/* ── Left: Selections ── */}
            <div className="p-6 space-y-4 border-r">
              {/* Dates */}
              <Section title="Dates" defaultOpen>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Arrival</Label>
                    <Input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Departure</Label>
                    <Input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                    />
                  </div>
                </div>
                {nights > 0 && (
                  <p className="text-xs text-gray-500">
                    {nights} night{nights !== 1 ? "s" : ""}
                  </p>
                )}
              </Section>

              {/* Accommodation */}
              <Section title="Accommodation">
                <div className="space-y-3">
                  {pricingData.roomTypes.map((rt) => {
                    const qty = roomQty[rt.id] || 0;
                    const isSingleBed = rt.name.toLowerCase().includes("single");
                    return (
                      <div key={rt.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {rt.name}
                            </p>
                            <p className="text-xs text-gray-500">${rt.price}/bed-night</p>
                          </div>
                          <QtySpinner
                            value={qty}
                            onChange={(v) =>
                              setRoomQty((prev) => ({ ...prev, [rt.id]: v }))
                            }
                          />
                        </div>
                        {qty > 0 && (
                          <div className="ml-1 flex flex-wrap items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={roomByoLinen[rt.id] || false}
                                onChange={(e) =>
                                  setRoomByoLinen((prev) => ({
                                    ...prev,
                                    [rt.id]: e.target.checked,
                                  }))
                                }
                                className="rounded"
                              />
                              BYO Linen (−$25/bed)
                            </label>
                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-xs text-gray-500">Override $</span>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={roomOverride[rt.id] || ""}
                                onChange={(e) =>
                                  setRoomOverride((prev) => ({
                                    ...prev,
                                    [rt.id]: e.target.value,
                                  }))
                                }
                                placeholder={String(rt.price)}
                                className="w-20 h-7 text-xs"
                              />
                              {isSingleBed && (
                                <div className="flex gap-1">
                                  {SINGLE_BED_PRESETS.map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() =>
                                        setRoomOverride((prev) => ({
                                          ...prev,
                                          [rt.id]: String(p),
                                        }))
                                      }
                                      className={`rounded px-2 py-0.5 text-xs font-medium border transition-colors ${
                                        roomOverride[rt.id] === String(p)
                                          ? "bg-primary text-white border-primary"
                                          : "border-gray-300 text-gray-500 hover:bg-gray-50"
                                      }`}
                                    >
                                      ${p}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Venue */}
              <Section title="Venue">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wholeCentre}
                      onChange={(e) => {
                        setWholeCentre(e.target.checked);
                        if (e.target.checked) setSpaceSelected({});
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Whole Centre — ${WHOLE_CENTRE_DAILY_RATE.toLocaleString()}/day
                    </span>
                  </label>

                  {wholeCentre && !venueWaived && (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                        Override $/day
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={wholeCentreOverride}
                        onChange={(e) => setWholeCentreOverride(e.target.value)}
                        placeholder="1500"
                        className="w-24 h-7 text-xs"
                      />
                    </div>
                  )}

                  {!wholeCentre && (
                    <div className="space-y-2 pl-1">
                      {pricingData.spaces.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2">
                          {/* Left: checkbox + name + base price */}
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={spaceSelected[s.id] || false}
                              onChange={(e) => {
                                setSpaceSelected((prev) => ({
                                  ...prev,
                                  [s.id]: e.target.checked,
                                }));
                                if (e.target.checked && !spaceDays[s.id] && nights > 0) {
                                  setSpaceDays((prev) => ({
                                    ...prev,
                                    [s.id]: nights + 1,
                                  }));
                                }
                              }}
                              className="rounded shrink-0"
                            />
                            <span className="text-sm text-gray-700 truncate">{s.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">${s.price}/day</span>
                          </label>
                          {/* Right: days + override — always right-aligned */}
                          {spaceSelected[s.id] && (
                            <div className="flex items-center gap-2 shrink-0">
                              <QtySpinner
                                value={spaceDays[s.id] || nights + 1}
                                onChange={(v) =>
                                  setSpaceDays((prev) => ({ ...prev, [s.id]: v }))
                                }
                                min={1}
                              />
                              <span className="text-xs text-gray-500">days</span>
                              {!venueWaived && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                                    Override
                                  </span>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={spaceOverride[s.id] || ""}
                                    onChange={(e) =>
                                      setSpaceOverride((prev) => ({
                                        ...prev,
                                        [s.id]: e.target.value,
                                      }))
                                    }
                                    placeholder={String(s.price)}
                                    className="w-20 h-7 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(wholeCentre || Object.values(spaceSelected).some(Boolean)) && (
                    <Button
                      type="button"
                      variant={venueWaived ? "default" : "outline"}
                      size="sm"
                      onClick={toggleVenueWaiver}
                      className={
                        venueWaived ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                      }
                    >
                      {venueWaived ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Venue Waived — Click to Undo
                        </>
                      ) : (
                        "Waive Venue Hire ($0)"
                      )}
                    </Button>
                  )}
                </div>
              </Section>

              {/* Catering */}
              <Section title="Catering">
                <div className="space-y-4">
                  {pricingData.mealPrices.map((mp) => {
                    const occasions = mealOccasions[mp.meal_type] || 0;
                    const headcount =
                      mealHeadcount[mp.meal_type] || enquiry.estimated_guests || 0;
                    const totalServes = occasions * headcount;
                    return (
                      <div key={mp.meal_type} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {mp.meal_type}
                            </p>
                            <p className="text-xs text-gray-500">${mp.price}/serve</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Occasions:</span>
                            <QtySpinner
                              value={occasions}
                              onChange={(v) =>
                                setMealOccasions((prev) => ({
                                  ...prev,
                                  [mp.meal_type]: v,
                                }))
                              }
                            />
                          </div>
                        </div>
                        {occasions > 0 && (
                          <div className="flex items-center gap-3 ml-1 flex-wrap">
                            <span className="text-xs text-gray-500">Guests/occasion:</span>
                            <Input
                              type="number"
                              min="1"
                              value={headcount || ""}
                              onChange={(e) =>
                                setMealHeadcount((prev) => ({
                                  ...prev,
                                  [mp.meal_type]: parseInt(e.target.value) || 0,
                                }))
                              }
                              placeholder={String(enquiry.estimated_guests || "")}
                              className="w-20 h-7 text-xs"
                            />
                            {totalServes > 0 && (
                              <span className="text-xs text-gray-500">
                                = {totalServes} serves · {fmtCurrency(totalServes * mp.price)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-3 border-t pt-3 flex-wrap">
                    <span className="text-sm text-gray-700 flex-1">Percolated Coffee</span>
                    <span className="text-xs text-gray-500">$3/serve</span>
                    <QtySpinner value={coffeeQuantity} onChange={setCoffeeQuantity} max={9999} />
                    <span className="text-xs text-gray-500">serves</span>
                  </div>
                </div>
              </Section>

              {/* Quote metadata */}
              <Section title="Quote Details">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does this quote cover?"
                      rows={2}
                    />
                  </div>
                  {isRevision && (
                    <div>
                      <Label className="text-xs text-gray-500">Reason for Change *</Label>
                      <Textarea
                        value={reasonForChange}
                        onChange={(e) => setReasonForChange(e.target.value)}
                        placeholder="Why is this quote being revised?"
                        rows={2}
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-gray-500">Internal Notes</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Notes for staff (not visible to customer)"
                      rows={2}
                    />
                  </div>
                </div>
              </Section>
            </div>

            {/* ── Right: Pricing Preview ── */}
            <div className="p-5 bg-gray-50 min-h-full">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                Live Pricing Preview
              </p>
              <PricingPreview pricing={pricing} loading={pricingLoading} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex w-full items-center justify-between gap-4">
            {pricing && (
              <p className="text-base font-bold text-gray-900">
                Total: {fmtCurrency(pricing.total)}
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || (isRevision && !reasonForChange.trim())}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : isRevision ? (
                  `Save Quote v${existingQuotesCount + 1}`
                ) : (
                  "Create Quote"
                )}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
