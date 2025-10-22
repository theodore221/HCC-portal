import Link from "next/link";

const navItems = [
  { href: "/staff", label: "Dashboard" },
  { href: "/staff/schedule", label: "Schedule" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-medium text-olive-700">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-full bg-olive-100 px-4 py-2">
            {item.label}
          </Link>
        ))}
        <Link href="/staff/run-sheets/bkg_001/2025-11-13" className="rounded-full bg-white px-4 py-2 shadow-soft">
          Run sheets
        </Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
