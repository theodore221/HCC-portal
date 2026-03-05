export default function MyShiftsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-3 w-44 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex gap-1.5">
                  <div className="h-9 w-20 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="h-9 w-20 rounded-lg bg-gray-100 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
