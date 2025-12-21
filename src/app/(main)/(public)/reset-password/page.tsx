"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sbBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = sbBrowser();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!isMounted) {
        return;
      }

      if (!sessionUser) {
        setError("This password reset link has expired or is invalid. Please request a new one.");
        setInitializing(false);
        return;
      }

      setHasValidSession(true);
      setInitializing(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasValidSession) {
      setError("Your session has expired. Please request a new password reset link.");
      return;
    }

    if (!password) {
      setError("Enter a new password to continue.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-olive-700" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-olive-900">Password updated</h1>
          <p className="text-sm text-olive-700">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Sign in
        </Button>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-olive-900">Link expired</h1>
          <p className="text-sm text-olive-700">
            {error ?? "This password reset link has expired or is invalid."}
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push("/forgot-password")}>
          Request a new link
        </Button>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-olive-600 hover:text-olive-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-olive-900">Reset your password</h1>
        <p className="text-sm text-olive-700">
          Enter a new password for your Holy Cross Centre account.
        </p>
      </header>
      <form autoComplete="off" className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-olive-800" htmlFor="password">
            New password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter a new password"
            name="password"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-olive-800" htmlFor="confirm-password">
            Confirm password
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            name="confirmPassword"
            autoComplete="new-password"
          />
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password...
            </span>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm font-medium text-olive-600 hover:text-olive-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
