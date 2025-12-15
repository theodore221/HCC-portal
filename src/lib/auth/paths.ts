import type { ProfileRole } from "@/lib/database.types";

export function getHomePathForRole(
  role: ProfileRole | null | undefined,
  bookingReference?: string | null
) {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/staff";
    case "caterer":
      return "/caterer";
    case "customer":
      return "/portal";
    default:
      return "/";
  }
}

export function getNavigationForRole(
  role: ProfileRole | null | undefined,
  bookingReference?: string | null
) {
  switch (role) {
    case "admin":
      return [
        { href: "/admin", label: "Admin" },
        { href: "/staff", label: "Staff" },
        { href: "/caterer", label: "Caterer" },
      ];
    case "staff":
      return [{ href: "/staff", label: "Staff" }];
    case "caterer":
      return [{ href: "/caterer", label: "Caterer" }];
    case "customer":
      return [{ href: "/portal", label: "My Bookings" }];
    default:
      return [];
  }
}
