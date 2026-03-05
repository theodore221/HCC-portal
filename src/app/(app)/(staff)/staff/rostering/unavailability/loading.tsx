export default function UnavailabilityLoading() {
  return (
    <div className="space-y-8">
      {/* Period unavailability skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
            ))}
            <div className="h-20 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-9 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 h-16 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Weekly planner skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-40 rounded bg-gray-100 animate-pulse mb-4" />
        <div className="h-64 rounded-lg bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
