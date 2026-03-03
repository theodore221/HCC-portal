import Image from "next/image";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative">
        <div
          className="absolute inset-0 -m-3 animate-spin rounded-full border-4 border-gray-200 border-t-primary"
          style={{ width: "120px", height: "120px" }}
        />
        <div className="relative z-10 size-24">
          <Image
            src="/hcc_logo.svg"
            alt="HCC Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
