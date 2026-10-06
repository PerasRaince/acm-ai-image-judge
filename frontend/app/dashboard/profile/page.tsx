'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../../lib/apiClient';
import { UserProfile, UserRole } from '../../../types';
import { User, Shield, Trophy, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await apiClient.getMe();
        if (me) {
          setProfile(me);
          setDisplayName(me.display_name);
          setRole(me.role);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const updated = await apiClient.syncProfile({
        display_name: displayName,
        role
      });
      setProfile(updated);
      setMessage('Profile settings updated successfully!');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-xl mx-auto py-16 text-xs text-zinc-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account Profile</h1>
        <p className="text-xs text-zinc-400 mt-1">Manage your public display name and account role.</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl text-xs">
        <div className="space-y-1.5">
          <label className="text-zinc-300 font-medium" htmlFor="email">
            Email Address (Read-only)
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={profile?.email || ''}
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800 text-zinc-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-300 font-medium" htmlFor="displayName">
            Public Display Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-zinc-300 font-medium">Account Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('participant')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'participant'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Trophy className="h-3.5 w-3.5 text-blue-400" />
                <span>Participant</span>
              </div>
              <span className="text-[10px] text-zinc-400">Compete & submit</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'organizer'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Organizer</span>
              </div>
              <span className="text-[10px] text-zinc-400">Host competitions</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors mt-2"
        >
          {saving ? 'Saving changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
