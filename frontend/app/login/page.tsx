'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { LogIn, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid email or password. Please try again.');
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMsg(null);
    setOauthLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in could not be initiated.');
      setOauthLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-[#FFFFFF] border border-[#DCE4F3] p-8 rounded-2xl shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#E7ECFA] text-[#376DDD] mb-2 border border-[#DCE4F3]">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#101A35] tracking-tight">Sign In</h1>
          <p className="text-xs text-[#526079]">
            Access your AI Image competitions, submissions, and leaderboard rankings
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#E7ECFA]/40 border border-[#DCE4F3] text-[#101A35] text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{oauthLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#DCE4F3] w-full" />
          <span className="bg-[#FFFFFF] px-3 text-[11px] uppercase tracking-wider text-[#526079] absolute font-medium">
            or with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[#101A35] font-medium" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] text-[#101A35] placeholder-[#526079] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#376DDD]/30 focus:border-[#376DDD] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[#101A35] font-medium" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[#376DDD] hover:text-[#285BC4] hover:underline transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] text-[#101A35] placeholder-[#526079] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#376DDD]/30 focus:border-[#376DDD] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] disabled:opacity-50 text-white font-semibold transition-all shadow-sm shadow-[#376DDD]/20 active:scale-[0.99] mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-[#526079] pt-2 border-t border-[#DCE4F3]">
          Don&apos;t have an account?{' '}
          <Link
            href={`/signup${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
            className="text-[#376DDD] font-medium hover:text-[#285BC4] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-400 text-sm">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
