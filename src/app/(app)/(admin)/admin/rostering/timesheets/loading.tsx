export default function TimesheetsLoading() {
  return (
    <div className="space-y-6">
      {/* HCC logo pulse */}
      <div className="flex justify-start py-1">
        <div className="size-8 rounded-full bg-gray-100 animate-pulse" />
      </div>

      {/* Date picker skeleton */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-8 w-36 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-5 w-52 rounded bg-gray-100 animate-pulse" />
        <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
      </div>

      {/* Sort + action bar skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-8 w-52 rounded-full bg-gray-100 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-32 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>

      {/* Split layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        {/* Left: card list */}
        <div className="space-y-2">
          <div className="h-9 rounded-xl bg-gray-50 border border-gray-200 animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="h-5 w-20 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
          <div className="h-9 rounded-xl bg-gray-50 border border-gray-200 animate-pulse" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Right: empty state placeholder (no timesheet selected on initial load) */}
        <div className="hidden lg:flex items-center justify-center rounded-xl border border-dashed border-gray-200 min-h-[400px]">
          <div className="h-4 w-48 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
