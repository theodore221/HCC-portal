export default function TimesheetLoading() {
  return (
    <div className="space-y-4">
      {/* Period nav skeleton */}
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-5 w-56 rounded bg-gray-100 animate-pulse" />
        <div className="size-8 rounded-lg bg-gray-100 animate-pulse" />
      </div>

      {/* Summary skeleton */}
      <div className="flex items-center gap-6">
        <div className="h-9 w-28 rounded bg-gray-100 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>

      {/* Log button skeleton */}
      <div className="flex justify-end">
        <div className="h-8 w-32 rounded-lg bg-gray-100 animate-pulse" />
      </div>

      {/* Split panel skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* List column */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
              </div>
              <div className="h-3 w-36 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Detail column (hidden on mobile) */}
        <div className="hidden lg:flex items-center justify-center rounded-2xl border border-dashed border-gray-200 min-h-[400px]">
          <p className="text-sm text-gray-300">Select a timesheet to view details</p>
        </div>
      </div>
    </div>
  );
}
