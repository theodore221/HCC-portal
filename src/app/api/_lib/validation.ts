import type { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

import { jsonError, jsonValidationError } from "./json-response";

export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

export type ValidationFailure = {
  success: false;
  response: NextResponse;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export async function validateJson<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return {
      success: false,
      response: jsonError("Invalid JSON payload", { status: 400 }),
    };
  }

  const result = schema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      response: jsonValidationError(result.error),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
