'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { apiClient } from '../../lib/apiClient';
import { Competition, Submission, UserProfile } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import JoinCodeInput from '../../components/JoinCodeInput';
import {
  Trophy,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Layers,
  StopCircle,
  Play
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hostedComps, setHostedComps] = useState<Competition[]>([]);
  const [joinedComps, setJoinedComps] = useState<Competition[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push(`/login?returnUrl=${encodeURIComponent('/dashboard')}`);
          return;
        }

        const me = await apiClient.getMe();
        setUser(me);

        if (me) {
          // Fetch hosted competitions
          const hosted = await apiClient.listCompetitions({ host_id: me.id });
          setHostedComps(hosted);

          // Fetch joined competitions
          try {
            const joined = await apiClient.listJoinedCompetitions();
            setJoinedComps(joined);
          } catch {
            setJoinedComps([]);
          }

          // Fetch submissions
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
  }, [router]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const [updatingCompId, setUpdatingCompId] = useState<string | null>(null);

  async function handleToggleHostStatus(comp: Competition) {
    const isStopping = comp.status === 'active';
    const newStatus = isStopping ? 'completed' : 'active';
    const confirmMsg = isStopping
      ? `Are you sure you want to stop "${comp.title}"? Submissions will close and the leaderboard will be finalized.`
      : `Do you want to re-open "${comp.title}" for new submissions?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingCompId(comp.id);
    try {
      const updated = await apiClient.updateCompetition(comp.id, { status: newStatus });
      setHostedComps((prev) =>
        prev.map((c) => (c.id === comp.id ? { ...c, status: updated.status } : c))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update competition status');
    } finally {
      setUpdatingCompId(null);
    }
  }


  const totalSubmissions = submissions.length;
  const bestScore = submissions.reduce((max, s) => {
    const sc = s.score?.final_score || 0;
    return sc > max ? sc : max;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Google Meet style Top Join Bar */}
      <div className="bg-[#E7ECFA]/70 border border-[#DCE4F3] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101A35] tracking-tight">
              Welcome, {user?.display_name || 'Creator'}
            </h1>
            <p className="text-xs text-[#526079]">
              Host your own competition or join another challenge using a code or invitation link.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/competitions/create"
              className="px-5 py-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host New Competition</span>
            </Link>

            <div className="w-full sm:w-auto">
              <JoinCodeInput />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] space-y-1 shadow-xs">
          <span className="text-xs text-[#526079]">Hosted Competitions</span>
          <div className="text-3xl font-extrabold text-[#101A35] font-mono">{hostedComps.length}</div>
          <span className="text-[11px] text-[#526079]">Active challenges created by you</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] space-y-1 shadow-xs">
          <span className="text-xs text-[#526079]">Personal Best Score</span>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono">
            {bestScore > 0 ? bestScore.toFixed(1) : '—'}
          </div>
          <span className="text-[11px] text-[#526079]">Across {totalSubmissions} recreation attempts</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] space-y-1 shadow-xs">
          <span className="text-xs text-[#526079]">Joined Competitions</span>
          <div className="text-3xl font-extrabold text-[#376DDD] font-mono">{joinedComps.length}</div>
          <span className="text-[11px] text-[#526079]">Challenges entered as contestant</span>
        </div>
      </div>

      {/* Hosted Competitions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#376DDD]" />
            <h2 className="text-lg font-bold text-[#101A35] tracking-tight">Hosted by You</h2>
          </div>
          <Link
            href="/competitions/create"
            className="text-xs text-[#376DDD] hover:text-[#285BC4] font-medium hover:underline flex items-center gap-1"
          >
            <span>Create another</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="h-32 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#DCE4F3]" />
        ) : hostedComps.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] text-center space-y-3 shadow-xs">
            <p className="text-xs text-[#526079]">
              You haven&apos;t hosted any competitions yet. Create one to get a unique code and invite others!
            </p>
            <Link
              href="/competitions/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] text-[#376DDD] text-xs font-semibold transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Your First Competition</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hostedComps.map((comp) => (
              <div
                key={comp.id}
                className="bg-[#FFFFFF] border border-[#DCE4F3] hover:border-[#376DDD]/40 rounded-2xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase">
                      {comp.status}
                    </span>
                    <button
                      onClick={() => copyCode(comp.code)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[#376DDD] hover:text-[#285BC4] bg-[#E7ECFA] border border-[#DCE4F3] px-2 py-0.5 rounded transition-colors"
                      title="Click to copy code"
                    >
                      {copiedCode === comp.code ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{comp.code}</span>
                    </button>
                  </div>

                  <h3 className="font-bold text-[#101A35] text-sm line-clamp-1">
                    {comp.title}
                  </h3>
                  <p className="text-xs text-[#526079] line-clamp-2">
                    {comp.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DCE4F3] flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleToggleHostStatus(comp)}
                    disabled={updatingCompId === comp.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs ${
                      comp.status === 'active'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {comp.status === 'active' ? (
                      <StopCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {updatingCompId === comp.id
                        ? 'Updating...'
                        : comp.status === 'active'
                        ? 'Stop Challenge'
                        : 'Re-open Challenge'}
                    </span>
                  </button>

                  <Link
                    href={`/competitions/${comp.id}`}
                    className="text-[#376DDD] hover:text-[#285BC4] font-semibold inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-[#E7ECFA] transition-colors"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Joined Competitions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#376DDD]" />
            <h2 className="text-lg font-bold text-[#101A35] tracking-tight">Joined as Contestant</h2>
          </div>
          <Link
            href="/competitions"
            className="text-xs text-[#376DDD] hover:text-[#285BC4] font-medium hover:underline flex items-center gap-1"
          >
            <span>Browse public competitions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="h-28 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#DCE4F3]" />
        ) : joinedComps.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] text-center space-y-2 shadow-xs">
            <p className="text-xs text-[#526079]">
              You haven&apos;t joined any competitions yet. Enter a code above or browse the directory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinedComps.map((comp) => (
              <div
                key={comp.id}
                className="bg-[#FFFFFF] border border-[#DCE4F3] hover:border-[#376DDD]/40 rounded-2xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E7ECFA] border border-[#DCE4F3] text-[#376DDD] uppercase font-mono">
                      Code: {comp.code}
                    </span>
                    <span className="text-[11px] text-[#526079]">
                      Host: {comp.host?.display_name || 'Creator'}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#101A35] text-sm line-clamp-1">
                    {comp.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-[#DCE4F3] flex items-center justify-between text-xs">
                  <Link
                    href={`/competitions/${comp.id}/submit`}
                    className="px-3.5 py-1.5 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
                  >
                    Submit Recreation
                  </Link>
                  <Link
                    href={`/competitions/${comp.id}/leaderboard`}
                    className="text-[#526079] hover:text-[#101A35] font-medium"
                  >
                    Leaderboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#101A35] tracking-tight">Recent Submissions</h2>
          <Link href="/dashboard/submissions" className="text-xs text-[#376DDD] hover:underline">
            View full history &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[#FFFFFF] animate-pulse border border-[#DCE4F3]" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] text-center space-y-2 shadow-xs">
            <p className="text-xs text-[#526079]">No submissions uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {submissions.slice(0, 5).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] hover:border-[#376DDD]/40 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FCFDFF] border border-[#DCE4F3] overflow-hidden flex items-center justify-center flex-shrink-0">
                    {sub.signed_image_url ? (
                      <img src={sub.signed_image_url} alt="Submission" className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-4 h-4 text-[#526079]" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#101A35]">
                      Attempt #{sub.attempt_number}
                    </div>
                    <div className="text-[11px] text-[#526079]">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {sub.score ? (
                    <ScoreBadge score={sub.score.final_score} size="sm" />
                  ) : (
                    <span className="text-[11px] text-[#526079] capitalize">{sub.scoring_status}</span>
                  )}
                  <Link
                    href={`/competitions/${sub.competition_id}`}
                    className="text-xs text-[#376DDD] hover:text-[#285BC4] font-semibold"
                  >
                    View &rarr;
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
