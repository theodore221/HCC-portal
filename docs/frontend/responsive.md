# Responsive Design

Read this before making any UI changes. All UI must work from 320px phones to 4K monitors.

## Breakpoints

| Name | Width | Layout strategy |
|------|-------|-----------------|
| Mobile | < 640px | Single column, stacked, touch targets 44px+ |
| sm | 640px+ | 1–2 columns, balanced spacing |
| md | 768px+ | 2-column sections, medium padding |
| lg | 1024px+ | 2–3 column grids, full navigation visible |
| xl | 1280px+ | Multi-column, max-width constraints, increased padding |

Mobile-first always: write base classes for mobile, then layer breakpoints.

## Page Containers

### Admin dashboard shell
```jsx
className="px-4 pb-10 pt-4 sm:px-6 lg:px-8 xl:px-12"
```

### Portal (customer-facing)
```jsx
className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"
```

### Public pages
```jsx
className="mx-auto max-w-5xl px-4 sm:px-6"
```

## Grid Patterns

### Two-column sections (contact / booking details)
```jsx
<div className="grid gap-6 md:grid-cols-2">
  <section>...</section>
  <section>...</section>
</div>
```

### Stat cards
```jsx
<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">...</div>
```

### Card grids (spaces, rooms)
```jsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">...</div>
```

### Form fields in dialogs — always stack vertically
```jsx
<div className="grid gap-4 py-4">
  <div className="grid gap-2">
    <Label>Field</Label>
    <Input />
  </div>
</div>
```

## Component-Specific Rules

### Dialogs & Modals
- Full-screen on mobile or `max-w-lg` for medium screens
- Scrollable content: `max-h-[70vh] overflow-y-auto`
- Form fields always stack vertically

### Tables & Data Grids
- Card layout on mobile instead of tables where practical
- Horizontal scroll only as last resort
- Hide lower-priority columns on small screens using `meta: "hidden md:table-cell"`

### Tabs & Navigation
- **Never** `flex-wrap` on TabsList — causes awkward stacking
- Horizontal scroll on mobile:
```jsx
<div className="w-full overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0">
  <TabsList className="inline-flex items-center gap-2 rounded-full bg-gray-100 p-1 min-w-min">
    <TabsTrigger className="whitespace-nowrap rounded-full px-4 py-2 text-sm">
      Label
    </TabsTrigger>
  </TabsList>
</div>
```

### Action Buttons
Stack on mobile, row on tablet+:
```jsx
<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
  <Button size="sm" className="w-full sm:w-auto">Action</Button>
</div>
```

### Text
```jsx
className="text-xl lg:text-2xl"   // Responsive headings
className="text-sm sm:text-base"  // Body
className="text-xs"                // Meta info (always small)
```

## Anti-Patterns

❌ **DON'T:**
- Fixed widths (`w-[500px]`) without responsive alternatives
- Stack 3+ items horizontally on mobile
- `overflow-x-auto` on main content
- `hidden` without responsive variants unless intentional
- `flex-wrap` on TabsList

✅ **DO:**
- `max-w-*` with percentage-based widths
- Mobile-first (base → sm → md → lg → xl)
- Test at < 375px width
- `space-y-*` for vertical stacking
- Prefer `grid` over `flex` for complex layouts

## Testing Checklist

Before committing UI changes, verify at:

- [ ] Mobile (375px — iPhone SE)
- [ ] Tablet (768px — iPad portrait)
- [ ] Laptop (1366px — common laptop)
- [ ] Desktop (1920px — common monitor)
- [ ] Ultra-wide (2560px+ — check max-width constraints)
