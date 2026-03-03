import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — hidden on mobile */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[45%] lg:flex-col lg:items-center lg:justify-center bg-gradient-to-br from-primary to-primary-light">
        {/* Radial gradient overlay for depth */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,0,0,0.15) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
          <Image
            src="/logo_notext_white.svg"
            alt="Holy Cross Centre"
            width={96}
            height={96}
            className="drop-shadow-lg"
            priority
          />
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Holy Cross Centre
            </h1>
            <p className="text-base leading-relaxed text-white/80">
              Managed booking &amp; catering
              <br />
              for retreats and events
            </p>
          </div>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-border/70 px-6 py-4 lg:hidden">
          <Image
            src="/logo_notext.svg"
            alt="Holy Cross Centre"
            width={32}
            height={32}
          />
          <span className="text-sm font-semibold text-gray-900">
            Holy Cross Centre
          </span>
        </header>

        {/* Form area */}
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          {children}
        </main>

        {/* Compact footer */}
        <footer className="px-6 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Holy Cross Centre · Need help?{" "}
          <a
            href="mailto:hcc@passionists.com.au"
            className="font-medium text-gray-500 hover:text-gray-700"
          >
            hcc@passionists.com.au
          </a>
        </footer>
      </div>
    </div>
  );
}
