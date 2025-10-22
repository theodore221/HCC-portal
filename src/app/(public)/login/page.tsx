import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-olive-900">Sign in to HCC Portal</h1>
        <p className="text-sm text-olive-700">
          Use your Holy Cross Centre email to access the workspace that matches your
          role.
        </p>
      </header>
      <div className="space-y-4">
        <Button className="w-full">Continue with Supabase Auth</Button>
        <p className="text-xs text-olive-700">
          Staff and Caterers sign in with the credentials provided by the Admin
          team. Customers use the secure link sent via email to access their portal.
        </p>
      </div>
      <footer className="flex flex-col gap-2 text-xs text-olive-600">
        <p>
          Need help? Email <a className="font-medium" href="mailto:bookings@hcc.org.au">bookings@hcc.org.au</a>
        </p>
        <p>
          Looking for your booking steps? Visit the {" "}
          <Link className="font-medium text-olive-700" href="/portal/HCC-2411-ALPHA">
            customer portal
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
