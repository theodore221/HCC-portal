import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative size-16 animate-pulse">
        <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" priority />
      </div>
      <div className="mt-8 w-full max-w-3xl space-y-4">
        <div className="h-10 w-48 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-80 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
