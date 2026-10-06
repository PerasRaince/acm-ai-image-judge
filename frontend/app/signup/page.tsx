'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { apiClient } from '../../lib/apiClient';
import PasswordRequirements, { isPasswordValid } from '../../components/PasswordRequirements';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordMeetsRequirements = isPasswordValid(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!passwordMeetsRequirements) {
      setErrorMsg('Please ensure your password satisfies all security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      // 1. Server-side creation with pre-confirmed email (avoids SMTP email rate limits)
      try {
        await apiClient.signup({
          email: email.trim(),
          password,
          display_name: displayName.trim()
        });
      } catch (signupErr: any) {
        if (signupErr?.message?.includes('already exists')) {
          throw new Error('An account with this email already exists. Please sign in below.');
        }
        // Fallback to direct supabase signup
        const { error: clientError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim(), role: 'user' } }
        });
        if (clientError) throw clientError;
      }

      // 2. Perform instant normal login with persistent session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError || !signInData.session) {
        setSuccessMsg('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(email.trim())}&returnUrl=${encodeURIComponent(returnUrl)}`);
        }, 1200);
      } else {
        router.push(returnUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
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
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-up could not be initiated.');
      setOauthLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-[#0B1D35]/90 border border-[#002B49] p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#0085CA]/15 text-[#00A3E0] mb-2 border border-[#0085CA]/30">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-300">
            Host your own competitions or join as a contestant with a code
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#040C16] hover:bg-[#002B49]/40 border border-[#002B49] text-slate-200 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
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
          <span>{oauthLoading ? 'Connecting with Google...' : 'Sign up with Google'}</span>
        </button>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#002B49] w-full" />
          <span className="bg-[#0B1D35] px-3 text-[11px] uppercase tracking-wider text-slate-400 absolute font-medium">
            or with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-slate-300 font-medium" htmlFor="displayName">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA] transition-all"
            />
          </div>

          {/* Interactive Live Password Requirements */}
          <PasswordRequirements password={password} showAlways={password.length > 0} />

          <div className="space-y-1">
            <label className="text-slate-300 font-medium" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                confirmPassword && !passwordsMatch
                  ? 'border-rose-500 focus:ring-rose-500/50'
                  : 'border-[#002B49] focus:ring-[#0085CA]/50 focus:border-[#0085CA]'
              }`}
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordMeetsRequirements || !passwordsMatch}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-md shadow-[#002B49]/40 active:scale-[0.99] mt-3"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2 border-t border-[#002B49]">
          Already have an account?{' '}
          <Link
            href={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
            className="text-[#00A3E0] font-medium hover:text-[#0085CA] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-slate-400 text-sm">Loading sign up...</div>}>
      <SignupForm />
    </Suspense>
  );
}
