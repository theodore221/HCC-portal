import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/catering/jobs", label: "Catering Jobs" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/audit", label: "Audit" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px,1fr]">
      <aside className="space-y-6 rounded-2xl border border-olive-100 bg-white p-6 shadow-soft">
        <div>
          <p className="text-xs uppercase tracking-wide text-olive-600">Admin</p>
          <h2 className="text-lg font-semibold text-olive-900">Control panel</h2>
        </div>
        <nav className="space-y-2 text-sm font-medium text-olive-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 hover:bg-olive-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="space-y-6">{children}</section>
    </div>
  );
}
