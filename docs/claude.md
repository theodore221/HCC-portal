# Development Guidelines for Claude Code

This document contains important development guidelines and best practices for working on the HCC Portal project.

## Responsive Design Principles

When implementing UI features, **ALWAYS** consider responsive design across all device sizes. The application must work seamlessly on:

### Target Screen Sizes

1. **📱 Mobile Phones** (< 640px)
   - Single column layouts
   - Stacked sections vertically
   - Touch-friendly button sizes
   - No horizontal scrolling

2. **📱 Tablets / Small Laptops** (640px - 1024px)
   - 1-2 column layouts
   - Efficient use of horizontal space
   - Balanced padding and spacing

3. **💻 Laptops / Desktop** (1024px - 1280px)
   - 2-3 column layouts where appropriate
   - Full navigation and features visible
   - Comfortable reading width

4. **🖥️ Large Monitors** (1280px+)
   - Increased padding to prevent content stretching too wide
   - Multi-column layouts for data-dense pages
   - Maximum content width considerations

### Tailwind CSS Breakpoints

Use these Tailwind breakpoints consistently:

```jsx
// Default (mobile-first)
className="px-4"           // Mobile: 16px padding

// Small devices (sm: 640px+)
className="sm:px-6"        // Small: 24px padding

// Medium devices (md: 768px+)
className="md:grid-cols-2" // 2 columns on medium+
className="md:px-6"        // Medium: 24px padding

// Large devices (lg: 1024px+)
className="lg:grid-cols-3" // 3 columns on large+
className="lg:px-8"        // Large: 32px padding

// Extra large (xl: 1280px+)
className="xl:px-12"       // XL: 48px padding
```

### Grid Layout Patterns

#### Two-Column Sections (Primary Contact / Booking Details)
```jsx
// Mobile: stacked vertically
// Medium+: side-by-side columns
<div className="grid gap-6 md:grid-cols-2">
  <section>...</section>
  <section>...</section>
</div>
```

#### Status Cards / Timeline
```jsx
// Mobile: 2 columns
// Large+: 4 columns
<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
  <div>...</div>
  <div>...</div>
  <div>...</div>
  <div>...</div>
</div>
```

#### Form Fields in Dialogs
```jsx
// Always stack vertically for better mobile UX
<div className="grid gap-4 py-4">
  <div className="grid gap-2">
    <Label>Field 1</Label>
    <Input />
  </div>
  <div className="grid gap-2">
    <Label>Field 2</Label>
    <Input />
  </div>
</div>
```

### Spacing and Padding

#### Container Padding (DashboardShell)
```jsx
// Applies to all admin routes
className="px-4 pb-10 pt-4 sm:px-6 lg:px-8 xl:px-12"
```

#### Section Spacing
```jsx
// Vertical spacing between sections
className="space-y-6"  // 24px gap

// Grid gaps
className="gap-6"      // 24px gap in grids
className="gap-4"      // 16px gap for tighter layouts
```

### Text and Typography

#### Responsive Text Sizes
```jsx
// Headings
className="text-xl lg:text-2xl"        // Larger on desktop
className="text-sm sm:text-base"       // Base on mobile, larger on tablet+

// Body text
className="text-sm"                     // Use consistently for body
className="text-xs"                     // Use for meta info, timestamps
```

### Common Anti-Patterns to Avoid

❌ **DON'T:**
- Use fixed widths (e.g., `w-[500px]`) without responsive alternatives
- Stack more than 3-4 items horizontally on mobile
- Use `overflow-x-auto` on main content (indicates poor responsive design)
- Forget to test on mobile devices
- Use `hidden` without responsive variants unless intentional

✅ **DO:**
- Use `max-w-*` with percentage-based widths
- Default to mobile-first (base classes for mobile, then sm:, md:, lg:, xl:)
- Test layouts by resizing browser to < 375px width
- Use `space-y-*` for vertical stacking on mobile
- Prefer `grid` over `flex` for complex layouts

### Component-Specific Guidelines

#### Dialogs and Modals
- Always full-screen on mobile or use `max-w-lg` for medium screens
- Scrollable content areas: `max-h-[70vh] overflow-y-auto`
- Form fields stack vertically on all screen sizes

#### Tables and Data Grids
- Consider card layout on mobile instead of tables
- Horizontal scroll only as last resort with clear indicators
- Prioritize most important columns on small screens

#### Tabs and Navigation
- **Never use `flex-wrap` on TabsList** - this causes tabs to stack awkwardly
- Use horizontal scroll on mobile: `overflow-x-auto` with `inline-flex`
- Add `whitespace-nowrap` to prevent tab labels from wrapping
- Use negative margins to extend scroll area to screen edges on mobile
- Sidebar: Hamburger menu on mobile, collapsible on desktop, full on lg+

### Testing Checklist

Before committing UI changes, test on:

- [ ] Mobile (375px - iPhone SE size)
- [ ] Tablet (768px - iPad portrait)
- [ ] Laptop (1366px - common laptop resolution)
- [ ] Desktop (1920px - common monitor)
- [ ] Ultra-wide (2560px+ - check max-width constraints)

### Examples from Codebase

#### ✅ Good Example - Booking Detail Overview
```jsx
// Status timeline - responsive columns
<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
  {/* 2 cols on mobile, 4 on large screens */}
</div>

// Contact sections - responsive grid
<div className="grid gap-6 md:grid-cols-2">
  {/* Stacked on mobile, side-by-side on medium+ */}
  <section>Primary Contact</section>
  <section>Booking Specifics</section>
</div>
```

#### ✅ Good Example - Dashboard Container
```jsx
// Progressive padding increase
<div className="px-4 sm:px-6 lg:px-8 xl:px-12">
  {/* More comfortable spacing on larger screens */}
</div>
```

#### ✅ Good Example - Horizontal Scrollable Tabs
```jsx
// Tabs that scroll horizontally on mobile instead of wrapping
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

#### ✅ Good Example - Responsive Action Buttons
```jsx
// Buttons that stack on mobile, row on tablet+, full-width on mobile
<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
  <Button size="sm" className="w-full sm:w-auto">
    Record Deposit
  </Button>
  <Button size="sm" className="w-full sm:w-auto">
    Approve Booking
  </Button>
  <Button size="sm" className="w-full sm:w-auto">
    Cancel Booking
  </Button>
</div>
```

## Dialog and Form Guidelines

### Dialog Size and Scrolling
- Use `DialogContent` without fixed heights
- For long forms, add scrolling: `max-h-[70vh] overflow-y-auto`
- Always test with keyboard navigation

### Form Validation
- Show validation errors inline below fields
- Use toast notifications for submission results
- Disable submit button during pending state

## State Management

### Loading States
- Use `useTransition` for server actions
- Show `isPending ? "Saving..." : "Save"` in buttons
- Disable buttons during transitions

### Success/Error Feedback
- Success: Green toast with confirmation message
- Error: Red (destructive) toast with error details
- Auto-close success toasts, keep errors visible until dismissed

## Best Practices Summary

1. **Mobile-first**: Start with mobile layout, enhance for larger screens
2. **Test responsively**: Check all breakpoints before committing
3. **Semantic spacing**: Use consistent gap/padding values (4, 6, 8, 12)
4. **Accessibility**: Maintain touch targets of 44px+ on mobile
5. **Performance**: Avoid layout shifts with consistent spacing
6. **User feedback**: Always show loading, success, and error states

---

**Remember**: Every UI change should work beautifully from a 320px phone to a 4K monitor. When in doubt, test on actual devices or use browser DevTools responsive mode.
