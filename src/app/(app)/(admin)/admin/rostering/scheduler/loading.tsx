import Image from "next/image";

export default function SchedulerLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-5 w-28 rounded bg-gray-100 animate-pulse" />
          <div className="flex gap-1">
            <div className="size-7 rounded-lg bg-gray-100 animate-pulse" />
            <div className="size-7 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse mx-0.5" />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="relative size-10 animate-pulse opacity-30">
          <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" />
        </div>
        <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
