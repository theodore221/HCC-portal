import { getOrCreateCSRFToken } from "@/lib/security";
import { ForgotPasswordClient } from "./forgot-password-client";

export default async function ForgotPasswordPage() {
  const csrfToken = await getOrCreateCSRFToken();
  return <ForgotPasswordClient csrfToken={csrfToken} />;
}
