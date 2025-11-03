"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHomePathForRole } from "@/lib/auth/paths";
import type { ProfileRole } from "@/lib/database.types";
import { sbBrowser } from "@/lib/supabase-browser";

export default function PasswordSetupPage() {
  const router = useRouter();
  const supabase = sbBrowser();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [bookingReference, setBookingReference] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!sessionUser) {
        router.replace("/login");
        return;
      }

      if (!isMounted) {
        return;
      }

      setUserId(sessionUser.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, booking_reference, password_initialized_at")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (profileError) {
        console.error("Failed to load profile", profileError);
        setError("We couldn't load your profile right now. Please try again.");
        setInitializing(false);
        return;
      }

      if (profile?.password_initialized_at) {
        router.replace(getHomePathForRole(profile.role ?? null, profile.booking_reference ?? null));
        router.refresh();
        return;
      }

      setRole(profile?.role ?? null);
      setBookingReference(profile?.booking_reference ?? null);
      setInitializing(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      setError("We couldn't confirm your account. Please try signing in again.");
      return;
    }

    if (!password) {
      setError("Enter a new password to continue.");
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

    const { error: profileUpdateError } = await supabase.rpc("set_password_initialized_at");

    if (profileUpdateError) {
      console.error("Failed to update password initialization timestamp", profileUpdateError);
      setError("Your password was updated, but we couldn't finish setup. Please try again.");
      setLoading(false);
      return;
    }

    const destination = getHomePathForRole(role, bookingReference);
    router.replace(destination);
    router.refresh();
  };

  if (initializing) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-olive-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-olive-900">Set your password</h1>
        <p className="text-sm text-olive-700">
          Create a password so you can sign in securely with your Holy Cross Centre account.
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
              Saving password…
            </span>
          ) : (
            "Save and continue"
          )}
        </Button>
      </form>
    </div>
  );
}
