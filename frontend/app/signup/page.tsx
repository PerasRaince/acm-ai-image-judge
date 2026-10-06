'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { apiClient } from '../../lib/apiClient';
import { UserRole } from '../../types';
import { UserPlus, AlertCircle, Shield, Trophy } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role
          }
        }
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Failed to sign up.');
      }

      // Auto sign-in if email confirmation is disabled or session available
      if (data.session) {
        await apiClient.syncProfile({ display_name: displayName, role });
        if (role === 'organizer') {
          router.push('/organizer');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        // Confirmation email may be required in some Supabase configs
        router.push('/login?registered=true');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-blue-500/10 text-blue-400 mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-zinc-400">Join the AI image recreation competition community</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium" htmlFor="displayName">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="CreativeCreator"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Account Role Selector */}
          <div className="space-y-2 pt-1">
            <label className="text-zinc-300 font-medium">Select Your Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('participant')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  role === 'participant'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Trophy className="h-3.5 w-3.5 text-blue-400" />
                  <span>Participant</span>
                </div>
                <span className="text-[10px] text-zinc-400">Join contests & submit recreations</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  role === 'organizer'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Shield className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Organizer</span>
                </div>
                <span className="text-[10px] text-zinc-400">Create & manage competitions</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors mt-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Already registered?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
