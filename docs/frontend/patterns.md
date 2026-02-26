# Page Composition Patterns

## Page Header (List Pages)

Use this structure at the top of all admin list pages, above stat cards and the main card:

```jsx
<div className="flex items-start justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">{Page Title}</h1>
    <p className="text-sm text-gray-500 mt-0.5">{Subtitle}</p>
  </div>
  <Link href="..." className={buttonVariants({ variant: "default", size: "sm" })}>
    <Plus className="size-4 mr-1.5" /> Primary Action
  </Link>
</div>
```

## Page Header (Detail Pages)

```jsx
<div className="flex items-center justify-between gap-4">
  <div>
    <div className="flex items-center gap-3">
      <Link href="/admin/..." className="text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft className="size-5" />
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{Title}</h1>
      <StatusChip status={status} />
    </div>
    <p className="text-sm text-gray-500 mt-1 ml-8">{subtitle}</p>
  </div>
  <div className="flex items-center gap-2">
    {/* action buttons */}
  </div>
</div>
```

## Stat Mini-Cards

A `grid grid-cols-2 lg:grid-cols-4 gap-4` row below the page header showing key counts:

```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {statCards.map(({ label, key, accent }) => (
    <div key={key} className={cn("rounded-2xl border p-4 shadow-soft", accent)}>
      <p className="text-2xl font-bold">{counts[key] ?? 0}</p>
      <p className="text-xs uppercase tracking-wide mt-1 opacity-75">{label}</p>
    </div>
  ))}
</div>
```

Accent classes use earth-toned tokens (see `tokens.md`):
- Pending/In Discussion: `text-status-ochre bg-status-ochre/5 border-status-ochre/10`
- Approved/Confirmed/Quoted: `text-status-forest bg-status-forest/5 border-status-forest/10`
- InProgress/AwaitingDetails: `text-status-sage bg-status-sage/5 border-status-sage/10`

## Toolbar (Filter Pills + Search)

Render directly as `flex flex-col gap-3` inside `renderToolbar` — **no outer bordered panel**:

```jsx
<div className="flex flex-col gap-3">
  <div className="flex flex-wrap items-center gap-2">
    {statusOptions.map(({ label, value }) => {
      const isActive = activeFilter.has(value);
      return (
        <button
          key={value}
          type="button"
          onClick={() => toggle(value, !isActive)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200",
            isActive
              ? "border-primary bg-primary text-white shadow-sm"
              : "border-border/60 bg-white text-text-light hover:border-primary/40 hover:text-text"
          )}
        >
          {label}
          <span className="rounded-full bg-neutral px-2 py-0.5 text-[11px] font-semibold text-text">
            {counts[value] ?? 0}
          </span>
        </button>
      );
    })}
  </div>
  {/* search input */}
</div>
```

## Form Field Layout

```jsx
<div className="grid gap-4">
  <div className="grid gap-1.5">
    <Label htmlFor="field-id" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      Field Name
    </Label>
    <Input id="field-id" />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
</div>
```

Inline field pairs (side-by-side on md+):
```jsx
<div className="grid gap-4 md:grid-cols-2">
  <div className="grid gap-1.5">...</div>
  <div className="grid gap-1.5">...</div>
</div>
```

## Detail Rows (Read-Only Fields)

Use for booking/enquiry detail views:

```jsx
<dl className="divide-y divide-gray-100">
  <div className="py-3 flex gap-4">
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide w-36 shrink-0 pt-0.5">
      Label
    </dt>
    <dd className="text-sm text-gray-700 flex-1">
      Value
    </dd>
  </div>
</dl>
```

## DataTable

Import `DataTable` from `@/components/ui/data-table`. Wrap in a Card:

```jsx
<Card className="px-0">
  <CardContent>
    <DataTable
      columns={columns}
      data={data}
      onRowClick={(row) => router.push(`/admin/.../${row.id}`)}
      renderToolbar={(table) => <ToolbarComponent />}
    />
  </CardContent>
</Card>
```

## Card Grids

For item grids (spaces, rooms, etc.):

```jsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* item content */}
    </div>
  ))}
</div>
```

## Section Density Rule

Do not give a standalone `<section>` to a single data point. Merge it as a `DetailRow` into the most logically related section. Example: deposit status belongs in "Booking Specifics", not a standalone "Financial Status" card.

## Collapsible Sections

```jsx
<Collapsible>
  <CollapsibleTrigger className="flex w-full items-center justify-between bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 transition-colors">
    <span>Section Title</span>
    <ChevronDown className="size-4 text-gray-500 transition-transform data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent className="border-t border-gray-100 px-4 py-3">
    {/* content */}
  </CollapsibleContent>
</Collapsible>
```

Outer wrapper: `border border-gray-200 rounded-xl overflow-hidden`.
