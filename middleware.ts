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
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!session?.user) {
    if (isLoginRoute || !isProtectedRoute) {
      return res;
    }

    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, booking_reference, guest_token")
    .eq("id", session.user.id)
    .maybeSingle();

  const destinationHome = getHomePathForRole(profile?.role ?? null, profile?.booking_reference ?? null);

  if (isLoginRoute) {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (!isProtectedRoute) {
    return res;
  }

  if (pathname.startsWith("/admin") && profile?.role !== "admin") {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (pathname.startsWith("/staff") && profile?.role !== "staff") {
    return NextResponse.redirect(new URL(destinationHome, req.url));
  }

  if (pathname.startsWith("/caterer") && profile?.role !== "caterer") {
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
        return NextResponse.redirect(new URL("/portal", req.url));
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
    "/admin/:path*",
    "/staff/:path*",
    "/caterer/:path*",
    "/portal/:path*",
    "/profile",
    "/settings",
  ],
};
