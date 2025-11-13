import { z } from "zod";

export const severityOptions = ["Low", "Moderate", "High", "Fatal"] as const;

export const dietaryProfileSchema = z.object({
  person_name: z.string().min(1, "Guest name is required"),
  diet_type: z.string().min(1, "Diet type is required"),
  allergy: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }),
  severity: z
    .enum(severityOptions)
    .nullish()
    .transform((value) => value ?? null),
  notes: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }),
});
