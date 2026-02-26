# HCC Portal Frontend Design System

Read this before making any UI changes. All new UI work must align with these principles.

## Design Principles

**1. Soft & Airy** — White cards on a light gray canvas. No heavy backgrounds, no dark panels. Let content breathe with consistent spacing (gap-4, gap-6) and subtle borders (`border-gray-200`).

**2. Green as Accent, Gray as Structure** — The sage green (`#6c8f36`) is used sparingly: buttons, active states, focus rings, selected rows. Everything else is Tailwind gray. Never use olive-* for new pages.

**3. Progressive Disclosure** — Show the most important information first. Use collapsible sections for detail. Status chips and stat cards communicate state at a glance before the user reads a single line.

## Green Budget Rule

Each page gets a fixed "budget" of green:
- **One** primary action button (or link)
- **One** set of active state highlights (selected filter, checked inputs)
- **Status chips** that map to earth-toned palette (see `tokens.md`)

Do not add more green than this. If you find yourself reaching for `text-primary` or `bg-primary/10` everywhere, pull back.

## Quick-Start Checklist (New Pages)

- [ ] Neutrals use `text-gray-*` and `bg-gray-*` — never olive
- [ ] Cards: `rounded-2xl border border-gray-200 bg-white shadow-sm`
- [ ] Page header: `text-2xl font-bold text-gray-900` + `text-sm text-gray-500 mt-0.5` subtitle
- [ ] Status chips use earth-toned status-* tokens (see `tokens.md`)
- [ ] Stat mini-cards use earth-toned accent classes
- [ ] Inputs: `border border-gray-200 hover:border-gray-300 focus:border-primary rounded-lg`
- [ ] Loading skeleton: `loading.tsx` with HCC logo + skeleton blocks
- [ ] Mobile-first: base → sm → md → lg → xl (see `responsive.md`)
- [ ] Async route has `loading.tsx`

## File Index

| File | Contents |
|------|----------|
| `tokens.md` | Colors, earth-toned status palette, typography, spacing, borders, shadows |
| `components.md` | Every primitive's class strings and usage patterns |
| `patterns.md` | Page composition: headers, stat cards, toolbars, forms, data display |
| `states.md` | Interactive states, loading, feedback, empty states, animation |
| `responsive.md` | Breakpoints, container patterns, component rules, testing checklist |
| `migration.md` | Olive→gray mapping, migrated pages, known gaps |
