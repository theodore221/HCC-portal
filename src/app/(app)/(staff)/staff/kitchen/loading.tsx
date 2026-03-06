import Image from "next/image";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="h-6 w-24 rounded-lg bg-gray-100 animate-pulse mb-2" />
        <div className="h-4 w-56 rounded-lg bg-gray-100 animate-pulse" />
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[1fr,minmax(380px,45%)] md:gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[52px] md:min-h-[80px] rounded bg-gray-50 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-12">
          <div className="flex flex-col items-center gap-3 opacity-40">
            <Image src="/hcc-logo.png" alt="HCC" width={48} height={48} className="opacity-30" />
            <p className="text-sm text-gray-400">Select a date to view jobs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
