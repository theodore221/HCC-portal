import { getOrCreateCSRFToken } from "@/lib/security";
import { MagicLinkClient } from "./magic-link-client";

export default async function MagicLinkPage() {
  const csrfToken = await getOrCreateCSRFToken();
  return <MagicLinkClient csrfToken={csrfToken} />;
}
