import Image from "next/image";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* HCC Logo */}
      <div className="flex justify-center py-12">
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-olive-100" />
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-olive-100" />
            <div className="h-4 w-48 animate-pulse rounded-lg bg-olive-100" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-olive-100" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="h-10 w-full animate-pulse rounded-lg bg-olive-100" />

      {/* Content Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg bg-olive-100" />
        <div className="h-64 animate-pulse rounded-lg bg-olive-100" />
      </div>
      <div className="h-48 animate-pulse rounded-lg bg-olive-100" />
      <div className="h-32 animate-pulse rounded-lg bg-olive-100" />
    </div>
  );
}
