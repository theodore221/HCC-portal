import { describe, expect, it } from "vitest";

import {
  deriveProfileAttributes,
  MissingBookingLinkError,
  MissingCatererLinkError,
} from "./profile-domain";

const baseContext = {
  userId: "user-1",
  userEmail: "guest@example.com",
  metadata: {
    role: null as string | null,
    booking_reference: null as string | null,
    guest_token: null as string | null,
    caterer_id: null as string | null,
  },
  booking: null,
  matchedCatererId: null,
  fallbackCatererId: null,
};

describe("deriveProfileAttributes", () => {
  it("respects admin role requests", () => {
    const result = deriveProfileAttributes({
      ...baseContext,
      metadata: { ...baseContext.metadata, role: "admin" },
    });

    expect(result.role).toBe("admin");
  });

  it("treats guest role metadata as customer when no caterer is linked", () => {
    const result = deriveProfileAttributes({
      ...baseContext,
      metadata: { ...baseContext.metadata, role: "guest" },
    });

    expect(result.role).toBe("customer");
  });

  it("throws when a requested booking link cannot be verified", () => {
    expect(() =>
      deriveProfileAttributes({
        ...baseContext,
        metadata: { ...baseContext.metadata, booking_reference: "BK-123" },
      })
    ).toThrow(MissingBookingLinkError);
  });

  it("throws when a requested caterer link cannot be verified", () => {
    expect(() =>
      deriveProfileAttributes({
        ...baseContext,
        metadata: { ...baseContext.metadata, caterer_id: "caterer-1" },
      })
    ).toThrow(MissingCatererLinkError);
  });
});

