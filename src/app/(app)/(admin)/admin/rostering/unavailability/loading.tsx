export default function UnavailabilityLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
              </div>
              <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
