import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HCC Portal",
  description: "Holy Cross Centre booking and operations portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-olive-50/60">
          <header className="sticky top-0 z-50 border-b border-olive-100 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-600 text-lg font-bold text-white">
                  HCC
                </div>
                <div>
                  <p className="text-sm font-semibold text-olive-900">
                    Holy Cross Centre Portal
                  </p>
                  <p className="text-xs text-olive-700">
                    Booking · Catering · Accommodation
                  </p>
                </div>
              </div>
              <nav className="hidden items-center gap-4 text-sm font-medium text-olive-700 md:flex">
                <Link href="/admin/bookings">Admin</Link>
                <Link href="/staff">Staff</Link>
                <Link href="/caterer">Caterer</Link>
                <Link href="/portal/HCC-2411-ALPHA">Customer Portal</Link>
              </nav>
            </div>
          </header>
          <main className="px-6 py-10">{children}</main>
          <footer className="border-t border-olive-100 bg-white/90">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-olive-700 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} Holy Cross Centre</span>
              <span>Version 1.0 · Internal preview</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
