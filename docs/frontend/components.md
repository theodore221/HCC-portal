# Component Patterns

## Cards

```
rounded-2xl border border-gray-200 bg-white shadow-sm
```

Card sections use `CardHeader` / `CardContent` from `@/components/ui/card`. Never add border-radius to content inside a card — let the card's `rounded-2xl` clip it.

## Buttons

| Variant | Classes |
|---------|---------|
| Primary | `bg-primary text-white rounded-lg hover:bg-primary/90` |
| Outline | `border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50` |
| Ghost | `text-gray-600 hover:bg-gray-100 rounded-lg` |
| Destructive | `bg-danger text-white rounded-lg hover:bg-danger/90` |
| Link | `text-primary underline-offset-4 hover:underline` |
| Icon | `rounded-lg p-2 hover:bg-gray-100` |
| Small | Add `size="sm"` to `<Button>` — `h-8 px-3 text-xs` |

Use `buttonVariants({ variant, size })` from `@/components/ui/button` for `<Link>` elements that look like buttons.

## Inputs & Textareas

```
border border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-primary/20 rounded-lg bg-white shadow-soft
```

All in `@/components/ui/input` and `@/components/ui/textarea`. Do not override these primitives — they already apply the correct style.

## Labels

```
text-xs font-medium text-gray-500 uppercase tracking-wide
```

Use `<Label>` from `@/components/ui/label`. Always associate with its input via `htmlFor`.

## Select / Combobox Triggers

```
border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 focus-visible:ring-primary/20 rounded-lg shadow-soft transition-all
```

## Select / Dropdown Content

```
border border-gray-200 rounded-xl shadow-lg bg-white
```

## Select / Menu Items

```
hover:bg-gray-100/70 focus:bg-gray-100/70 rounded-md
```

## Dropdown Menus

Trigger: `rounded-lg border border-gray-200 hover:bg-gray-50`.
Content: `border border-gray-200 rounded-xl shadow-lg`.
Items: `hover:bg-gray-100/70 rounded-md`.

## Tabs

```jsx
<TabsList className="inline-flex items-center gap-2 rounded-full bg-gray-100 p-1">
  <TabsTrigger value="x" className="rounded-full px-4 py-2 text-sm whitespace-nowrap">
    Label
  </TabsTrigger>
</TabsList>
```

Always `bg-gray-100` for TabsList, never `bg-neutral`. For mobile, wrap in a scroll container (see `responsive.md`).

## Badge

```jsx
<Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
  Text
</Badge>
```

For status use `StatusChip` / `EnquiryStatusChip`, not `Badge`.

## StatusChip

Earth-toned, from `@/components/ui/status-chip`. Never hard-code status colors — always use this component.

```jsx
<StatusChip status={booking.status} />
```

## EnquiryStatusChip

Earth-toned, from `@/components/ui/enquiry-status-chip`.

```jsx
<EnquiryStatusChip status={enquiry.status} />
```

## Checkbox & Switch

Checked/on state: `bg-primary border-primary`. Unchecked: `border-gray-300`.

## Progress

```
bg-gray-100 rounded-full [&>div]:bg-primary
```

## Tooltip

```jsx
<Tooltip>
  <TooltipTrigger asChild><Button /></TooltipTrigger>
  <TooltipContent className="rounded-lg border border-gray-200 bg-white text-gray-700 shadow-lg text-xs">
    Tooltip text
  </TooltipContent>
</Tooltip>
```

## Dialog

```jsx
<DialogContent className="rounded-2xl border border-gray-200 bg-white shadow-lg sm:max-w-lg">
  <DialogHeader>
    <DialogTitle className="text-lg font-semibold text-gray-900">Title</DialogTitle>
    <DialogDescription className="text-sm text-gray-500">Description</DialogDescription>
  </DialogHeader>
  <div className="max-h-[60vh] overflow-y-auto py-4">
    {/* form content */}
  </div>
</DialogContent>
```

## Sheet

```jsx
<SheetContent className="border-l border-gray-200 bg-white">
  <SheetHeader>
    <SheetTitle className="text-lg font-semibold text-gray-900">Title</SheetTitle>
  </SheetHeader>
</SheetContent>
```

## Alert / Banner

```jsx
// Error
<div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
  {message}
</div>

// Success
<div className="rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success">
  {message}
</div>
```

## Search Input with Clear

```jsx
<div className="relative w-full max-w-xs">
  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
  <Input value={searchValue} className="rounded-full border-gray-200 bg-white pl-9 pr-9" />
  {searchValue && (
    <button
      type="button"
      onClick={handleClear}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
    >
      <X className="size-4" />
    </button>
  )}
</div>
```

## Toggle Pills (Status Filter / Preset Buttons)

Active:
```
border-primary bg-primary text-white shadow-sm
```

Inactive:
```
border-gray-200/60 bg-white text-gray-500 hover:border-primary/40 hover:text-gray-700
```

## Collapsible Sections

Outer wrapper:
```
border border-gray-200 rounded-xl overflow-hidden
```

Trigger button:
```
bg-gray-50 hover:bg-gray-100 text-gray-900
```

## Stepper

Use `@/components/ui/stepper`. Steps: `bg-primary text-white` (active), `bg-gray-100 text-gray-500` (future), `bg-primary/10 text-primary` (completed).

## Audit Timeline

Use `@/components/ui/audit-timeline`. Dot: `bg-primary`. Line: `bg-gray-200`. Text: `text-gray-700` / `text-gray-400`.

## Context Banner

Full-width banner pinned to top of a tab section. Uses `bg-primary` background with white text:

```jsx
<div className="rounded-xl bg-primary px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <div className="flex items-center gap-2 flex-wrap">
    <span className="inline-flex items-center rounded-full bg-white/20 border border-white/15 px-2.5 py-1 text-xs font-semibold text-white">
      Label
    </span>
    <span className="text-sm text-white/80">Supporting text</span>
  </div>
  <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
    <span>Meta info</span>
    {warning && (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/20 rounded px-1.5 py-0.5 text-white">
        <AlertTriangle className="size-3" />
        Warning text
      </span>
    )}
  </div>
</div>
```

## Day Toggle Grid

Compact day-toggle button grid for space reservations. Buttons: `w-9 h-9 sm:w-10 sm:h-10`, show day letter at `text-[10px]` above the date number at `text-xs`:

```jsx
<div className="flex flex-wrap gap-1.5 md:gap-2">
  <button className={cn(
    "flex flex-col items-center justify-center rounded-lg border text-xs font-medium transition-all select-none",
    "w-9 h-9 sm:w-10 sm:h-10",
    isReserved && hasConflict ? "bg-status-clay border-status-clay text-white hover:opacity-90"
    : isReserved ? "bg-primary border-primary text-white hover:opacity-90"
    : "bg-gray-100 border-gray-200 text-gray-400 hover:border-primary hover:bg-primary/10 hover:text-primary"
  )}>
    <span className="text-[10px] leading-none opacity-80">{dayLetter}</span>
    <span className="leading-none text-xs">{dateNum}</span>
  </button>
</div>
```

## Inline Time Picker

Compact time range editor that collapses to a single display line:

```jsx
// Display mode
<div className="flex items-center gap-2 text-sm">
  <Clock className="size-3.5 text-primary" />
  <span className="text-gray-700">{timeLabel}</span>
  <Button variant="outline" size="sm" className="h-6 text-xs px-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
    Set Times
  </Button>
</div>

// Edit mode — inline inputs
<div className="flex flex-wrap items-center gap-2 text-sm">
  <Clock className="size-3.5 text-primary flex-shrink-0" />
  <Input type="time" className="h-7 w-[110px] text-xs" />
  <span className="text-gray-400 text-xs">–</span>
  <Input type="time" className="h-7 w-[110px] text-xs" />
  <Button size="sm" className="h-7 text-xs px-3">Save</Button>
  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-gray-500">Cancel</Button>
</div>
```
