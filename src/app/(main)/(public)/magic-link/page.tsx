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

export default function MagicLinkPage() {
  const supabase = sbBrowser();

  const handleSubmit = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const exists = await checkEmailExists(email);

    if (!exists) {
      return { success: false, error: "No account found with this email address." };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return (
    <EmailActionCard
      title="Sign in with email link"
      description="Enter your email address and we'll send you a secure link to sign in without a password."
      submitLabel="Send login link"
      loadingLabel="Sending..."
      successTitle="Check your email"
      successMessage="We've sent a secure login link to your email address. Click the link to sign in."
      onSubmit={handleSubmit}
    />
  );
}
