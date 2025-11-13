import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ResponseInitOrStatus = ResponseInit | number;

function toResponseInit(
  init: ResponseInitOrStatus | undefined,
  defaultStatus: number
): ResponseInit {
  if (typeof init === "number") {
    return { status: init };
  }

  if (!init) {
    return { status: defaultStatus };
  }

  return {
    ...init,
    status: init.status ?? defaultStatus,
  };
}

export interface JsonSuccessPayload<T> {
  success: true;
  data: T;
}

export interface JsonErrorPayload {
  success: false;
  error: string;
  issues?: ZodError["issues"];
}

export function jsonSuccess<T>(
  data: T,
  init?: ResponseInitOrStatus
): NextResponse<JsonSuccessPayload<T>> {
  return NextResponse.json<JsonSuccessPayload<T>>(
    { success: true, data },
    toResponseInit(init, 200)
  );
}

export function jsonError(
  message: string,
  init?: ResponseInitOrStatus
): NextResponse<JsonErrorPayload> {
  return NextResponse.json<JsonErrorPayload>(
    { success: false, error: message },
    toResponseInit(init, 400)
  );
}

export function jsonValidationError(
  error: ZodError,
  init?: ResponseInitOrStatus
): NextResponse<JsonErrorPayload> {
  return NextResponse.json<JsonErrorPayload>(
    { success: false, error: "Validation failed", issues: error.issues },
    toResponseInit(init, 422)
  );
}
