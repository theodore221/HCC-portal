"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailActionCardProps {
  title: string;
  description: string;
  submitLabel: string;
  loadingLabel: string;
  successTitle: string;
  successMessage: string;
  onSubmit: (email: string) => Promise<{ success: boolean; error?: string }>;
  backHref?: string;
  backLabel?: string;
}

export function EmailActionCard({
  title,
  description,
  submitLabel,
  loadingLabel,
  successTitle,
  successMessage,
  onSubmit,
  backHref = "/login",
  backLabel = "Back to sign in",
}: EmailActionCardProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address to continue.");
      setLoading(false);
      return;
    }

    const result = await onSubmit(trimmedEmail);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-olive-900">{successTitle}</h1>
          <p className="text-sm text-olive-700">{successMessage}</p>
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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-olive-900">{title}</h1>
        <p className="text-sm text-olive-700">{description}</p>
      </header>
      <form autoComplete="off" className="space-y-4" onSubmit={handleSubmit}>
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
