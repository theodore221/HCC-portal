# Component Patterns

## Cards

```
rounded-2xl border border-gray-200 bg-white shadow-sm
```

Card sections use `CardHeader` / `CardContent` from `@/components/ui/card`. Never add border-radius to content inside a card — let the card's `rounded-2xl` clip it.

## Buttons

| Variant | Classes |
|---------|---------|
| Primary | `bg-primary text-white rounded-lg hover:bg-primary-light` |
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
  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light/70" />
  <Input value={searchValue} className="rounded-full border-border/70 bg-white pl-9 pr-9" />
  {searchValue && (
    <button
      type="button"
      onClick={handleClear}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/70 hover:text-text transition-colors"
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
border-border/60 bg-white text-text-light hover:border-primary/40 hover:text-text
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
