import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "HCC Portal",
  description: "Holy Cross Centre booking and operations portal",
  icons: {
    icon: "/logo_notext.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-neutral text-text`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
