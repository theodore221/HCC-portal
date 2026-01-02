"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";

interface EmailOtpCardProps {
  title: string;
  description: string;
  otpTitle?: string;
  otpDescription?: string;
  submitLabel: string;
  verifyLabel: string;
  loadingLabel: string;
  verifyingLabel: string;
  onSendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  onVerifyOtp: (
    email: string,
    code: string
  ) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
  backHref?: string;
  backLabel?: string;
}

export function EmailOtpCard({
  title,
  description,
  otpTitle = "Enter verification code",
  otpDescription = "We've sent a 6-digit code to your email address.",
  submitLabel,
  verifyLabel,
  loadingLabel,
  verifyingLabel,
  onSendOtp,
  onVerifyOtp,
  onSuccess,
  backHref = "/login",
  backLabel = "Back to sign in",
}: EmailOtpCardProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "otp" && otpCode.length === 6) {
      void handleVerifyOtp();
    }
  }, [otpCode, step]);

  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address to continue.");
      setLoading(false);
      return;
    }

    const result = await onSendOtp(trimmedEmail);

    if (result.success) {
      setStep("otp");
      setResendCooldown(60);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6 || loading) return;

    setLoading(true);
    setError(null);

    const result = await onVerifyOtp(email, otpCode);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error ?? "Invalid or expired code. Please try again.");
      setOtpCode("");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError(null);
    setOtpCode("");

    const result = await onSendOtp(email);

    if (result.success) {
      setResendCooldown(60);
    } else {
      setError(result.error ?? "Failed to resend code. Please try again.");
    }

    setLoading(false);
  };

  const handleChangeEmail = () => {
    setStep("email");
    setOtpCode("");
    setError(null);
    setResendCooldown(0);
  };

  if (step === "email") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-olive-900">{title}</h1>
          <p className="text-sm text-olive-700">{description}</p>
        </header>
        <form autoComplete="off" className="space-y-4" onSubmit={handleSendOtp}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-olive-800" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@holycrosscentre.org"
              name="email"
              required
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              inputMode="email"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingLabel}
              </span>
            ) : (
              submitLabel
            )}
          </Button>
        </form>
        <Link
          href={backHref}
          className="flex items-center justify-center gap-2 text-sm font-medium text-olive-600 hover:text-olive-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-olive-900">{otpTitle}</h1>
        <p className="text-sm text-olive-700">{otpDescription}</p>
        <p className="text-xs text-olive-600 font-medium">{email}</p>
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-olive-800 text-center block">
            Verification Code
          </label>
          <OtpInput
            value={otpCode}
            onChange={setOtpCode}
            disabled={loading}
            error={!!error}
          />
        </div>

        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-olive-600" />
          </div>
        )}

        <div className="flex flex-col gap-2 text-center">
          {resendCooldown > 0 ? (
            <p className="text-xs text-olive-600">
              Resend code in {resendCooldown}s
            </p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={loading}
              className="text-olive-600 hover:text-olive-800"
            >
              Resend code
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleChangeEmail}
            disabled={loading}
            className="text-olive-600 hover:text-olive-800"
          >
            Change email
          </Button>
        </div>
      </div>

      <Link
        href={backHref}
        className="flex items-center justify-center gap-2 text-sm font-medium text-olive-600 hover:text-olive-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
    </div>
  );
}
