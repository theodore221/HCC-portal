'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getHomePathForRole } from '@/lib/auth/paths';
import type { ProfileRecord } from '@/lib/database.types';
import { sbBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<'password' | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const redirectParam = searchParams.get('redirect');
  const redirectTo = redirectParam?.startsWith('/') ? redirectParam : null;
  const errorParam = searchParams.get('error');

  const supabase = sbBrowser();

  const navigateToWorkspace = useCallback(async () => {
    try {
      setMessage(null);
      setError(null);

      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include',
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: ProfileRecord;
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        const message =
          payload?.error ?? "We couldn't load your profile. Please try again.";
        console.error('Failed to load profile', response.status, message);
        setError(message);
        setLoading(null);
        return;
      }

      const profile = payload.data;
      const profileRole = profile.role ?? null;
      const bookingReference = profile.booking_reference ?? null;

      setSignedIn(true);

      let destination =
        redirectTo ?? getHomePathForRole(profileRole, bookingReference);

      if (!redirectTo && !profileRole) {
        destination = '/portal';
      }

      setPassword('');
      setLoading(null);
      setError(null);
      router.replace(destination);
      router.refresh();
      return;
    } catch (fetchError) {
      console.error('Failed to load profile', fetchError);
      setError("We couldn't load your profile. Please try again.");
      setLoading(null);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    void (async () => {
      // Set error from URL parameter if present
      if (errorParam) {
        setError(errorParam);
      }

      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (userId) {
        setLoading((current) => current ?? 'password');
        void navigateToWorkspace();
      }
    })();
  }, [navigateToWorkspace, supabase, errorParam]);

  const handlePasswordSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading('password');
    setError(null);
    setMessage(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email.trim(),
        password,
      }
    );

    if (signInError || !data.user?.id) {
      setError(
        signInError?.message ?? 'Unable to sign in with those credentials.'
      );
      setLoading(null);
      return;
    }

    await navigateToWorkspace();
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
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-olive-100 bg-white p-8 shadow-soft">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-olive-900">
          Sign in to HCC Portal
        </h1>
        <p className="text-sm text-olive-700">
          Use your Holy Cross Centre credentials to access your workspace.
        </p>
      </header>
      <form
        autoComplete="off"
        className="space-y-4"
        onSubmit={handlePasswordSignIn}
      >
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
          <label
            className="text-sm font-medium text-olive-800"
            htmlFor="password"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            name="password"
            autoComplete="current-password"
          />
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-olive-600 hover:text-olive-800"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={loading !== null}>
          {loading === 'password' ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-olive-100" />
        <span className="text-xs text-olive-500">or</span>
        <div className="h-px flex-1 bg-olive-100" />
      </div>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/magic-link">
          <Mail className="h-4 w-4" />
          Sign in with email code
        </Link>
      </Button>
      <footer className="flex flex-col gap-2 text-xs text-olive-600">
        <p>
          Need help? Email{' '}
          <a className="font-medium" href="mailto:hcc@passionists.com.au">
            hcc@passionists.com.au
          </a>
        </p>
      </footer>
    </div>
  );
}
