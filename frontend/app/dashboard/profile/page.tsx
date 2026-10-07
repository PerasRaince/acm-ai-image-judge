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
          className="inline-flex items-center gap-1.5 text-xs text-[#526079] hover:text-[#101A35] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#101A35] tracking-tight">Account Profile</h1>
        <p className="text-xs text-[#526079] mt-1">Manage your public display name and account role.</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#FFFFFF] border border-[#DCE4F3] p-6 rounded-2xl text-xs shadow-xs">
        <div className="space-y-1.5">
          <label className="text-[#101A35] font-semibold" htmlFor="email">
            Email Address (Read-only)
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={profile?.email || ''}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3] text-[#526079] cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[#101A35] font-semibold" htmlFor="displayName">
            Public Display Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] text-[#101A35] focus:outline-none focus:ring-2 focus:ring-[#376DDD]/30 focus:border-[#376DDD] transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[#101A35] font-semibold">Account Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('participant')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'participant'
                  ? 'border-[#376DDD] bg-[#E7ECFA] text-[#101A35]'
                  : 'border-[#DCE4F3] bg-[#FCFDFF] text-[#526079]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Trophy className="h-3.5 w-3.5 text-[#376DDD]" />
                <span>Participant</span>
              </div>
              <span className="text-[10px] text-[#526079]">Compete & submit</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'organizer'
                  ? 'border-[#376DDD] bg-[#E7ECFA] text-[#101A35]'
                  : 'border-[#DCE4F3] bg-[#FCFDFF] text-[#526079]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Shield className="h-3.5 w-3.5 text-[#376DDD]" />
                <span>Organizer</span>
              </div>
              <span className="text-[10px] text-[#526079]">Host competitions</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] disabled:opacity-50 text-white font-semibold transition-all shadow-xs mt-2 active:scale-95"
        >
          {saving ? 'Saving changes...' : 'Save Profile'}
        </button>
      </form>

      {/* Danger Zone: Full Account Deletion */}
      <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-4 text-xs">
        <div className="flex items-center gap-2.5 text-rose-800 font-semibold text-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>Danger Zone: Permanent Account Deletion</span>
        </div>
        <p className="text-rose-700 leading-relaxed text-[11px]">
          Permanently delete your profile, authentication credentials, hosted competitions, submitted images, and scoring data from this system and Supabase. This action is irreversible.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(true);
            setDeleteConfirmationInput('');
            setDeleteError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Account & Data</span>
        </button>
      </div>

      {/* Modal Dialog for Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#526079] hover:text-[#101A35] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#101A35] leading-relaxed">
              <p>
                This action will permanently erase:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#526079] text-[11px] pl-1">
                <li>Your profile and login credentials in Supabase Auth</li>
                <li>All recreation images uploaded by you in storage</li>
                <li>All competitions hosted by you (including reference images)</li>
                <li>All AI ensemble evaluation scores and leaderboard records</li>
              </ul>
              <p className="font-semibold text-rose-600 pt-1">
                This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] text-[#526079]">
                To confirm, type <span className="font-bold text-rose-600">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3] text-[#101A35] font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-[#E7ECFA] hover:bg-[#DCE4F3] text-[#526079] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmationInput.trim() !== 'DELETE'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-xs"
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
