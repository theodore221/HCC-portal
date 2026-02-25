export default function EnquiryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* HCC logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
        </div>

        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-9 w-64 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
          <div className="h-5 w-96 bg-gray-100 rounded mx-auto animate-pulse" />
        </div>

        {/* Info cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 space-y-2"
            >
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Form skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* 7 field placeholders */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}

          {/* Textarea placeholder */}
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-28 w-full bg-gray-100 rounded-lg animate-pulse" />
          </div>

          {/* Submit button */}
          <div className="h-11 w-full bg-blue-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
