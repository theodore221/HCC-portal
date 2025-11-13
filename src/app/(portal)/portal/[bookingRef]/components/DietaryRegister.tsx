"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DietaryProfile } from "@/lib/queries/bookings";

const severityOptions = [
  { value: "", label: "None" },
  { value: "Low", label: "Low" },
  { value: "Moderate", label: "Moderate" },
  { value: "High", label: "High" },
  { value: "Fatal", label: "Fatal" },
];

type DraftProfile = {
  person_name: string;
  diet_type: string;
  allergy: string;
  severity: DietaryProfile["severity"] | "";
};

type RowState = {
  key: string;
  profile: DietaryProfile;
  draft: DraftProfile;
  isNew: boolean;
  dirty: boolean;
  isSaving: boolean;
  error: string | null;
};

function mapProfileToDraft(profile: DietaryProfile): DraftProfile {
  return {
    person_name: profile.person_name ?? "",
    diet_type: profile.diet_type ?? "",
    allergy: profile.allergy ?? "",
    severity: (profile.severity ?? "") as DraftProfile["severity"],
  };
}

function createRowState(
  profile: DietaryProfile,
  options?: { key?: string; isNew?: boolean },
): RowState {
  const key = options?.key ?? profile.id;
  const isNew = options?.isNew ?? false;
  const draft = mapProfileToDraft(profile);
  return {
    key,
    profile,
    draft,
    isNew,
    dirty: isNew,
    isSaving: false,
    error: null,
  };
}

function draftsMatch(profile: DietaryProfile, draft: DraftProfile) {
  return (
    profile.person_name === draft.person_name.trim() &&
    profile.diet_type === draft.diet_type.trim() &&
    (profile.allergy ?? "") === draft.allergy.trim() &&
    (profile.severity ?? "") === (draft.severity ?? "")
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch (serializationError) {
    console.error("Failed to serialise dietary register error", serializationError);
    return "Something went wrong. Please try again.";
  }
}

export interface DietaryRegisterProps {
  bookingId: string;
  initialProfiles: DietaryProfile[];
  trackStatus?: <T>(operation: Promise<T>) => Promise<T>;
}

export function DietaryRegister({
  bookingId,
  initialProfiles,
  trackStatus,
}: DietaryRegisterProps) {
  const tempKeyRef = useRef(0);
  const [rows, setRows] = useState<RowState[]>(() =>
    initialProfiles.map((profile) => createRowState(profile)),
  );
  const rowsRef = useRef<RowState[]>(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    setRows((current) => synchronizeRows(current, initialProfiles));
  }, [initialProfiles]);

  const runWithStatus = useCallbackWrapper(trackStatus);

  const handleFieldChange = (
    rowKey: string,
    field: keyof DraftProfile,
    value: string,
  ) => {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== rowKey) return row;
        const nextDraft = { ...row.draft, [field]: value } as DraftProfile;
        const dirty = row.isNew || !draftsMatch(row.profile, nextDraft);
        return {
          ...row,
          draft: nextDraft,
          dirty,
          error: null,
        };
      }),
    );
  };

  const handleAddRow = () => {
    const key = `new-${tempKeyRef.current++}`;
    const placeholder: DietaryProfile = {
      id: key,
      booking_id: bookingId,
      person_name: "",
      diet_type: "",
      allergy: null,
      severity: null,
      notes: null,
    };
    setRows((current) => [...current, createRowState(placeholder, { key, isNew: true })]);
  };

  const handleReset = (rowKey: string) => {
    setRows((current) =>
      current.flatMap((row) => {
        if (row.key !== rowKey) return [row];
        if (row.isNew) {
          return [];
        }
        return [
          {
            ...row,
            draft: mapProfileToDraft(row.profile),
            dirty: false,
            isSaving: false,
            error: null,
          },
        ];
      }),
    );
  };

  const handleSave = async (rowKey: string) => {
    const row = rowsRef.current.find((item) => item.key === rowKey);
    if (!row) return;

    const errors: string[] = [];
    const personName = row.draft.person_name.trim();
    const dietType = row.draft.diet_type.trim();
    const allergy = row.draft.allergy.trim();
    const severity = row.draft.severity ? (row.draft.severity as DietaryProfile["severity"]) : null;

    if (!personName) errors.push("Guest name is required.");
    if (!dietType) errors.push("Diet type is required.");

    if (errors.length) {
      setRows((current) =>
        current.map((item) =>
          item.key === rowKey
            ? {
                ...item,
                error: errors.join(" "),
              }
            : item,
        ),
      );
      return;
    }

    const payload = {
      person_name: personName,
      diet_type: dietType,
      allergy: allergy.length ? allergy : null,
      severity,
    } satisfies Partial<DietaryProfile>;

    const endpoint = row.isNew
      ? `/api/portal/bookings/${bookingId}/dietary`
      : `/api/portal/bookings/${bookingId}/dietary/${row.profile.id}`;
    const method = row.isNew ? "POST" : "PATCH";

    const request = fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setRows((current) =>
      current.map((item) =>
        item.key === rowKey
          ? {
              ...item,
              profile: {
                ...item.profile,
                person_name: payload.person_name!,
                diet_type: payload.diet_type!,
                allergy: payload.allergy,
                severity: payload.severity ?? null,
              },
              draft: {
                person_name: payload.person_name!,
                diet_type: payload.diet_type!,
                allergy: payload.allergy ?? "",
                severity: (payload.severity ?? "") as DraftProfile["severity"],
              },
              dirty: false,
              isSaving: true,
              error: null,
            }
          : item,
      ),
    );

    try {
      const response = await runWithStatus(request);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save dietary profile");
      }
      const body = await response.json();
      const savedProfile = (body?.profile ?? body) as DietaryProfile;

      setRows((current) =>
        current.map((item) =>
          item.key === rowKey
            ? {
                ...item,
                profile: savedProfile,
                draft: mapProfileToDraft(savedProfile),
                isNew: false,
                dirty: false,
                isSaving: false,
                error: null,
              }
            : item,
        ),
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setRows((current) =>
        current.map((item) =>
          item.key === rowKey
            ? {
                ...item,
                profile: row.profile,
                draft: {
                  person_name: row.draft.person_name,
                  diet_type: row.draft.diet_type,
                  allergy: row.draft.allergy,
                  severity: row.draft.severity,
                },
                dirty: true,
                isSaving: false,
                error: message,
              }
            : item,
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-olive-700">
          Track individual guest requirements. Save each row to sync with the kitchen.
        </p>
        <Button size="sm" variant="outline" onClick={handleAddRow}>
          Add guest
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-olive-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Diet type</TableHead>
              <TableHead>Allergy</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <Fragment key={row.key}>
                  <TableRow data-state={row.isSaving ? "saving" : undefined}>
                    <TableCell className="align-top">
                      <Input
                        aria-invalid={row.error ? true : undefined}
                        value={row.draft.person_name}
                        onChange={(event) =>
                          handleFieldChange(row.key, "person_name", event.target.value)
                        }
                        placeholder="Guest name"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        aria-invalid={row.error ? true : undefined}
                        value={row.draft.diet_type}
                        onChange={(event) =>
                          handleFieldChange(row.key, "diet_type", event.target.value)
                        }
                        placeholder="E.g. Vegetarian"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        value={row.draft.allergy}
                        onChange={(event) =>
                          handleFieldChange(row.key, "allergy", event.target.value)
                        }
                        placeholder="Optional"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <select
                        className="flex h-9 w-full rounded-md border border-olive-200 bg-white px-3 text-sm text-olive-900 focus:outline-none focus:ring-2 focus:ring-olive-400 focus:ring-offset-2 focus:ring-offset-white"
                        value={row.draft.severity ?? ""}
                        onChange={(event) =>
                          handleFieldChange(
                            row.key,
                            "severity",
                            event.target.value,
                          )
                        }
                      >
                        {severityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleSave(row.key)}
                          disabled={row.isSaving || !row.dirty}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReset(row.key)}
                          disabled={row.isSaving || (!row.dirty && !row.isNew)}
                        >
                          Reset
                        </Button>
                      </div>
                      {row.isSaving ? (
                        <p className="mt-2 text-xs text-olive-600">Saving…</p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                  {row.error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-rose-50 text-sm text-rose-700">
                        {row.error}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-olive-700">
                  No dietary profiles recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function synchronizeRows(current: RowState[], profiles: DietaryProfile[]): RowState[] {
  const byId = new Map(current.filter((row) => !row.isNew).map((row) => [row.profile.id, row]));
  const next: RowState[] = profiles.map((profile) => {
    const existing = byId.get(profile.id);
    if (!existing) {
      return createRowState(profile);
    }
    const dirty = existing.dirty;
    return {
      ...existing,
      profile,
      draft: dirty ? existing.draft : mapProfileToDraft(profile),
      isNew: false,
      isSaving: false,
      dirty,
      error: existing.error,
    };
  });

  for (const row of current) {
    if (row.isNew) {
      next.push(row);
    }
  }

  return next;
}

function useCallbackWrapper(
  trackStatus?: <Value>(operation: Promise<Value>) => Promise<Value>,
) {
  return <Value,>(operation: Promise<Value>) => {
    if (!trackStatus) {
      return operation;
    }
    return trackStatus(operation);
  };
}
