import Image from "next/image";

interface AuthLoadingStateProps {
  title?: string;
  subtitle?: string;
}

export function AuthLoadingState({
  title = "Loading",
  subtitle,
}: AuthLoadingStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 py-12">
      <div className="relative">
        <div
          className="absolute inset-0 -m-3 animate-spin rounded-full border-4 border-gray-200 border-t-primary"
          style={{ width: "120px", height: "120px" }}
        />
        <div
          className="absolute inset-0 -m-2 animate-pulse rounded-full bg-gray-100/50"
          style={{ width: "112px", height: "112px" }}
        />
        <div className="relative z-10 size-24">
          <Image
            src="/hcc_logo.svg"
            alt="HCC Logo"
            fill
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-gray-900">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex gap-1">
        <span
          className="size-1.5 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="size-1.5 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="size-1.5 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
