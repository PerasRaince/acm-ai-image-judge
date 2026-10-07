'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });

      if (error) {
        throw error;
      }

      setSuccessMsg(
        `If an account exists for ${email}, a password reset link has been sent. Please check your inbox and follow the link to reset your password.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-[#FFFFFF] border border-[#DCE4F3] p-8 rounded-2xl shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#E7ECFA] text-[#376DDD] mb-2 border border-[#DCE4F3]">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#101A35] tracking-tight">Forgot Password</h1>
          <p className="text-xs text-[#526079]">
            Enter your registered email address and we&apos;ll send you a password reset link
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {!successMsg ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#101A35] font-semibold" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] text-[#101A35] placeholder-[#526079] focus:outline-none focus:ring-2 focus:ring-[#376DDD]/30 focus:border-[#376DDD] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] disabled:opacity-50 text-white font-semibold transition-all shadow-sm active:scale-[0.99] mt-2"
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#376DDD] hover:text-[#285BC4]"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Sign In
            </Link>
          </div>
        )}

        <div className="pt-2 border-t border-[#DCE4F3] text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[#526079] hover:text-[#376DDD] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
