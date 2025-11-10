import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

import { getHomePathForRole } from "./src/lib/auth/paths";
import type { Database } from "./src/lib/database.types";

const PROTECTED_PREFIXES = ["/admin", "/staff", "/caterer", "/portal", "/profile", "/settings"];

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
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, booking_reference, guest_token, password_initialized_at")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = profile?.role ?? null;
  const destinationHome = getHomePathForRole(role, profile?.booking_reference ?? null);
  const requiresPasswordSetup = !profile?.password_initialized_at;

  if (requiresPasswordSetup && !isPasswordSetupRoute) {
    return NextResponse.redirect(new URL("/password-setup", req.url));
  }

  if (!requiresPasswordSetup && isPasswordSetupRoute) {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (!isProtectedRoute) {
    return res;
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (pathname.startsWith("/staff") && !["staff", "admin"].includes(role)) {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (pathname.startsWith("/caterer") && !["caterer", "admin"].includes(role)) {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (pathname.startsWith("/portal")) {
    const match = pathname.match(/^\/portal\/?([^/]+)?/);
    const requestedRef = match?.[1] ?? null;
    const guestToken = req.nextUrl.searchParams.get("guest");
    const hasGuestAccess = Boolean(guestToken && profile?.guest_token && guestToken === profile.guest_token);

    if (profile?.role !== "customer" && !hasGuestAccess) {
      return NextResponse.redirect(new URL(destinationHome, req.url));
    }

    if (profile?.role === "customer") {
      const profileRef = profile.booking_reference;
      if (!profileRef) {
        if (requestedRef) {
          return NextResponse.redirect(new URL("/portal", req.url));
        }

        return res;
      }

      if (requestedRef && requestedRef !== profileRef && !hasGuestAccess) {
        return NextResponse.redirect(new URL(`/portal/${profileRef}`, req.url));
      }
    }
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
