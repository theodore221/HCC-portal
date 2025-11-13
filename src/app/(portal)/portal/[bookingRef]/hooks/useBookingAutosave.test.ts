import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBookingAutosave } from "./useBookingAutosave";

describe("useBookingAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("debounces metadata PATCH requests and reports saved status", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ metadata: { notes: "final" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const { result } = renderHook(() =>
      useBookingAutosave({ bookingId: "abc", debounceMs: 200 }),
    );

    act(() => {
      result.current.updateMetadata({ notes: "draft" });
      result.current.updateMetadata({ notes: "final" });
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status.isDirty).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/bookings/abc/metadata",
      expect.objectContaining({ method: "PATCH" }),
    );

    expect(result.current.status.isSaved).toBe(true);
    expect(result.current.status.lastSavedAt).not.toBeNull();
  });

  it("tracks external operations in the status indicator", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ metadata: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { result } = renderHook(() =>
      useBookingAutosave({ bookingId: "abc", debounceMs: 50 }),
    );

    const deferred = createDeferred<void>();

    act(() => {
      void result.current.trackOperation(deferred.promise);
    });

    expect(result.current.status.isSaving).toBe(true);

    await act(async () => {
      deferred.resolve();
      await deferred.promise;
      await Promise.resolve();
    });

    expect(result.current.status.isSaved).toBe(true);
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
