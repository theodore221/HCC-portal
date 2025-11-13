"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AutosavePhase = "idle" | "dirty" | "saving" | "saved" | "error";

type MetadataRecord = Record<string, unknown>;

type MetadataPatch<T extends MetadataRecord> =
  | Partial<T>
  | ((previous: T) => T);

export interface AutosaveStatus {
  phase: AutosavePhase;
  isIdle: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isSaved: boolean;
  isError: boolean;
  error: string | null;
  lastSavedAt: number | null;
}

interface UseBookingAutosaveOptions<T extends MetadataRecord> {
  bookingId: string;
  initialData?: T;
  debounceMs?: number;
}

interface UseBookingAutosaveReturn<T extends MetadataRecord> {
  metadata: T;
  updateMetadata: (
    patch: MetadataPatch<T>,
    options?: { flush?: boolean },
  ) => void;
  flush: () => Promise<void>;
  status: AutosaveStatus;
  clearError: () => void;
  trackOperation: <R>(operation: Promise<R>) => Promise<R>;
}

function computeStatus(
  phase: AutosavePhase,
  error: string | null,
  lastSavedAt: number | null,
): AutosaveStatus {
  return {
    phase,
    isIdle: phase === "idle",
    isDirty: phase === "dirty",
    isSaving: phase === "saving",
    isSaved: phase === "saved",
    isError: phase === "error",
    error,
    lastSavedAt,
  } satisfies AutosaveStatus;
}

function mergePatch<T extends MetadataRecord>(current: T, patch: Partial<T>): T {
  const next = { ...current } as T;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      delete (next as MetadataRecord)[key];
    } else {
      (next as MetadataRecord)[key] = value;
    }
  }
  return next;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch (serializationError) {
    console.error("Failed to serialise autosave error", serializationError);
    return "Something went wrong while saving.";
  }
}

export function useBookingAutosave<T extends MetadataRecord = MetadataRecord>(
  options: UseBookingAutosaveOptions<T>,
): UseBookingAutosaveReturn<T> {
  const { bookingId, initialData, debounceMs = 800 } = options;

  const initialRef = useRef<T>((initialData ?? ({} as T)) as T);
  const initialSerializedRef = useRef<string>(
    JSON.stringify(initialRef.current),
  );
  const [metadata, setMetadata] = useState<T>(initialRef.current);
  const [status, setStatus] = useState<AutosaveStatus>(() =>
    computeStatus("idle", null, null),
  );

  const latestMetadataRef = useRef<T>(initialRef.current);
  const latestSerializedRef = useRef<string>(initialSerializedRef.current);
  const lastSavedSerializedRef = useRef<string>(initialSerializedRef.current);
  const hasPendingChangesRef = useRef<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const operationsInFlightRef = useRef(0);
  const mountedRef = useRef(true);
  const lastSavedAtRef = useRef<number | null>(null);

  const setStatusSafely = useCallback(
    (updater: (prev: AutosaveStatus) => AutosaveStatus) => {
      if (!mountedRef.current) return;
      setStatus((previous) => {
        if (!mountedRef.current) return previous;
        const next = updater(previous);
        lastSavedAtRef.current = next.lastSavedAt;
        return next;
      });
    },
    [],
  );

  const setPhase = useCallback(
    (
      phase: AutosavePhase,
      overrides?: { error?: string | null; lastSavedAt?: number | null },
    ) => {
      setStatusSafely((previous) => {
        const nextError =
          overrides?.error ?? (phase === "error" ? previous.error : null);
        const nextLastSavedAt =
          overrides?.lastSavedAt ?? previous.lastSavedAt;
        return computeStatus(phase, nextError, nextLastSavedAt);
      });
    },
    [setStatusSafely],
  );

  const beginOperation = useCallback(() => {
    operationsInFlightRef.current += 1;
    setPhase("saving", { error: null });
  }, [setPhase]);

  const finishOperation = useCallback(
    (
      result: "success" | "error" | "aborted",
      overrides?: { error?: string; lastSavedAt?: number },
    ) => {
      operationsInFlightRef.current = Math.max(
        0,
        operationsInFlightRef.current - 1,
      );

      if (result === "error") {
        setPhase("error", { error: overrides?.error ?? null });
        return;
      }

      if (result === "aborted") {
        if (operationsInFlightRef.current === 0) {
          const basePhase = hasPendingChangesRef.current
            ? "dirty"
            : lastSavedAtRef.current !== null
            ? "saved"
            : "idle";
          setPhase(basePhase, { error: null });
        }
        return;
      }

      if (operationsInFlightRef.current === 0) {
        const pending = hasPendingChangesRef.current;
        setPhase(
          pending ? "dirty" : "saved",
          pending
            ? { error: null }
            : { error: null, lastSavedAt: overrides?.lastSavedAt ?? Date.now() },
        );
      }
    },
    [setPhase],
  );

  const clearError = useCallback(() => {
    setStatusSafely((previous) => {
      if (!previous.isError) return previous;
      const phase = hasPendingChangesRef.current
        ? "dirty"
        : lastSavedAtRef.current !== null
        ? "saved"
        : "idle";
      return computeStatus(phase, null, lastSavedAtRef.current);
    });
  }, [setStatusSafely]);

  const trackOperation = useCallback(
    async <R>(operation: Promise<R>) => {
      beginOperation();
      try {
        const result = await operation;
        finishOperation("success");
        return result;
      } catch (error) {
        finishOperation("error", { error: getErrorMessage(error) });
        throw error;
      }
    },
    [beginOperation, finishOperation],
  );

  const flush = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!hasPendingChangesRef.current) {
      return;
    }

    const snapshot = latestMetadataRef.current;
    const serializedSnapshot = latestSerializedRef.current;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    beginOperation();

    try {
      const response = await fetch(
        `/api/portal/bookings/${bookingId}/metadata`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: snapshot }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to save booking metadata");
      }

      let resolved: unknown = null;
      try {
        resolved = await response.json();
      } catch {
        resolved = null;
      }

      const nextMetadata =
        resolved && typeof resolved === "object" && "metadata" in resolved
          ? (resolved.metadata as T)
          : snapshot;

      const serializedSaved = JSON.stringify(nextMetadata);
      lastSavedSerializedRef.current = serializedSaved;

      const hasNewerChanges = latestSerializedRef.current !== serializedSnapshot;
      if (!hasNewerChanges) {
        latestSerializedRef.current = serializedSaved;
        latestMetadataRef.current = nextMetadata;
        if (mountedRef.current) {
          setMetadata(nextMetadata);
        }
      }

      hasPendingChangesRef.current =
        latestSerializedRef.current !== lastSavedSerializedRef.current;

      finishOperation("success", { lastSavedAt: Date.now() });
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        finishOperation("aborted");
        return;
      }

      finishOperation("error", { error: getErrorMessage(error) });
    }
  }, [beginOperation, bookingId, finishOperation]);

  const scheduleFlush = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    debounceRef.current = setTimeout(() => {
      void flush();
    }, debounceMs);
  }, [debounceMs, flush]);

  const updateMetadata = useCallback(
    (
      patch: MetadataPatch<T>,
      options?: { flush?: boolean },
    ) => {
      const current = latestMetadataRef.current;
      const next =
        typeof patch === "function" ? patch(current) : mergePatch(current, patch);
      const serialized = JSON.stringify(next);

      const changed = serialized !== latestSerializedRef.current;
      latestMetadataRef.current = next;
      latestSerializedRef.current = serialized;

      if (mountedRef.current) {
        setMetadata(next);
      }

      hasPendingChangesRef.current =
        serialized !== lastSavedSerializedRef.current;

      if (hasPendingChangesRef.current) {
        setPhase("dirty", { error: null });
        scheduleFlush();
        if (options?.flush) {
          void flush();
        }
      } else if (operationsInFlightRef.current === 0) {
        const fallbackPhase =
          lastSavedSerializedRef.current === serialized &&
          lastSavedAtRef.current !== null
            ? "saved"
            : "idle";
        setPhase(fallbackPhase, { error: null });
      }

      if (!changed && options?.flush) {
        void flush();
      }
    },
    [flush, scheduleFlush, setPhase],
  );

  useEffect(() => {
    latestMetadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    metadata,
    updateMetadata,
    flush,
    status,
    clearError,
    trackOperation,
  };
}
