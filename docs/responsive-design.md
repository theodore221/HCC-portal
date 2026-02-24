# Responsive Design Guidelines

Read this before making any UI changes. All UI must work from 320px phones to 4K monitors.

## Target Screen Sizes

| Size | Width | Layout |
|------|-------|--------|
| 📱 Mobile | < 640px | Single column, stacked, touch-friendly (44px+ targets) |
| 📱 Tablet | 640px–1024px | 1–2 columns, balanced spacing |
| 💻 Laptop | 1024px–1280px | 2–3 columns, full nav visible |
| 🖥️ Large | 1280px+ | Multi-column, max-width constraints, increased padding |

## Tailwind Breakpoints

Use mobile-first — base classes for mobile, then layer on breakpoints:

```jsx
className="px-4"           // Mobile: 16px
className="sm:px-6"        // 640px+: 24px
className="md:grid-cols-2" // 768px+: 2 columns
className="lg:grid-cols-3" // 1024px+: 3 columns
className="xl:px-12"       // 1280px+: 48px
```

## Grid Layout Patterns

### Two-Column Sections
```jsx
<div className="grid gap-6 md:grid-cols-2">
  <section>...</section>
  <section>...</section>
</div>
```

### Status Cards / Timeline
```jsx
<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
  <div>...</div>
  <div>...</div>
</div>
```

### Form Fields in Dialogs
```jsx
<!-- Always stack vertically for mobile UX -->
<div className="grid gap-4 py-4">
  <div className="grid gap-2">
    <Label>Field 1</Label>
    <Input />
  </div>
</div>
```

## Spacing Conventions

### Container Padding (DashboardShell)
```jsx
className="px-4 pb-10 pt-4 sm:px-6 lg:px-8 xl:px-12"
```

### Section Spacing
```jsx
className="space-y-6"  // 24px between sections
className="gap-6"      // 24px in grids
className="gap-4"      // 16px for tighter layouts
```

### Responsive Text
```jsx
className="text-xl lg:text-2xl"   // Headings
className="text-sm sm:text-base"  // Body
className="text-xs"                // Meta info, timestamps
```

## Anti-Patterns

❌ **DON'T:**
- Fixed widths (`w-[500px]`) without responsive alternatives
- Stack 3+ items horizontally on mobile
- `overflow-x-auto` on main content
- `hidden` without responsive variants unless intentional
- `flex-wrap` on TabsList (causes awkward stacking)

✅ **DO:**
- `max-w-*` with percentage-based widths
- Mobile-first (base → sm → md → lg → xl)
- Test at < 375px width
- `space-y-*` for vertical stacking on mobile
- Prefer `grid` over `flex` for complex layouts

## Component-Specific Rules

### Dialogs & Modals
- Full-screen on mobile or `max-w-lg` for medium screens
- Scrollable content: `max-h-[70vh] overflow-y-auto`
- Form fields stack vertically on all sizes

### Tables & Data Grids
- Card layout on mobile instead of tables
- Horizontal scroll only as last resort
- Prioritize important columns on small screens

### Tabs & Navigation
- **Never** `flex-wrap` on TabsList
- Horizontal scroll on mobile: `overflow-x-auto` with `inline-flex`
- `whitespace-nowrap` on tab labels
- Negative margins to extend scroll to screen edges

```jsx
<div className="w-full overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0">
  <TabsList className="inline-flex items-center gap-2 rounded-full bg-neutral p-1 min-w-min">
    {tabConfig.map((tab) => (
      <TabsTrigger
        key={tab.value}
        value={tab.value}
        className="whitespace-nowrap rounded-full px-4 py-2 text-sm"
      >
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
</div>
```

### Action Buttons
```jsx
<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
  <Button size="sm" className="w-full sm:w-auto">Action</Button>
</div>
```

## State Management

### Loading States
- `useTransition` for server actions
- `isPending ? "Saving..." : "Save"` in buttons
- Disable buttons during transitions

### Feedback
- Success: Green toast, auto-close
- Error: Destructive toast, stays visible until dismissed

## Testing Checklist

Before committing UI changes, test on:

- [ ] Mobile (375px — iPhone SE)
- [ ] Tablet (768px — iPad portrait)
- [ ] Laptop (1366px)
- [ ] Desktop (1920px)
- [ ] Ultra-wide (2560px+ — check max-width constraints)
