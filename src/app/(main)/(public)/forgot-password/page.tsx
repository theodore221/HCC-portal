"use client";

import { EmailActionCard } from "@/components/auth/EmailActionCard";
import { sbBrowser } from "@/lib/supabase-browser";

async function checkEmailExists(email: string): Promise<boolean> {
  const response = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  return data?.data?.exists === true;
}

export default function ForgotPasswordPage() {
  const supabase = sbBrowser();

  const handleSubmit = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const exists = await checkEmailExists(email);

    if (!exists) {
      return { success: false, error: "No account found with this email address." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return (
    <EmailActionCard
      title="Reset your password"
      description="Enter your email address and we'll send you a link to reset your password."
      submitLabel="Send reset link"
      loadingLabel="Sending..."
      successTitle="Check your email"
      successMessage="We've sent a password reset link to your email address. The link will expire in 1 hour."
      onSubmit={handleSubmit}
    />
  );
}
