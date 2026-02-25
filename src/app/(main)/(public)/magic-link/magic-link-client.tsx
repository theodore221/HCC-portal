"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { EmailOtpCard } from "@/components/auth/EmailOtpCard";
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
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-olive-900">Signed in</h1>
          <p className="text-sm text-olive-700">Loading your workspace...</p>
          <div className="flex justify-center pt-2">
            <Loader2 className="h-5 w-5 animate-spin text-olive-600" />
          </div>
        </div>
      </div>
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
