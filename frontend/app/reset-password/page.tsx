'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import PasswordRequirements, { isPasswordValid } from '../../components/PasswordRequirements';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const passwordMeetsRequirements = isPasswordValid(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!passwordMeetsRequirements) {
      setErrorMsg('Please ensure your new password satisfies all security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Your password has been reset successfully! Redirecting you to sign in...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-[#FFFFFF] border border-[#DCE4F3] p-8 rounded-2xl shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#E7ECFA] text-[#376DDD] mb-2 border border-[#DCE4F3]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#101A35] tracking-tight">Set New Password</h1>
          <p className="text-xs text-[#526079]">
            Choose a secure new password for your AI Image Judge account
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {hasSession === false && !successMsg && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
            Note: If you arrived here directly without clicking an email reset link, please request a password reset first.
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-[#101A35] font-semibold" htmlFor="password">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] text-[#101A35] placeholder-[#526079] focus:outline-none focus:ring-2 focus:ring-[#376DDD]/30 focus:border-[#376DDD] transition-all"
              />
            </div>

            <PasswordRequirements password={password} showAlways={password.length > 0} />

            <div className="space-y-1">
              <label className="text-[#101A35] font-semibold" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border text-[#101A35] placeholder-[#526079] focus:outline-none focus:ring-2 transition-all ${
                  confirmPassword && !passwordsMatch
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-[#DCE4F3] focus:ring-[#376DDD]/30 focus:border-[#376DDD]'
                }`}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordMeetsRequirements || !passwordsMatch}
              className="w-full py-3 px-4 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-sm active:scale-[0.99] mt-3"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-[#DCE4F3] text-center">
          <Link
            href="/login"
            className="text-xs text-[#376DDD] hover:text-[#285BC4] font-medium hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
