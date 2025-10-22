import Link from "next/link";

export default function CatererLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-medium text-olive-700">
        <Link href="/caterer" className="rounded-full bg-olive-100 px-4 py-2">
          Dashboard
        </Link>
        <Link href="/caterer/jobs" className="rounded-full bg-white px-4 py-2 shadow-soft">
          My jobs
        </Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
