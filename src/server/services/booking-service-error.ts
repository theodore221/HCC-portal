export class BookingServiceError extends Error {
  public readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "BookingServiceError";
    this.status = options?.status ?? 500;
  }
}
