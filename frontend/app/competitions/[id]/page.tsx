'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { apiClient } from '../../../lib/apiClient';
import { Competition } from '../../../types';
import { CountdownTimer } from '../../../components/CountdownTimer';
import {
  Trophy,
  Upload,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Share2,
  Crown,
  Sparkles,
  StopCircle,
  Play
} from 'lucide-react';

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await apiClient.getCompetition(id);
        setCompetition(data);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load competition');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleJoin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/competitions/${id}`)}`);
      return;
    }

    setJoining(true);
    setErrorMsg(null);
    try {
      await apiClient.joinCompetition(id);
      setCompetition(prev => prev ? { ...prev, is_joined: true } : prev);
      const updated = await apiClient.getCompetition(id);
      setCompetition(updated);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to join competition');
    } finally {
      setJoining(false);
    }
  }

  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function handleToggleStatus() {
    if (!competition) return;
    const isStopping = competition.status === 'active';
    const newStatus = isStopping ? 'completed' : 'active';
    const confirmMsg = isStopping
      ? 'Are you sure you want to STOP this competition? Submissions will close and the leaderboard will be finalized.'
      : 'Do you want to RE-OPEN this competition for new submissions?';

    if (!window.confirm(confirmMsg)) return;

    setUpdatingStatus(true);
    setErrorMsg(null);
    try {
      const updated = await apiClient.updateCompetition(competition.id, { status: newStatus });
      setCompetition(prev => prev ? { ...prev, status: updated.status } : null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update competition status');
    } finally {
      setUpdatingStatus(false);
    }
  }


  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-96 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Competition Not Found</h2>
        <p className="text-xs text-slate-400">{errorMsg || 'The requested competition could not be retrieved.'}</p>
        <Link href="/competitions" className="inline-block px-4 py-2 bg-slate-800 rounded-lg text-xs text-slate-200">
          Back to Directory
        </Link>
      </div>
    );
  }

  const isActive = competition.status === 'active';
  const canSubmit = Boolean(competition.is_joined || competition.is_host);
  const attemptsRemaining = competition.submission_limit - (competition.attempts_used || 0);
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${competition.code}`;
  const hostName = competition.host?.display_name || competition.organizer?.display_name || 'Creator';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button & share actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/competitions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Competitions</span>
        </Link>

        {/* Shareable Code Badge & Invitation Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
            <span className="text-slate-400 mr-2">Code:</span>
            <span className="text-indigo-400 font-bold tracking-wider">{competition.code}</span>
            <button
              onClick={() => copyToClipboard(competition.code, false)}
              className="ml-2 text-slate-400 hover:text-indigo-300 transition-colors"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => copyToClipboard(inviteUrl, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {competition.is_host && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Crown className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              <strong>You are the Host</strong> of this competition. Status:{' '}
              <span
                className={`font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-[11px] ${
                  competition.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {competition.status}
              </span>
              . Contestants can join with code{' '}
              <code className="font-mono font-bold text-white bg-indigo-900/60 px-1.5 py-0.5 rounded">
                {competition.code}
              </code>
              .
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(inviteUrl, true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 text-xs font-medium transition-colors"
            >
              Copy Invite URL
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow ${
                competition.status === 'active'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {competition.status === 'active' ? (
                <StopCircle className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>
                {updatingStatus
                  ? 'Updating...'
                  : competition.status === 'active'
                  ? 'Stop Competition'
                  : 'Re-open Competition'}
              </span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Reference Image on Left, Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Reference Image Target */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-xl">
            {competition.reference_image_url ? (
              <Image
                src={competition.reference_image_url}
                alt={competition.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            ) : (
              <span className="text-xs text-slate-600">No reference image</span>
            )}
          </div>


          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Required Aspect Ratio:</span>
              <span className="font-mono text-slate-200 font-semibold">{competition.required_aspect_ratio}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Submission Limit:</span>
              <span className="font-mono text-slate-200 font-semibold">{competition.submission_limit} recreations</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Attempts Remaining:</span>
              <span className="font-mono text-indigo-400 font-semibold">
                {canSubmit ? `${attemptsRemaining} attempts left` : 'Join to participate'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Competition Metadata and Action Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {competition.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                AI Scorer: v1.0.0 (DreamSim + DINO + CLIP + LPIPS + Color + Quality)
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
              {competition.title}
            </h1>

            <p className="text-xs text-slate-400">
              Hosted by <span className="text-slate-200 font-semibold">{hostName}</span>
            </p>
          </div>

          {/* Time Countdown */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>Time Remaining:</span>
            </div>
            <CountdownTimer targetDate={competition.ends_at} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Description</h3>
            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line bg-slate-900/30 p-4 rounded-xl border border-slate-800">
              {competition.description || 'Use your AI image generation tool to recreate the target reference image as faithfully as possible.'}
            </p>
          </div>

          {/* Rules */}
          {competition.rules && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Competition Rules</h3>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                {competition.rules}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4">
            {!canSubmit ? (
              <button
                onClick={handleJoin}
                disabled={joining || !isActive}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/40 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{joining ? 'Joining...' : 'Join Competition'}</span>
              </button>
            ) : (
              <Link
                href={`/competitions/${competition.id}/submit`}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/40 active:scale-95"
              >
                <Upload className="h-4 w-4" />
                <span>Submit AI Recreation</span>
              </Link>
            )}

            <Link
              href={`/competitions/${competition.id}/leaderboard`}
              className="px-5 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>View Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
