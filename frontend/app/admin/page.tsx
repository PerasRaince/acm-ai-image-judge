'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/apiClient';
import {
  Shield,
  HardDrive,
  Database,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  X,
  UserCheck,
  ArrowLeft,
  Server,
  Layers,
  FileImage,
  Award,
  Key
} from 'lucide-react';

interface AdminStats {
  database: {
    competitions: number;
    submissions: number;
    scores: number;
    users: number;
  };
  storage: {
    submission_images_count: number;
    reference_images_count: number;
    total_images_count: number;
    approx_storage_mb: number;
    provider: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [modalType, setModalType] = useState<'purge_images' | 'wipe_all' | null>(null);
  const [confirmInput, setConfirmInput] = useState<string>('');

  // Promote User State
  const [promoteEmail, setPromoteEmail] = useState<string>('');
  const [promoteLoading, setPromoteLoading] = useState<boolean>(false);

  useEffect(() => {
    async function checkAuth() {
      // 1. Check if user is logged in as admin
      try {
        const me = await apiClient.getMe();
        if (me && me.role === 'admin') {
          setAuthorized(true);
          await loadStats();
          return;
        }
      } catch (err) {
        console.warn('Auth check fallback:', err);
      }

      // 2. Check saved admin key in localStorage
      const savedKey = localStorage.getItem('acm_admin_key');
      if (savedKey) {
        try {
          const res = await apiClient.verifyAdminKey(savedKey);
          if (res.authorized) {
            setAdminKey(savedKey);
            setAuthorized(true);
            await loadStats(savedKey);
            return;
          }
        } catch {
          localStorage.removeItem('acm_admin_key');
        }
      }

      setLoading(false);
    }

    checkAuth();
  }, []);

  async function loadStats(key?: string) {
    setLoading(true);
    try {
      const activeKey = key || adminKey || localStorage.getItem('acm_admin_key') || undefined;
      const data = await apiClient.getAdminStats(activeKey);
      setStats(data);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch admin statistics.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await apiClient.verifyAdminKey(keyInput.trim());
      if (res.authorized) {
        setAdminKey(keyInput.trim());
        localStorage.setItem('acm_admin_key', keyInput.trim());
        setAuthorized(true);
        await loadStats(keyInput.trim());
        setFeedback({ type: 'success', message: 'Administrator access unlocked successfully.' });
      } else {
        setFeedback({ type: 'error', message: 'Invalid Admin Secret Key.' });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Verification failed.'
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePurgeSubmissionImages() {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await apiClient.purgeSubmissionImages(adminKey);
      setFeedback({ type: 'success', message: res.message });
      setModalType(null);
      setConfirmInput('');
      await loadStats();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Storage purge failed.'
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWipeAllSubmissions() {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await apiClient.purgeAllSubmissions(adminKey);
      setFeedback({ type: 'success', message: res.message });
      setModalType(null);
      setConfirmInput('');
      await loadStats();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Submissions wipe failed.'
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePromoteUser(e: React.FormEvent) {
    e.preventDefault();
    if (!promoteEmail) return;
    setPromoteLoading(true);
    setFeedback(null);

    try {
      const res = await apiClient.promoteUser(promoteEmail.trim(), 'admin', adminKey);
      setFeedback({ type: 'success', message: res.message });
      setPromoteEmail('');
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Promotion failed.'
      });
    } finally {
      setPromoteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FCFDFF] text-[#101A35] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2 bg-[#FFFFFF] hover:bg-[#E7ECFA] text-[#526079] hover:text-[#101A35] rounded-lg transition border border-[#DCE4F3]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3] rounded-md">
                  <Shield className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#101A35]">System Admin & Storage Controller</h1>
              </div>
              <p className="text-sm text-[#526079] mt-0.5">
                Cloud storage optimization, database integrity, and image lifecycle management.
              </p>
            </div>
          </div>

          {authorized && (
            <button
              onClick={() => loadStats()}
              disabled={loading || actionLoading}
              className="inline-flex items-center px-3.5 py-2 rounded-lg bg-[#FFFFFF] border border-[#DCE4F3] hover:border-[#376DDD]/50 text-sm text-[#526079] hover:text-[#101A35] transition shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              )}
              <span className="text-sm font-medium">{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[#526079] hover:text-[#101A35]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Unlock Screen if not authorized */}
        {!authorized ? (
          <div className="max-w-md mx-auto my-12 p-8 bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-[#E7ECFA] border border-[#DCE4F3] text-[#376DDD] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center text-[#101A35] mb-2">Restricted Admin Area</h2>
            <p className="text-sm text-[#526079] text-center mb-6">
              Enter your Administrator Secret Key or sign in with an account having the <code className="text-[#376DDD]">admin</code> role.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#101A35] mb-1.5">
                  Admin Secret Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter Administrator Secret Key..."
                  required
                  className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#DCE4F3] rounded-xl text-[#101A35] placeholder-[#526079] focus:outline-none focus:ring-2 focus:ring-[#376DDD]/30 focus:border-[#376DDD] text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 px-4 bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-medium rounded-xl transition text-sm shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Unlock Storage Controller</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Dashboard */
          <div className="space-y-8">
            {/* Storage Architecture Comparison Banner */}
            <div className="p-5 bg-[#E7ECFA]/70 border border-[#DCE4F3] rounded-2xl">
              <div className="flex items-start space-x-4">
                <div className="p-2.5 bg-[#FFFFFF] border border-[#DCE4F3] text-[#376DDD] rounded-xl flex-shrink-0 mt-0.5 shadow-xs">
                  <Server className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-[#101A35] text-base">
                    Active Storage Engine: <span className="text-emerald-700 font-mono">Supabase Storage (AWS S3 Cloud)</span>
                  </h3>
                  <p className="text-sm text-[#526079] leading-relaxed">
                    <strong>Why Supabase is superior to Render for images:</strong> Render has no native S3 bucket storage; saving images to Render's container disk consumes server RAM, slows down Node.js, and is wiped on redeploys. Supabase Storage is purpose-built on AWS S3 with global CDN edge caching, 1GB–100GB+ capacity, and zero memory overhead on your API.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#526079]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Candidate Recreations</span>
                  <FileImage className="w-4 h-4 text-[#31B8D0]" />
                </div>
                <div className="text-3xl font-extrabold text-[#101A35]">
                  {loading ? '...' : stats?.storage.submission_images_count || 0}
                </div>
                <p className="text-xs text-[#526079]">Stored in private <code className="text-[#101A35]">submission-images</code> bucket</p>
              </div>

              <div className="p-5 bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#526079]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Reference Targets</span>
                  <Layers className="w-4 h-4 text-[#376DDD]" />
                </div>
                <div className="text-3xl font-extrabold text-[#101A35]">
                  {loading ? '...' : stats?.storage.reference_images_count || 0}
                </div>
                <p className="text-xs text-[#526079]">Official host competition targets</p>
              </div>

              <div className="p-5 bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#526079]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Submissions Evaluated</span>
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-[#101A35]">
                  {loading ? '...' : stats?.database.submissions || 0}
                </div>
                <p className="text-xs text-[#526079]">{stats?.database.scores || 0} calibrated AI score records</p>
              </div>

              <div className="p-5 bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#526079]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Estimated Cloud Usage</span>
                  <HardDrive className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-amber-600">
                  {loading ? '...' : `~${stats?.storage.approx_storage_mb || 0} MB`}
                </div>
                <p className="text-xs text-[#526079]">Total {stats?.storage.total_images_count || 0} images in Supabase</p>
              </div>
            </div>

            {/* Storage Management Operations */}
            <div className="bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl p-6 space-y-6 shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-[#101A35] flex items-center space-x-2">
                  <Database className="w-5 h-5 text-[#376DDD]" />
                  <span>Storage Optimization & Purge Controls</span>
                </h3>
                <p className="text-sm text-[#526079] mt-1">
                  Safely free up storage space when large volumes of images are uploaded without breaking competition leaderboards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purge Option 1: Storage Only (Preserves Leaderboard) */}
                <div className="p-5 bg-[#FCFDFF] border border-[#DCE4F3] hover:border-[#376DDD]/40 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                        Recommended
                      </span>
                      <h4 className="font-semibold text-[#101A35]">Free Up Storage (Keep Scores & Leaderboards)</h4>
                    </div>
                    <p className="text-xs text-[#526079] leading-relaxed">
                      Deletes all recreation image files from Supabase Storage bucket, immediately recovering 100% of candidate disk space. <strong>All competition ranks, scores, timestamps, and contestant leaderboards stay completely intact.</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setModalType('purge_images');
                      setConfirmInput('');
                    }}
                    disabled={actionLoading || (stats?.storage.submission_images_count || 0) === 0}
                    className="w-full py-2.5 px-4 bg-[#E7ECFA] hover:bg-[#DCE4F3] text-[#376DDD] font-semibold rounded-xl border border-[#DCE4F3] transition text-sm flex items-center justify-center space-x-2 disabled:opacity-40"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Purge Candidate Files ({stats?.storage.submission_images_count || 0})</span>
                  </button>
                </div>

                {/* Purge Option 2: Nuclear Wipe (All Submissions & Scores) */}
                <div className="p-5 bg-[#FCFDFF] border border-rose-200 hover:border-rose-300 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                        Nuclear Action
                      </span>
                      <h4 className="font-semibold text-rose-800">Wipe All Submissions & Scores</h4>
                    </div>
                    <p className="text-xs text-[#526079] leading-relaxed">
                      Deletes all submission image files from cloud storage <strong>AND</strong> deletes every submission attempt and AI score record from the database. Resets competition leaderboards to zero.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setModalType('wipe_all');
                      setConfirmInput('');
                    }}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 transition text-sm flex items-center justify-center space-x-2 disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Wipe All Submissions History</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Management Section */}
            <div className="bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="text-lg font-bold text-[#101A35] flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-[#376DDD]" />
                <span>Promote Teammate to Admin</span>
              </h3>
              <p className="text-sm text-[#526079]">
                Grant full administrator privileges to another user email address.
              </p>

              <form onSubmit={handlePromoteUser} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  placeholder="contestant@acm.org"
                  required
                  className="flex-1 px-4 py-2 bg-[#FCFDFF] border border-[#DCE4F3] rounded-xl text-[#101A35] placeholder-[#526079] focus:outline-none focus:ring-2 focus:ring-[#376DDD]/30 focus:border-[#376DDD] text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={promoteLoading || !promoteEmail}
                  className="px-5 py-2 bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-medium rounded-xl transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50 shadow-xs active:scale-95"
                >
                  {promoteLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Promote to Admin</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#101A35]">
                  {modalType === 'purge_images' ? 'Confirm Storage Purge' : 'Confirm Complete Wipe'}
                </h3>
              </div>

              <p className="text-sm text-[#526079] leading-relaxed">
                {modalType === 'purge_images' ? (
                  <>
                    This will permanently delete all candidate recreation image files from Supabase Storage. Scores and leaderboard positions will be preserved. To confirm, type <strong className="text-emerald-700 font-mono">PURGE</strong> below:
                  </>
                ) : (
                  <>
                    This will permanently delete all submission image files and wipe all scores from the database. This action is irreversible. To confirm, type <strong className="text-rose-600 font-mono">WIPE</strong> below:
                  </>
                )}
              </p>

              <div>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={modalType === 'purge_images' ? 'Type PURGE' : 'Type WIPE'}
                  className="w-full px-4 py-2.5 bg-[#FCFDFF] border border-[#DCE4F3] rounded-xl text-[#101A35] font-mono placeholder-[#526079] focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalType(null);
                    setConfirmInput('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-4 bg-[#E7ECFA] hover:bg-[#DCE4F3] text-[#526079] font-medium rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={modalType === 'purge_images' ? handlePurgeSubmissionImages : handleWipeAllSubmissions}
                  disabled={
                    actionLoading ||
                    (modalType === 'purge_images' && confirmInput !== 'PURGE') ||
                    (modalType === 'wipe_all' && confirmInput !== 'WIPE')
                  }
                  className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-sm transition flex items-center justify-center space-x-2 disabled:opacity-40 shadow-xs"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Execute Purge</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
