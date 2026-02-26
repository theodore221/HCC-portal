# Interactive States, Loading & Feedback

## Interactive State Classes

| State | Classes | Notes |
|-------|---------|-------|
| Hover (surface) | `hover:bg-gray-50` / `hover:bg-gray-100` | Buttons, menu items |
| Hover (border) | `hover:border-gray-300` | Inputs |
| Hover (primary) | `hover:bg-primary-light` | Primary button |
| Focus (input) | `focus:border-primary focus:ring-2 focus:ring-primary/20` | Applied by Input primitive |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-primary` | Interactive non-inputs |
| Active | `active:scale-[0.98]` | Buttons, clickable cards |
| Disabled | `opacity-50 cursor-not-allowed pointer-events-none` | Disabled form controls |
| Selected (row) | `bg-primary/5 border-l-2 border-primary` | Table row selection |

## Loading Skeletons

Every async route must have `loading.tsx` with HCC logo + skeleton blocks:

```tsx
// app/(app)/(admin)/admin/section/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <HccLogo className="size-12 animate-pulse text-gray-300" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50 h-20 animate-pulse" />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white h-64 animate-pulse" />
    </div>
  );
}
```

## LoadingOverlay

For navigation transitions (row click → detail page):

```tsx
import { LoadingOverlay } from "@/components/ui/loading-overlay";

const [isLoading, setIsLoading] = useState(false);

// in JSX
{isLoading && <LoadingOverlay />}

// on row click
onClick={() => { setIsLoading(true); router.push(`/admin/.../id`); }}
```

## Button Pending State

```tsx
const [isPending, startTransition] = useTransition();

<Button
  disabled={isPending}
  onClick={() => startTransition(() => serverAction())}
>
  {isPending ? "Saving..." : "Save"}
</Button>
```

Or with `useFormStatus`:
```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}
```

## Toast Feedback

Use `sonner` via `import { toast } from "sonner"`:

```tsx
// Success (auto-closes)
toast.success("Booking approved successfully");

// Error (stays until dismissed)
toast.error("Failed to approve booking", { description: error.message });

// Loading → resolve
const id = toast.loading("Saving changes...");
// later:
toast.success("Changes saved", { id });
```

## Inline Error Banners

```jsx
{error && (
  <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
    {error}
  </div>
)}
```

## Field Validation Errors

```jsx
<div className="grid gap-1.5">
  <Input className={error ? "border-danger focus:ring-danger/20" : ""} />
  {error && <p className="text-xs text-danger">{error}</p>}
</div>
```

## Empty States

**Table empty state** (inside DataTable's `emptyMessage`):
```jsx
<div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-border/70 bg-neutral/60 px-8 py-10 text-center">
  <Sparkles className="size-12 text-text-light" aria-hidden />
  <div className="space-y-1">
    <h3 className="text-sm font-semibold text-text">No items match your filters</h3>
    <p className="text-sm text-text-light text-balance">
      Try adjusting your search or filters to find what you're looking for.
    </p>
  </div>
</div>
```

**In-card empty state**:
```jsx
<div className="flex flex-col items-center gap-3 py-8 text-center">
  <Icon className="size-8 text-gray-300" />
  <p className="text-sm text-gray-500">No items yet</p>
</div>
```

## Icon Size Scale

| Context | Class | px |
|---------|-------|----|
| Inline with text (xs) | `size-3` | 12px |
| Inline with text (sm) | `size-3.5` | 14px |
| Inline with body | `size-4` | 16px |
| Button icon | `size-4` | 16px |
| Section header | `size-5` | 20px |
| Empty state | `size-8` to `size-12` | 32–48px |

## Animation & Motion

Keep motion subtle:
- `transition-all duration-200` — standard transitions
- `transition-colors` — color-only transitions (cheaper)
- `animate-pulse` — loading skeletons, pulsing status chips (active states)
- `data-[state=open]:rotate-180` — chevron rotation for collapsibles

Do not add `animate-bounce`, `animate-spin` (except true loading spinners), or custom keyframes without good reason.
