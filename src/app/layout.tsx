import type { Metadata } from "next";
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
      <body className="min-h-screen bg-neutral text-text">{children}</body>
    </html>
  );
}
