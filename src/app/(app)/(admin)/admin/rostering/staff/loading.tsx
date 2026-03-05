export default function StaffLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
        <div className="h-8 w-28 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gray-100 animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-36 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
