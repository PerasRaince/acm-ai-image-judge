'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/apiClient';
import { Competition } from '../../../types';
import { CountdownTimer } from '../../../components/CountdownTimer';
import { Trophy, Upload, Calendar, Clock, Layers, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setJoining(true);
    try {
      await apiClient.joinCompetition(id);
      // Reload competition to update is_joined status
      const updated = await apiClient.getCompetition(id);
      setCompetition(updated);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-96 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Competition Not Found</h2>
        <p className="text-xs text-zinc-400">{errorMsg || 'The requested competition could not be retrieved.'}</p>
        <Link href="/competitions" className="inline-block px-4 py-2 bg-zinc-800 rounded-lg text-xs text-zinc-200">
          Back to Directory
        </Link>
      </div>
    );
  }

  const isActive = competition.status === 'active';
  const attemptsRemaining = competition.submission_limit - (competition.attempts_used || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/competitions"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Competitions</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Reference Image on Left, Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Reference Image Target */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-xl">
            {competition.reference_image_url ? (
              <img
                src={competition.reference_image_url}
                alt={competition.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-zinc-600">No reference image</span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Required Aspect Ratio:</span>
              <span className="font-mono text-zinc-200 font-semibold">{competition.required_aspect_ratio}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Submission Limit:</span>
              <span className="font-mono text-zinc-200 font-semibold">{competition.submission_limit} recreations</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Attempts Remaining:</span>
              <span className="font-mono text-blue-400 font-semibold">
                {competition.is_joined ? `${attemptsRemaining} attempts left` : 'Join to participate'}
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
              <span className="text-xs text-zinc-400 font-mono">
                Scorer: {competition.scoring_version_id ? 'v1.0.0 (Ensemble)' : 'Standard v1.0'}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
              {competition.title}
            </h1>

            {competition.organizer && (
              <p className="text-xs text-zinc-400">
                Organized by <span className="text-zinc-200 font-medium">{competition.organizer.display_name}</span>
              </p>
            )}
          </div>

          {/* Time Countdown */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>Time Remaining:</span>
            </div>
            <CountdownTimer targetDate={competition.ends_at} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Description</h3>
            <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line bg-zinc-900/30 p-4 rounded-xl border border-zinc-850">
              {competition.description || 'Use your AI image generation tool (Midjourney, Stable Diffusion, Flux, DALL-E) to recreate the target reference image as faithfully as possible.'}
            </p>
          </div>

          {/* Rules */}
          {competition.rules && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Competition Rules</h3>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line bg-zinc-900/30 p-4 rounded-xl border border-zinc-850">
                {competition.rules}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-4">
            {!competition.is_joined ? (
              <button
                onClick={handleJoin}
                disabled={joining || !isActive}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{joining ? 'Joining...' : 'Join Competition'}</span>
              </button>
            ) : (
              <Link
                href={`/competitions/${competition.id}/submit`}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Upload className="h-4 w-4" />
                <span>Submit AI Recreation Attempt</span>
              </Link>
            )}

            <Link
              href={`/competitions/${competition.id}/leaderboard`}
              className="px-5 py-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs transition-colors flex items-center gap-2"
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
