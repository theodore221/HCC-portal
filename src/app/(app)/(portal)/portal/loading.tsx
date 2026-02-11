import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative size-16 animate-pulse">
        <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" priority />
      </div>
      {/* Portal skeleton */}
      <div className="mt-8 w-full max-w-3xl space-y-6">
        <div className="h-24 rounded-xl bg-olive-100 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-olive-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
