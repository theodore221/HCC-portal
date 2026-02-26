export default function BookingFormLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Page header skeleton */}
        <div className="text-center mb-10">
          <div className="h-10 w-72 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
          <div className="h-5 w-96 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Step indicator skeleton */}
          <div className="flex items-center mb-8 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                {i < 5 && <div className="flex-1 h-0.5 mx-2 bg-gray-200 animate-pulse" />}
              </div>
            ))}
          </div>

          {/* Form card skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            {/* HCC logo */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
            </div>

            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>

            {/* Navigation skeleton */}
            <div className="flex justify-between pt-5 border-t border-gray-100 mt-4">
              <div className="h-10 w-20 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 w-28 bg-primary/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
