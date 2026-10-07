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
  Play,
  Download,
  Lock,
  EyeOff
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
        <div className="h-96 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#DCE4F3]" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#101A35]">Competition Not Found</h2>
        <p className="text-xs text-[#526079]">{errorMsg || 'The requested competition could not be retrieved.'}</p>
        <Link href="/competitions" className="inline-block px-4 py-2 bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] rounded-lg text-xs text-[#376DDD] font-semibold transition-colors">
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
          className="inline-flex items-center gap-1.5 text-xs text-[#526079] hover:text-[#101A35] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Competitions</span>
        </Link>

        {/* Shareable Code Badge & Invitation Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#FFFFFF] border border-[#DCE4F3] rounded-xl px-3 py-1.5 text-xs font-mono shadow-xs">
            <span className="text-[#526079] mr-2">Code:</span>
            <span className="text-[#376DDD] font-bold tracking-wider">{competition.code}</span>
            <button
              onClick={() => copyToClipboard(competition.code, false)}
              className="ml-2 text-[#526079] hover:text-[#376DDD] transition-colors"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => copyToClipboard(inviteUrl, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#E7ECFA] border border-[#DCE4F3] text-xs font-medium text-[#101A35] transition-colors shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#376DDD]" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {competition.is_host && (
        <div className="p-4 rounded-2xl bg-[#E7ECFA] border border-[#DCE4F3] text-[#101A35] text-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Crown className="w-4 h-4 text-[#376DDD] flex-shrink-0" />
            <span>
              <strong>You are the Host</strong> of this competition. Status:{' '}
              <span
                className={`font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-[11px] ${
                  competition.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#DCE4F3] text-[#526079]'
                }`}
              >
                {competition.status}
              </span>
              . Contestants can join with code{' '}
              <code className="font-mono font-bold text-[#376DDD] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#DCE4F3]">
                {competition.code}
              </code>
              .
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(inviteUrl, true)}
              className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FCFDFF] border border-[#DCE4F3] text-[#376DDD] text-xs font-medium transition-colors shadow-xs"
            >
              Copy Invite URL
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs ${
                competition.status === 'active'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Reference Image on Left, Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Reference Image Target */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-[#DCE4F3] bg-[#E7ECFA]/30 flex items-center justify-center shadow-xs group">
            {competition.reference_image_url ? (
              <>
                <Image
                  src={competition.reference_image_url}
                  alt={competition.title}
                  fill
                  unoptimized
                  className={`object-contain transition-all duration-300 ${
                    competition.is_host
                      ? ''
                      : 'blur-3xl scale-110 select-none pointer-events-none filter'
                  }`}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                {!competition.is_host && (
                  <div className="absolute inset-0 bg-[#101A35]/35 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
                    <div className="p-3 rounded-full bg-[#FFFFFF]/90 text-[#376DDD] shadow-md mb-2">
                      <Lock className="w-5 h-5 text-[#376DDD]" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      Target Reference Concealed
                    </span>
                    <span className="text-[11px] text-white/95 max-w-xs mt-1 drop-shadow-sm font-medium">
                      Heavily blurred for contestants to preserve prompt recreation integrity.
                    </span>
                  </div>
                )}
                {competition.is_host && (
                  <div className="absolute top-2.5 left-2.5 bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#DCE4F3] text-[#376DDD] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs pointer-events-none">
                    <Crown className="w-3 h-3" />
                    <span>Host View (Unblurred)</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-[#526079]">No reference image</span>
            )}
          </div>

          {competition.is_host && competition.reference_image_url && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = competition.reference_image_url!;
                link.download = `${competition.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_target_reference.jpg`;
                link.target = '_blank';
                link.click();
              }}
              className="w-full py-2 bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] rounded-xl text-xs font-semibold text-[#376DDD] flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Host: Download Target Reference Image</span>
            </button>
          )}

          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] space-y-2 text-xs shadow-xs">
            <div className="flex justify-between text-[#526079]">
              <span>Required Aspect Ratio:</span>
              <span className="font-mono text-[#101A35] font-semibold">{competition.required_aspect_ratio}</span>
            </div>
            <div className="flex justify-between text-[#526079]">
              <span>Submission Limit:</span>
              <span className="font-mono text-[#101A35] font-semibold">{competition.submission_limit} recreations</span>
            </div>
            <div className="flex justify-between text-[#526079]">
              <span>Attempts Remaining:</span>
              <span className="font-mono text-[#376DDD] font-semibold">
                {canSubmit ? `${attemptsRemaining} attempts left` : 'Join to participate'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Competition Metadata and Action Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                {competition.status}
              </span>
              <span className="text-xs text-[#526079] font-mono">
                AI Scorer: v1.0.0 (DreamSim + DINO + CLIP + LPIPS + Color + Quality)
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-[#101A35] tracking-tight leading-snug">
              {competition.title}
            </h1>

            <p className="text-xs text-[#526079]">
              Hosted by <span className="text-[#101A35] font-semibold">{hostName}</span>
            </p>
          </div>

          {/* Time Countdown */}
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs text-[#526079]">
              <Clock className="h-4 w-4 text-[#376DDD]" />
              <span>Time Remaining:</span>
            </div>
            <CountdownTimer targetDate={competition.ends_at} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#101A35] uppercase tracking-wider">Description</h3>
            <p className="text-xs text-[#526079] leading-relaxed whitespace-pre-line bg-[#FFFFFF] p-4 rounded-xl border border-[#DCE4F3] shadow-xs">
              {competition.description || 'Use your AI image generation tool to recreate the target reference image as faithfully as possible.'}
            </p>
          </div>

          {/* Rules */}
          {competition.rules && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#101A35] uppercase tracking-wider">Competition Rules</h3>
              <p className="text-xs text-[#526079] leading-relaxed whitespace-pre-line bg-[#FFFFFF] p-4 rounded-xl border border-[#DCE4F3] shadow-xs">
                {competition.rules}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-[#DCE4F3] flex flex-wrap items-center gap-4">
            {!canSubmit ? (
              <button
                onClick={handleJoin}
                disabled={joining || !isActive}
                className="px-6 py-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{joining ? 'Joining...' : 'Join Competition'}</span>
              </button>
            ) : (
              <Link
                href={`/competitions/${competition.id}/submit`}
                className="px-6 py-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs active:scale-95"
              >
                <Upload className="h-4 w-4" />
                <span>Submit AI Recreation</span>
              </Link>
            )}

            <Link
              href={`/competitions/${competition.id}/leaderboard`}
              className="px-5 py-3 rounded-xl border border-[#DCE4F3] bg-[#E7ECFA] hover:bg-[#DCE4F3] text-[#376DDD] font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Trophy className="h-4 w-4 text-[#376DDD]" />
              <span>View Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
