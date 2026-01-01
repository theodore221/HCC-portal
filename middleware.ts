import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getHomePathForRole } from "./src/lib/auth/paths";
import type { Database, ProfileRole } from "./src/lib/database.types";

const PROTECTED_PREFIXES = [
  "/admin",
  "/staff",
  "/caterer",
  "/portal",
  "/profile",
  "/settings",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, search } = req.nextUrl;
  const isLoginRoute = pathname === "/login";
  const isRootRoute = pathname === "/";
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!session?.user) {
    if (isRootRoute) {
      const redirectResponse = NextResponse.redirect(new URL("/login", req.url));
      return redirectResponse;
    }

    if (isLoginRoute || !isProtectedRoute) {
      return res;
    }

    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    return redirectResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, booking_reference, guest_token")
    .eq("id", session.user.id)
    .maybeSingle() as { data: { role: ProfileRole; booking_reference: string | null; guest_token: string | null } | null };

  const role = profile?.role ?? null;
  const destinationHome = getHomePathForRole(
    role,
    profile?.booking_reference ?? null
  );

  if (isLoginRoute || isRootRoute) {
    const redirectResponse = NextResponse.redirect(new URL(destinationHome, req.url));
    return redirectResponse;
  }

  if (!isProtectedRoute) {
    return res;
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const redirectResponse = NextResponse.redirect(new URL(destinationHome, req.url));
    return redirectResponse;
  }

  if (pathname.startsWith("/staff") && (!role || !["staff", "admin"].includes(role))) {
    const redirectResponse = NextResponse.redirect(new URL(destinationHome, req.url));
    return redirectResponse;
  }

  if (pathname.startsWith("/caterer") && (!role || !["caterer", "admin"].includes(role))) {
    const redirectResponse = NextResponse.redirect(new URL(destinationHome, req.url));
    return redirectResponse;
  }

  if (pathname.startsWith("/portal")) {
    const match = pathname.match(/^\/portal\/?([^/]+)?/);
    const requestedRef = match?.[1] ?? null;
    const guestToken = req.nextUrl.searchParams.get("guest");
    const hasGuestAccess = Boolean(
      guestToken && profile?.guest_token && guestToken === profile.guest_token
    );

    // If not a customer and no guest access, redirect home
    if (profile?.role !== "customer" && !hasGuestAccess) {
      const redirectResponse = NextResponse.redirect(new URL(destinationHome, req.url));
      return redirectResponse;
    }

    // If customer, they can access /portal (home) or /portal/[ref] (detail)
    // We no longer enforce a single booking reference in the profile.
    // Access control to specific bookings will be handled by RLS/Page logic.
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - auth/callback (authentication callback handler)
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!auth/callback|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
