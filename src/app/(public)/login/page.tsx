"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHomePathForRole } from "@/lib/auth/paths";
import type { ProfileRole } from "@/lib/database.types";
import { sbBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"password" | "otp" | null>(null);

  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam?.startsWith("/") ? redirectParam : null;

  const supabase = sbBrowser();

  const navigateToWorkspace = useCallback(
    async (userId: string) => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, booking_reference")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load profile", profileError);
      }

      const profileRole = (profile?.role as ProfileRole | null) ?? null;
      const bookingReference = profile?.booking_reference ?? null;
      let destination =
        redirectTo ??
        getHomePathForRole(profileError ? null : profileRole, profileError ? null : bookingReference);

      if (!redirectTo && (profileError || !profileRole)) {
        destination = "/portal";
      }

      setPassword("");
      setLoading(null);
      setError(null);
      router.replace(destination);
      router.refresh();
    },
    [redirectTo, router, supabase]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id;
      if (userId) {
        setLoading((current) => current ?? "password");
        void navigateToWorkspace(userId);
      }
    });
  }, [navigateToWorkspace, supabase]);

  const handlePasswordSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading("password");
    setError(null);
    setMessage(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user?.id) {
      setError(signInError?.message ?? "Unable to sign in with those credentials.");
      setLoading(null);
      return;
    }

    await navigateToWorkspace(data.user.id);
  };

  const handleOtpSignIn = async () => {
    setLoading("otp");
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address to receive a login link.");
      setLoading(null);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setMessage("Check your inbox for a secure login link.");
    }

    setLoading(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-olive-900">Sign in to HCC Portal</h1>
        <p className="text-sm text-olive-700">
          Use your Holy Cross Centre credentials to access your workspace.
        </p>
      </header>
      <form autoComplete="off" className="space-y-4" onSubmit={handlePasswordSignIn}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-olive-800" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@holycrosscentre.org"
            name="email"
            required
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            inputMode="email"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-olive-800" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              className="text-xs font-medium text-olive-600 hover:text-olive-800"
              onClick={handleOtpSignIn}
              disabled={loading === "otp"}
            >
              {loading === "otp" ? "Sending link…" : "Email me a login link"}
            </button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            name="password"
            autoComplete="current-password"
          />
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        ) : null}
        <Button className="w-full" type="submit" disabled={loading !== null}>
          {loading === "password" ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      <footer className="flex flex-col gap-2 text-xs text-olive-600">
        <p>
          Need help? Email {" "}
          <a className="font-medium" href="mailto:bookings@hcc.org.au">
            bookings@hcc.org.au
          </a>
        </p>
        <p>
          Looking for your booking steps? Visit the {" "}
          <Link className="font-medium text-olive-700" href="/portal">
            customer portal
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
