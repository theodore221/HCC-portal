import Image from "next/image";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-24 animate-pulse">
          <Image
            src="/hcc_logo.svg"
            alt="HCC Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <p className="text-sm font-medium text-text-light animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
