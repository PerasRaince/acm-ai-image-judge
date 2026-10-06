'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabaseClient';
import { UserProfile, UserRole } from '../../../types';
import { User, Shield, Trophy, CheckCircle2, AlertCircle, ArrowLeft, Trash2, AlertTriangle, X } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDeleteAccount() {
    if (deleteConfirmationInput.trim() !== 'DELETE') {
      setDeleteError('Please type DELETE exactly to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.deleteAccount();
      await supabase.auth.signOut();
      router.push('/login?message=deleted');
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
      setDeleting(false);
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#0B1D35]/80 border border-[#002B49] p-6 rounded-2xl text-xs">
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium" htmlFor="email">
            Email Address (Read-only)
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={profile?.email || ''}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium" htmlFor="displayName">
            Public Display Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA] transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-slate-300 font-medium">Account Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('participant')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'participant'
                  ? 'border-[#0085CA] bg-[#0085CA]/15 text-white'
                  : 'border-[#002B49] bg-[#040C16] text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Trophy className="h-3.5 w-3.5 text-[#00A3E0]" />
                <span>Participant</span>
              </div>
              <span className="text-[10px] text-slate-400">Compete & submit</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'organizer'
                  ? 'border-[#0075A2] bg-[#0075A2]/20 text-white'
                  : 'border-[#002B49] bg-[#040C16] text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Shield className="h-3.5 w-3.5 text-[#38BDF8]" />
                <span>Organizer</span>
              </div>
              <span className="text-[10px] text-slate-400">Host competitions</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] disabled:opacity-50 text-white font-semibold transition-all shadow-md shadow-[#0085CA]/20 mt-2 active:scale-95"
        >
          {saving ? 'Saving changes...' : 'Save Profile'}
        </button>
      </form>

      {/* Danger Zone: Full Account Deletion */}
      <div className="p-6 rounded-2xl border border-rose-950/70 bg-rose-950/20 space-y-4 text-xs">
        <div className="flex items-center gap-2.5 text-rose-400 font-semibold text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Danger Zone: Permanent Account Deletion</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Permanently delete your profile, authentication credentials, hosted competitions, submitted images, and scoring data from this system and Supabase. This action is irreversible.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(true);
            setDeleteConfirmationInput('');
            setDeleteError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-all active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Account & Data</span>
        </button>
      </div>

      {/* Modal Dialog for Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0B1D35] border border-[#002B49] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
              <p>
                This action will permanently erase:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-1">
                <li>Your profile and login credentials in Supabase Auth</li>
                <li>All recreation images uploaded by you in storage</li>
                <li>All competitions hosted by you (including reference images)</li>
                <li>All AI ensemble evaluation scores and leaderboard records</li>
              </ul>
              <p className="font-semibold text-rose-400 pt-1">
                This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">
                To confirm, type <span className="font-bold text-rose-400">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl bg-[#040C16] border border-[#002B49] text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-[#002B49] hover:bg-[#003860] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmationInput.trim() !== 'DELETE'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? 'Deleting account...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
