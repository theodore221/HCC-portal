"use client";

import { useRouter } from "next/navigation";

import { EmailOtpCard } from "@/components/auth/EmailOtpCard";
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
  const router = useRouter();
  const supabase = sbBrowser();

  const handleSendOtp = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const exists = await checkEmailExists(email);

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

  const handleSuccess = () => {
    router.push("/reset-password");
  };

  return (
    <EmailOtpCard
      title="Reset your password"
      description="Enter your email address and we'll send you a 6-digit code to verify your identity."
      otpTitle="Verify your identity"
      otpDescription="Enter the 6-digit code we sent to your email."
      submitLabel="Send code"
      loadingLabel="Sending..."
      verifyLabel="Verify code"
      verifyingLabel="Verifying..."
      onSendOtp={handleSendOtp}
      onVerifyOtp={handleVerifyOtp}
      onSuccess={handleSuccess}
    />
  );
}
