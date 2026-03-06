import Image from "next/image";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Calendar + sidebar skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar fills left column */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-32 rounded-lg bg-gray-100 animate-pulse" />
            <div className="flex gap-1">
              <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[80px] rounded-xl bg-gray-50 animate-pulse"
                style={{ animationDelay: `${i * 20}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Sidebar placeholder */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-8 w-20 rounded-full bg-gray-100 animate-pulse" />
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 h-48">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <Image src="/hcc-logo.png" alt="HCC" width={40} height={40} className="opacity-30" />
              <p className="text-sm text-gray-400">Select a date to view jobs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
