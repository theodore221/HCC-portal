import Image from "next/image";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-gray-50/30 to-gray-100/40 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        {/* Animated ring container */}
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 -m-3 rounded-full border-4 border-gray-200 border-t-primary animate-spin" style={{ width: '120px', height: '120px' }} />

          {/* Inner pulsing glow */}
          <div className="absolute inset-0 -m-2 rounded-full bg-gray-100/50 animate-pulse" style={{ width: '112px', height: '112px' }} />

          {/* Logo */}
          <div className="relative size-24 z-10">
            <Image
              src="/hcc_logo.svg"
              alt="HCC Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Loading text with animated dots */}
        <div className="flex items-center gap-1">
          <p className="text-base font-semibold text-gray-800">
            Loading
          </p>
          <span className="flex gap-1">
            <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>
    </div>
  );
}
