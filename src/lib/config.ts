/** Returns the canonical base URL for this deployment. Server-side only. */
export function getBaseUrl(): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}
