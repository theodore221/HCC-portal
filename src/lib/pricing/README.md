# Dynamic Pricing Engine

Server-side pricing calculation system for the HCC Portal booking system.

## Overview

The pricing engine calculates booking costs based on:
- **Accommodation**: Room types × nights
- **Catering**: Meal types × headcount
- **Venue**: Spaces × days or exclusive whole-centre use
- **Extras**: Additional services

All calculations are **server-side only** to prevent price manipulation.

## Architecture

```
pricing/
├── types.ts          # TypeScript type definitions
├── calculate.ts      # Core pricing calculation logic
├── snapshot.ts       # Price snapshot storage and retrieval
├── utils.ts          # Helper functions (formatting, validation)
├── index.ts          # Public API exports
└── README.md         # This file
```

## Core Concepts

### Price Snapshots
When a booking is created or pricing is adjusted, a **snapshot** is stored in the database. This ensures historical accuracy even if base prices change later.

**Snapshot Types:**
- `standard` - Initial pricing from direct booking form
- `custom_link` - Pre-negotiated pricing from admin-created link
- `admin_override` - Post-submission pricing adjustment

### Discount Support
Two discount types are supported:

1. **Percentage Discount** - Applies to all line items
   ```ts
   const discount = {
     type: 'percentage',
     percentage: 15, // 15% off
     notes: 'Parish member discount'
   };
   ```

2. **Per-Item Override** - Replaces specific unit prices
   ```ts
   const discount = {
     type: 'per_item_override',
     item_overrides: [
       { category: 'accommodation', item: 'Single Room', new_unit_price: 94 }
     ],
     notes: 'Discounted for returning group'
   };
   ```

## Usage Examples

### Calculate Standard Pricing

```ts
import { calculateBookingPricing } from '@/lib/pricing';

const selections = {
  arrival_date: '2026-03-15',
  departure_date: '2026-03-17',
  nights: 2,
  accommodation: {
    rooms: [
      { room_type_name: 'Single', quantity: 10 }
    ]
  },
  catering: {
    meals: [
      { meal_type: 'Breakfast', date: '2026-03-16', headcount: 10 },
      { meal_type: 'Dinner', date: '2026-03-16', headcount: 10 }
    ]
  }
};

const pricing = await calculateBookingPricing(selections);

console.log(pricing.total); // e.g., 2860.00
console.log(pricing.line_items); // Detailed breakdown
```

### Apply Discount

```ts
const discountConfig = {
  type: 'percentage',
  percentage: 15,
  notes: 'Parish member discount'
};

const pricing = await calculateBookingPricing(selections, discountConfig);

console.log(pricing.subtotal);        // Original total
console.log(pricing.discount_amount); // Discount applied
console.log(pricing.total);           // Final total
```

### Create Price Snapshot

```ts
import { createPriceSnapshot } from '@/lib/pricing';

const snapshot = await createPriceSnapshot(
  bookingId,
  pricing,
  'standard' // or 'custom_link', 'admin_override'
);

console.log(snapshot.id); // UUID of created snapshot
```

### Retrieve Price Snapshots

```ts
import { getLatestPriceSnapshot, getAllPriceSnapshots } from '@/lib/pricing';

// Get most recent snapshot
const latest = await getLatestPriceSnapshot(bookingId);

// Get full audit trail
const history = await getAllPriceSnapshots(bookingId);
```

### Format for Display

```ts
import { formatCurrency, formatPriceSnapshot } from '@/lib/pricing';

const formatted = formatPriceSnapshot(snapshot);
console.log(formatted.total); // "$2,860.00"
console.log(formatted.line_items); // Human-readable breakdown
```

## Pricing Constants

These constants are defined in `calculate.ts`:

| Constant | Value | Description |
|----------|-------|-------------|
| `WHOLE_CENTRE_DAILY_RATE` | $1,500 | Exclusive use of entire centre per day |
| `BYO_LINEN_DISCOUNT_PER_BED` | $25 | Discount for bringing own linen |
| `PERCOLATED_COFFEE_PRICE` | $3 | Price per serve |

## Database Tables Used

### Source Price Tables (Read)
- `meal_prices` - Meal type pricing
- `room_types` - Room type pricing
- `spaces` - Venue space pricing

### Snapshot Storage (Write)
- `booking_price_snapshots` - Historical pricing records

## Security Considerations

1. **Server-side only** - All calculations happen on the server
2. **Price snapshots** - Historical prices are immutable
3. **Token validation** - Custom pricing links use SHA-256 hashed tokens
4. **RLS policies** - Database access is restricted by role

## API Routes

The pricing engine is used by these API routes:

- `GET /api/pricing/calculate` - Real-time pricing for form display
- `POST /api/booking` - Creates booking with standard pricing
- `POST /api/booking/custom/[token]` - Creates booking with custom pricing
- `PATCH /api/admin/bookings/[id]/pricing` - Admin pricing override

## Testing

```ts
import { validatePricingSelections } from '@/lib/pricing';

const validation = validatePricingSelections(selections);

if (!validation.valid) {
  console.error('Invalid selections:', validation.errors);
}
```

## Future Enhancements

Potential improvements for future iterations:

- [ ] Tax calculation (GST)
- [ ] Multi-currency support
- [ ] Seasonal pricing rules
- [ ] Early bird discounts
- [ ] Group size discounts
- [ ] Promotional codes
- [ ] Payment plan calculations

## Support

For questions or issues with the pricing engine, contact the development team or refer to the main specification document.
