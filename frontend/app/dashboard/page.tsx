'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/apiClient';
import { Submission, UserProfile } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import { Trophy, Upload, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ParticipantDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await apiClient.getMe();
        setUser(me);

        if (me) {
          const subs = await apiClient.listSubmissions({ participant_id: me.id });
          setSubmissions(subs);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalSubmissions = submissions.length;
  const bestScore = submissions.reduce((max, s) => {
    const sc = s.score?.final_score || 0;
    return sc > max ? sc : max;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Participant Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Welcome back, <span className="text-zinc-200 font-medium">{user?.display_name || 'Contestant'}</span>. Review your competition recreation attempts and scoring performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/competitions"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Join Competitions</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Total Submissions</span>
          <div className="text-3xl font-extrabold text-white font-mono">{totalSubmissions}</div>
          <span className="text-[11px] text-zinc-500">Across all contests</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Personal Best Score</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {bestScore > 0 ? bestScore.toFixed(1) : '—'}
          </div>
          <span className="text-[11px] text-zinc-500">Reference Similarity Score</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Account Role</span>
          <div className="text-2xl font-bold text-indigo-400 capitalize pt-1">{user?.role || 'Participant'}</div>
          <Link href="/dashboard/profile" className="text-[11px] text-blue-400 hover:underline">
            Manage profile settings →
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Recent Submissions</h2>
          <Link href="/dashboard/submissions" className="text-xs text-blue-400 hover:underline">
            View full history →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs space-y-2">
            <Upload className="h-8 w-8 mx-auto text-zinc-600" />
            <p>You have not submitted any AI recreations yet.</p>
            <Link href="/competitions" className="text-blue-400 hover:underline inline-block pt-1">
              Browse active competitions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.slice(0, 5).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {sub.signed_image_url ? (
                    <img
                      src={sub.signed_image_url}
                      alt="Submission thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-zinc-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                      IMG
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      Attempt #{sub.attempt_number}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Submitted on {new Date(sub.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {sub.score ? (
                    <ScoreBadge score={sub.score.final_score} size="md" />
                  ) : (
                    <span className="text-xs text-zinc-500 capitalize">{sub.scoring_status}</span>
                  )}

                  <Link
                    href={`/competitions/${sub.competition_id}`}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
