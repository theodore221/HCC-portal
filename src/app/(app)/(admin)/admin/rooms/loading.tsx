import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative size-16 animate-pulse">
        <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" priority />
      </div>
      {/* Room grid skeleton */}
      <div className="mt-8 w-full max-w-7xl space-y-6">
        <div className="h-12 rounded-xl bg-olive-100 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-olive-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
