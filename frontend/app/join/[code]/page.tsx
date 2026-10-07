'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../../lib/supabaseClient';
import { apiClient } from '../../../lib/apiClient';
import { Competition } from '../../../types';
import { Trophy, Calendar, Sparkles, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, Users } from 'lucide-react';

export default function JoinCompetitionPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!code) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1. Check authentication status
        const { data: { session } } = await supabase.auth.getSession();
        const authed = !!session;
        setIsAuthenticated(authed);
        setCurrentUserId(session?.user?.id || null);

        // 2. Fetch competition details by code
        const comp = await apiClient.getCompetitionByCode(code);
        setCompetition(comp);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not find this competition.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [code]);

  const handleJoin = async () => {
    if (!competition) return;

    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/join/${code}`)}`);
      return;
    }

    setJoining(true);
    setErrorMsg(null);

    try {
      const result = await apiClient.joinCompetitionByCode(code);
      router.push(`/competitions/${result.competition.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to join competition.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#376DDD]/20 border-t-[#376DDD] rounded-full animate-spin" />
        <p className="text-[#526079] text-sm font-medium">Resolving competition invitation...</p>
      </div>
    );
  }

  if (errorMsg && !competition) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#101A35]">Competition Not Found</h2>
          <p className="text-xs text-[#526079] leading-relaxed">
            The competition code <span className="font-mono text-[#376DDD] font-semibold">{code}</span> is invalid or may have been removed.
          </p>
          <div className="pt-2">
            <Link
              href="/competitions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] text-[#376DDD] text-xs font-semibold transition-all"
            >
              Browse Public Competitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!competition) return null;

  const isHost = currentUserId === competition.host_id;
  const isJoined = competition.is_joined || isHost;
  const isExpired = new Date(competition.ends_at) < new Date();

  return (
    <div className="min-h-[85vh] py-12 px-4 max-w-4xl mx-auto">
      {/* Invitation Header Card */}
      <div className="bg-[#FFFFFF] border border-[#DCE4F3] rounded-3xl overflow-hidden shadow-sm">
        {/* Banner with competition badge */}
        <div className="p-6 sm:p-8 bg-[#E7ECFA]/70 border-b border-[#DCE4F3] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-[#FFFFFF] border border-[#DCE4F3] text-[#376DDD] uppercase tracking-wider">
                Code: {competition.code}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 capitalize">
                {competition.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101A35] tracking-tight">
              {competition.title}
            </h1>
            <p className="text-xs text-[#526079] flex items-center gap-2">
              Hosted by <span className="text-[#101A35] font-semibold">{competition.host?.display_name || 'Creator'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isHost ? (
              <Link
                href={`/competitions/${competition.id}`}
                className="px-6 py-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold text-sm transition-all shadow-xs inline-flex items-center gap-2 active:scale-95"
              >
                <span>Host Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isJoined ? (
              <Link
                href={`/competitions/${competition.id}`}
                className="px-6 py-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] text-white font-semibold text-sm transition-all shadow-xs inline-flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Go to Competition</span>
              </Link>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining || isExpired}
                className="px-6 py-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-xs inline-flex items-center gap-2 active:scale-95"
              >
                {joining ? (
                  <span>Joining...</span>
                ) : isAuthenticated ? (
                  <>
                    <span>Join Competition</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Sign In to Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Reference Image Preview */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-[#101A35] font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#376DDD]" />
              Reference Target Image
            </h3>
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#E7ECFA]/30 border border-[#DCE4F3] shadow-xs flex items-center justify-center">
              {competition.reference_image_url ? (
                <Image
                  src={competition.reference_image_url}
                  alt={competition.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="text-xs text-[#526079]">Image Preview Protected</div>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#526079] px-1">
              <span>Required Aspect Ratio: <strong className="text-[#101A35]">{competition.required_aspect_ratio}</strong></span>
              <span>Attempts Allowed: <strong className="text-[#101A35]">{competition.submission_limit}</strong></span>
            </div>
          </div>

          {/* Rules & Details */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#101A35] font-semibold mb-1">
                  Description
                </h3>
                <p className="text-xs text-[#526079] leading-relaxed whitespace-pre-wrap">
                  {competition.description || 'No specific description provided for this challenge.'}
                </p>
              </div>

              {competition.rules && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#101A35] font-semibold mb-1">
                    Rules & Guidelines
                  </h3>
                  <div className="p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3] text-xs text-[#526079] whitespace-pre-wrap leading-relaxed">
                    {competition.rules}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#526079] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#376DDD]" />
                    Deadline
                  </span>
                  <span className="text-[#101A35] font-medium">
                    {new Date(competition.ends_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#526079] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#376DDD]" />
                    AI Evaluation
                  </span>
                  <span className="text-[#101A35] font-medium">
                    6-Metric Multi-Layer Ensemble
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#526079] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Status
                  </span>
                  <span className="text-[#101A35] font-medium capitalize">
                    {competition.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Call-to-action */}
            <div className="pt-4 border-t border-[#DCE4F3]">
              {isHost ? (
                <div className="text-xs text-[#526079] flex items-center justify-between">
                  <span>You created and host this competition.</span>
                  <Link
                    href={`/competitions/${competition.id}`}
                    className="text-[#376DDD] hover:text-[#285BC4] font-semibold"
                  >
                    Go to host console &rarr;
                  </Link>
                </div>
              ) : isJoined ? (
                <div className="text-xs flex items-center justify-between flex-wrap gap-2">
                  <span className="text-emerald-700 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    You are participating in this competition.
                  </span>
                  <Link
                    href={`/competitions/${competition.id}/submit`}
                    className="px-4 py-2 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold transition-all shadow-xs inline-flex items-center"
                  >
                    <span className="text-white font-semibold">Submit Recreation</span>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining || isExpired}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  {joining ? (
                    <span>Joining...</span>
                  ) : isAuthenticated ? (
                    <>
                      <span>Join Competition Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Sign In with Return to Join</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
