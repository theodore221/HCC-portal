import { AppHeader } from "@/components/layout/app-header";
import { getNavigationForRole } from "@/lib/auth/paths";
import { getCurrentProfile } from "@/lib/auth/server";

const shellWidthClass =
  "mx-auto w-full max-w-[min(100vw-2rem,96rem)] px-4 sm:px-6 lg:px-8";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, profile } = await getCurrentProfile();
  const navItems = getNavigationForRole(
    profile?.role ?? null,
    profile?.booking_reference ?? null
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        navItems={navItems}
        profile={profile}
        sessionEmail={session?.user.email ?? null}
        shellWidthClass={shellWidthClass}
      />
      <main className="flex-1 pt-16">
        <div className={`${shellWidthClass} flex flex-1 pb-12 pt-8`}>
          <div className="flex w-full flex-col rounded-[2.5rem] border border-border/70 bg-white p-6 shadow-soft transition-all duration-200 sm:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </main>
      <SupportFooter />
    </div>
  );
}

function SupportFooter() {
  return (
    <footer className="border-t border-border/70 bg-white/90 backdrop-blur-sm">
      <div
        className={`${shellWidthClass} flex flex-col gap-3 py-4 text-xs text-text-light sm:flex-row sm:items-center sm:justify-between sm:text-sm`}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary shadow-soft">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
            Systems operational
          </span>
          <span className="hidden text-text-light sm:inline">
            Updated{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-text-light sm:flex-row sm:items-center sm:gap-4">
          <span>© {new Date().getFullYear()} Holy Cross Centre</span>
          <span className="hidden sm:inline">v1.0 · Internal preview</span>
          <a
            href="/support"
            className="font-semibold text-primary transition-colors hover:text-primary-light"
          >
            Contact support
          </a>
        </div>
      </div>
    </footer>
  );
}
