'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../../lib/apiClient';
import { Competition, CompetitionStatus } from '../../../../types';
import { Shield, ArrowLeft, Trophy, Users, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrganizerManageCompetitionPage() {
  const params = useParams();
  const id = params?.id as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const comp = await apiClient.getCompetition(id);
        setCompetition(comp);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load competition');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleStatusChange(newStatus: CompetitionStatus) {
    if (!competition) return;
    setUpdatingStatus(true);
    setMsg(null);
    setErrorMsg(null);

    try {
      const updated = await apiClient.updateCompetition(competition.id, {
        status: newStatus
      });
      setCompetition(updated);
      setMsg(`Competition status transitioned to '${newStatus}'.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-xs text-zinc-500">Loading competition management...</div>;
  }

  if (!competition) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-xs text-rose-400">Competition not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Organizer Studio</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
              {competition.status}
            </span>
            <span className="text-xs text-zinc-500 font-mono">ID: {competition.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {competition.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/competitions/${competition.id}/leaderboard`}
            className="px-3.5 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-600/20 transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Public Leaderboard</span>
          </Link>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Tabs / Sub-pages */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs">
        <Link
          href={`/organizer/competitions/${competition.id}`}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-medium"
        >
          Control Panel
        </Link>
        <Link
          href={`/organizer/competitions/${competition.id}/submissions`}
          className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 font-medium"
        >
          Review Submissions
        </Link>
        <Link
          href={`/organizer/competitions/${competition.id}/participants`}
          className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 font-medium"
        >
          Participants Roster
        </Link>
        <Link
          href={`/organizer/competitions/${competition.id}/results`}
          className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 font-medium"
        >
          Final Results
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Reference Image */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
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
        </div>

        {/* Right Column: Status Controls & Configuration */}
        <div className="lg:col-span-7 space-y-6 text-xs">
          {/* Status Transitions Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h3 className="font-bold text-sm text-zinc-200">Lifecycle State Management</h3>
            <p className="text-zinc-400 leading-relaxed">
              Transition the competition status. Active competitions accept contestant recreations. Completed competitions lock scores permanently.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleStatusChange('active')}
                disabled={updatingStatus || competition.status === 'active'}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold transition-colors"
              >
                Set Active
              </button>
              <button
                onClick={() => handleStatusChange('scoring')}
                disabled={updatingStatus || competition.status === 'scoring'}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold transition-colors"
              >
                Set Scoring
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updatingStatus || competition.status === 'completed'}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold transition-colors"
              >
                Close & Complete
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updatingStatus || competition.status === 'cancelled'}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Configuration Summary Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <h3 className="font-bold text-sm text-zinc-200">Configuration Details</h3>
            <div className="divide-y divide-zinc-800 text-zinc-300">
              <div className="py-2 flex justify-between">
                <span className="text-zinc-500">Aspect Ratio:</span>
                <span className="font-mono text-zinc-200">{competition.required_aspect_ratio}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-zinc-500">Submission Limit:</span>
                <span className="font-mono text-zinc-200">{competition.submission_limit} per contestant</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-zinc-500">Start Time:</span>
                <span className="text-zinc-200">{new Date(competition.starts_at).toLocaleString()}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-zinc-500">End Time:</span>
                <span className="text-zinc-200">{new Date(competition.ends_at).toLocaleString()}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-zinc-500">Leaderboard Visibility:</span>
                <span className="capitalize text-zinc-200">{competition.leaderboard_visibility}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
