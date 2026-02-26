# Design Tokens

## Primary Palette (Sage Green)

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | #6c8f36 | Buttons, active states, focus rings, checked inputs |
| `bg-primary-light` | #86ad45 | Hover on primary buttons |
| `bg-primary/10` | 10% sage | Light primary surface (badges, selected rows) |
| `bg-primary/20` | 20% sage | Stronger tinted surface |
| `text-primary` | #6c8f36 | Links, accent text |
| `bg-secondary` | #edf6d5 | Light sage background (cards, panels) |

> HCC website uses `#679737` (declared sage). `#6c8f36` sits in the same natural family — brighter than the old `#2F5233` forest green.

## Neutrals (Tailwind Gray)

All chrome/text uses gray — **never olive** for new pages:

| Role | Class | Hex | Usage |
|------|-------|-----|-------|
| Heading | `text-gray-900` | #111827 | Page titles, card headings |
| Body | `text-gray-700` | #374151 | Descriptions, field values |
| Secondary | `text-gray-600` | #4b5563 | Sub-labels, secondary body |
| Label | `text-gray-500` | #6b7280 | Form labels, hints, metadata |
| Muted | `text-gray-400` | #9ca3af | Placeholders, strikethrough |
| Faint | `text-gray-300` | #d1d5db | Empty state icons |
| Surface | `bg-gray-50` | #f9fafb | Page bg, table headers, panel bg |
| Surface alt | `bg-gray-100` | #f3f4f6 | Badges, hover states |
| Border light | `border-gray-100` | #f3f4f6 | Inner row dividers |
| Border | `border-gray-200` | #e5e7eb | Cards, dividers |
| Input border | `border-gray-300` | #d1d5db | Form inputs |

## Earth-Toned Status Palette

These CSS custom properties are defined in `globals.css` and available as Tailwind utilities (`text-status-sage`, `bg-status-ochre/10`, `border-status-clay/20`, etc.).

| Token | Hex | Character | Used for |
|-------|-----|-----------|----------|
| `status-sage` | #72a83c | Active/primary | AwaitingDetails, InProgress |
| `status-ochre` | #c49910 | Needs attention | Pending, In Discussion |
| `status-forest` | #169e66 | Positive outcome | Approved, Confirmed, Quoted |
| `status-clay` | #d63d2e | Negative/terminated | Cancelled |
| `status-slate` | #1d7ec8 | Fresh/incoming | New (enquiry) |
| `status-plum` | #8840c4 | Special/transformed | Converted (enquiry) |
| `status-stone` | #6b7280 | Terminal/neutral | Completed, Lost |

**Opacity pattern** — use consistently for all status chips and cards:
```
border-status-{x}/20   bg-status-{x}/10   text-status-{x}
```

**NOT** these (legacy — for UI feedback only, not booking/enquiry status):
- `text-success` / `bg-success/10` — approval checks, waived fees
- `text-warning` / `bg-warning/10` — alerts, overrides
- `text-danger` / `bg-danger/10` — destructive actions, errors

## Typography

**Font**: Geist Sans via `next/font`, fallback: Inter, Helvetica, Arial.

| Scale | Classes | Usage |
|-------|---------|-------|
| Page title | `text-2xl font-bold text-gray-900` | Main heading |
| Section heading | `text-lg font-semibold text-gray-900` | Card titles |
| Body | `text-sm text-gray-700` | Field values, body text |
| Label | `text-xs text-gray-500` | Form labels, metadata |
| Table header | `text-xs font-semibold uppercase tracking-wider text-gray-500` | Column headers |
| Caption | `text-xs text-gray-400` | Timestamps, secondary info |
| Mono | `font-mono text-sm` | Reference numbers, codes |

## Spacing

| Context | Value |
|---------|-------|
| Section gap | `space-y-6` (24px) |
| Grid gap (standard) | `gap-6` (24px) |
| Grid gap (tight) | `gap-4` (16px) |
| Container padding | `px-4 sm:px-6 lg:px-8 xl:px-12` |

## Borders

**Never use a bare `border` class without an explicit color.** Default `border` resolves to `border-input` (gray-300) which looks heavy. Always pair explicitly:

| Context | Classes |
|---------|---------|
| Cards, sections | `border border-gray-200` |
| Inputs | `border border-gray-200` + `hover:border-gray-300` |
| Dividers (`border-t/r/b/l`) | Always add `border-gray-200` |

## Border Radius

| Context | Class |
|---------|-------|
| Page cards, sheet panels | `rounded-2xl` |
| Section wrappers, select content, popovers | `rounded-xl` |
| Inputs, textareas, select triggers | `rounded-lg` |
| Buttons, badges, small controls | `rounded-lg` |
| Select items, menu items | `rounded-md` |
| Pill badges | `rounded-full` |

## Shadows

| Scale | Usage |
|-------|-------|
| `shadow-soft` | Form controls, inline dropdowns — subtle lift |
| `shadow-sm` | Cards — standard |
| `shadow-lg` | Dropdown content, popovers — elevated |

## Semantic CSS Tokens (globals.css)

| Token | Value | Mapped to |
|-------|-------|-----------|
| `bg-muted` | #f3f4f6 | gray-100 |
| `text-muted-foreground` | #6b7280 | gray-500 |
| `border-input` | #d1d5db | gray-300 |
| `ring` / `focus-visible:ring-ring` | #6c8f36 | primary sage green |
| `bg-surface` | #f9fafb | gray-50 |
| `text-surface-foreground` | #111827 | gray-900 |
