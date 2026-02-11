import Image from "next/image";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* HCC Logo */}
      <div className="flex justify-center py-8">
        <div className="relative h-16 w-16 animate-pulse">
          <Image
            src="/hcc_logo.svg"
            alt="Loading"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-olive-100" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-olive-100" />
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-olive-100" />
        ))}
      </div>

      {/* Filter Pills Skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-10 w-32 animate-pulse rounded-full bg-olive-100" />
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-10 w-full animate-pulse rounded-lg bg-olive-100" />

      {/* Table Skeleton */}
      <div className="space-y-4 rounded-lg border border-olive-100 bg-white p-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-olive-50" />
        ))}
      </div>
    </div>
  );
}
