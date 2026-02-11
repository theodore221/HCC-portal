import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative size-16 animate-pulse">
        <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" priority />
      </div>
      {/* Booking detail tabs skeleton */}
      <div className="mt-8 w-full max-w-7xl space-y-6">
        <div className="h-16 rounded-xl bg-olive-100 animate-pulse" />
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-24 rounded-lg bg-olive-100 animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-olive-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
