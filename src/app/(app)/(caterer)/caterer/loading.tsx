import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative size-16 animate-pulse">
        <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" priority />
      </div>
      {/* Caterer dashboard skeleton */}
      <div className="mt-8 w-full max-w-4xl space-y-6">
        <div className="h-48 rounded-xl bg-olive-100 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-olive-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
