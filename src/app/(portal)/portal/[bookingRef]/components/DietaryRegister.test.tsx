import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DietaryRegister } from "./DietaryRegister";
import type { DietaryProfile } from "@/lib/queries/bookings";

describe("DietaryRegister", () => {
  const baseProfile: DietaryProfile = {
    id: "diet-1",
    booking_id: "booking-1",
    person_name: "Alex",
    diet_type: "Vegetarian",
    allergy: null,
    severity: null,
    notes: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("performs optimistic updates while saving a row", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<Response>();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => deferred.promise);

    render(
      <DietaryRegister
        bookingId="booking-1"
        initialProfiles={[baseProfile]}
        trackStatus={(operation) => operation}
      />,
    );

    const dietInput = screen.getByPlaceholderText("E.g. Vegetarian") as HTMLInputElement;
    await user.clear(dietInput);
    await user.type(dietInput, "Vegan");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dietInput.value).toBe("Vegan");
    expect(screen.getByText(/saving/i)).toBeInTheDocument();

    const savedResponse = new Response(
      JSON.stringify({
        profile: { ...baseProfile, diet_type: "Vegan" },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

    await act(async () => {
      deferred.resolve(savedResponse);
      await deferred.promise;
    });

    await waitFor(() => expect(screen.queryByText(/saving/i)).not.toBeInTheDocument());
    expect(dietInput.value).toBe("Vegan");
  });

  it("shows validation errors and recovers from server failures", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("Something broke", { status: 500, statusText: "Error" }),
      );

    render(
      <DietaryRegister
        bookingId="booking-1"
        initialProfiles={[baseProfile]}
        trackStatus={(operation) => operation}
      />,
    );

    await user.clear(screen.getByPlaceholderText("E.g. Vegetarian"));
    await user.type(screen.getByPlaceholderText("E.g. Vegetarian"), "Coeliac");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText(/something broke/i)).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          profile: { ...baseProfile, diet_type: "Coeliac" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(screen.queryByText(/something broke/i)).not.toBeInTheDocument());
  });
});

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
