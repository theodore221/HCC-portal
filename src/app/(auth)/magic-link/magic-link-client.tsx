"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EmailOtpCard } from "@/components/auth/EmailOtpCard";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";
import { sbBrowser } from "@/lib/supabase-browser";
import { getHomePathForRole } from "@/lib/auth/paths";
import type { ProfileRecord } from "@/lib/database.types";

async function checkEmailExists(email: string, csrfToken: string): Promise<boolean> {
  const response = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  return data?.data?.exists === true;
}

export function MagicLinkClient({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = sbBrowser();
  const [signedIn, setSignedIn] = useState(false);

  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam?.startsWith("/") ? redirectParam : null;

  const navigateToWorkspace = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/profile", {
        method: "GET",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: ProfileRecord;
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        const message =
          payload?.error ?? "We couldn't load your profile. Please try again.";
        console.error("Failed to load profile", response.status, message);
        return;
      }

      const profile = payload.data;
      const profileRole = profile.role ?? null;
      const bookingReference = profile.booking_reference ?? null;

      setSignedIn(true);

      let destination =
        redirectTo ?? getHomePathForRole(profileRole, bookingReference);

      if (!redirectTo && !profileRole) {
        destination = "/portal";
      }

      router.replace(destination);
      router.refresh();
    } catch (fetchError) {
      console.error("Failed to load profile", fetchError);
    }
  }, [redirectTo, router]);

  const handleSendOtp = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const exists = await checkEmailExists(email, csrfToken);

    if (!exists) {
      return {
        success: false,
        error: "No account found with this email address.",
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const handleVerifyOtp = async (
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      return {
        success: false,
        error: "This code is invalid or has expired. Please request a new one.",
      };
    }

    return { success: true };
  };

  if (signedIn) {
    return (
      <AuthLoadingState
        title="Signed in"
        subtitle="Loading your workspace..."
      />
    );
  }

  return (
    <EmailOtpCard
      title="Sign in with email code"
      description="Enter your email address and we'll send you a 6-digit code to sign in without a password."
      submitLabel="Send code"
      loadingLabel="Sending..."
      verifyLabel="Verify code"
      verifyingLabel="Verifying..."
      onSendOtp={handleSendOtp}
      onVerifyOtp={handleVerifyOtp}
      onSuccess={navigateToWorkspace}
    />
  );
}
