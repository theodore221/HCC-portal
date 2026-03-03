'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLoadingState } from '@/components/auth/AuthLoadingState';
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
      <AuthLoadingState
        title="Signed in"
        subtitle="Loading your workspace..."
      />
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border/70 bg-white shadow-soft">
      {/* Green accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-primary to-primary-light" />

      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Sign in to HCC Portal
          </h1>
          <p className="text-sm text-gray-600">
            Use your Holy Cross Centre credentials to access your workspace.
          </p>
        </header>

        <form
          autoComplete="off"
          className="space-y-4"
          onSubmit={handlePasswordSignIn}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
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
              className="text-sm font-medium text-gray-700"
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
                className="text-xs font-medium text-primary hover:text-primary-light"
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
            <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
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
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/magic-link">
            <Mail className="h-4 w-4" />
            Sign in with email code
          </Link>
        </Button>

        <footer className="flex flex-col gap-2 text-xs text-gray-500">
          <p>
            Need help? Email{' '}
            <a className="font-medium" href="mailto:hcc@passionists.com.au">
              hcc@passionists.com.au
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
