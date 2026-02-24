'use client';

import { formatCurrency, groupLineItemsByCategory } from '@/lib/pricing/utils';
import type { PricingResult } from '@/lib/pricing/types';

interface PricingSidebarProps {
  pricing: PricingResult | null;
  loading: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Venue',
  accommodation: 'Accommodation',
  catering: 'Catering',
  extras: 'Extras',
};

export function PricingSidebar({ pricing, loading }: PricingSidebarProps) {
  const grouped = pricing ? groupLineItemsByCategory(pricing.line_items) : null;
  const hasItems = grouped
    ? Object.values(grouped).some((items) => items.length > 0)
    : false;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Estimated Price</h3>
        <p className="text-xs text-blue-100 mt-0.5">Updates as you fill in the form</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Calculating...
          </div>
        ) : !hasItems ? (
          <div className="py-6 text-center text-sm text-gray-400">
            <p>No items selected yet.</p>
            <p className="text-xs mt-1">Pricing will appear as you make selections.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped && Object.entries(grouped).map(([category, items]) => {
              if (items.length === 0) return null;
              const subtotal = items.reduce((s, i) => s + (i.discounted_total ?? i.total), 0);
              return (
                <div key={category}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                    {CATEGORY_LABELS[category] ?? category}
                  </p>
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5 gap-2">
                      <span className="text-gray-600 truncate">{item.item}</span>
                      <span className="text-gray-900 shrink-0">{formatCurrency(item.discounted_total ?? item.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-medium text-gray-500 border-t border-gray-100 pt-1 mt-1">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              );
            })}

            {pricing && (
              <div className="border-t-2 border-gray-200 pt-3 mt-1">
                {pricing.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>Discount</span>
                    <span>−{formatCurrency(pricing.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-blue-700">{formatCurrency(pricing.total)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border-t border-amber-100 px-4 py-2.5">
        <p className="text-xs text-amber-700">
          Estimate only. Final pricing confirmed after review.
        </p>
      </div>
    </div>
  );
}
