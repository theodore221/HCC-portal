import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

import { getHomePathForRole } from "./src/lib/auth/paths";
import type { Database } from "./src/lib/database.types";

const PROTECTED_PREFIXES = [
  "/admin",
  "/staff",
  "/caterer",
  "/portal",
  "/profile",
  "/settings",
];

function redirectWithCookies(res: NextResponse, url: string | URL) {
  const redirectResponse = NextResponse.redirect(url);

  const middlewareSetCookie = res.headers.get("x-middleware-set-cookie");
  if (middlewareSetCookie) {
    redirectResponse.headers.set(
      "x-middleware-set-cookie",
      middlewareSetCookie
    );
  }

  for (const { name, value, ...options } of res.cookies.getAll()) {
    redirectResponse.cookies.set({ name, value, ...options });
  }

  return redirectResponse;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, search } = req.nextUrl;
  const isLoginRoute = pathname === "/login";
  const isPasswordSetupRoute = pathname === "/password-setup";
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!session?.user) {
    if (isLoginRoute || (!isProtectedRoute && !isPasswordSetupRoute)) {
      return res;
    }

    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    return redirectWithCookies(res, redirectUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, booking_reference, guest_token, password_initialized_at")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = profile?.role ?? null;
  const destinationHome = getHomePathForRole(
    role,
    profile?.booking_reference ?? null
  );
  const requiresPasswordSetup = !profile?.password_initialized_at;

  if (requiresPasswordSetup && !isPasswordSetupRoute) {
    return redirectWithCookies(res, new URL("/password-setup", req.url));
  }

  if (!requiresPasswordSetup && isPasswordSetupRoute) {
    return redirectWithCookies(res, new URL(destinationHome, req.url));
  }

  if (isLoginRoute) {
    return redirectWithCookies(res, new URL(destinationHome, req.url));
  }

  if (!isProtectedRoute) {
    return res;
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return redirectWithCookies(res, new URL(destinationHome, req.url));
  }

  if (pathname.startsWith("/staff") && !["staff", "admin"].includes(role)) {
    return redirectWithCookies(res, new URL(destinationHome, req.url));
  }

  if (pathname.startsWith("/caterer") && !["caterer", "admin"].includes(role)) {
    return redirectWithCookies(res, new URL(destinationHome, req.url));
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
      return redirectWithCookies(res, new URL(destinationHome, req.url));
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
    "/login",
    "/password-setup",
    "/admin/:path*",
    "/staff/:path*",
    "/caterer/:path*",
    "/portal/:path*",
    "/profile",
    "/settings",
  ],
};
