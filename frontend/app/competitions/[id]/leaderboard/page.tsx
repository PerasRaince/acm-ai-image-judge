'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../../lib/apiClient';
import { LeaderboardData } from '../../../../types';
import { ScoreBadge } from '../../../../components/ScoreBadge';
import { Trophy, ArrowLeft, Medal, Info, Clock, AlertCircle } from 'lucide-react';

export default function LeaderboardPage() {
  const params = useParams();
  const id = params?.id as string;

  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await apiClient.getLeaderboard(id);
        setLeaderboard(data);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-4">
        <div className="h-24 rounded-2xl bg-[#0B1D35] animate-pulse border border-[#002B49]" />
        <div className="h-96 rounded-2xl bg-[#0B1D35] animate-pulse border border-[#002B49]" />
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Leaderboard Not Available</h2>
        <p className="text-xs text-slate-400">{errorMsg || 'Unable to retrieve leaderboard data.'}</p>
        <Link href={`/competitions/${id}`} className="inline-block px-4 py-2 bg-[#002B49] hover:bg-[#003860] border border-[#0085CA]/20 rounded-xl text-xs text-slate-200">
          Back to Competition
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/competitions/${leaderboard.competition_id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {leaderboard.competition_title}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#002B49] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Competition Leaderboard
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            {leaderboard.competition_title} • Transparent server-side score rankings
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-sky-300 bg-[#0B1D35] px-3 py-1.5 rounded-xl border border-[#002B49] font-mono">
            Scoring Version: {leaderboard.scoring_version}
          </span>
        </div>
      </div>

      {/* Tie-breaking policy explanation */}
      <div className="p-4 rounded-xl bg-[#0085CA]/10 border border-[#0085CA]/20 flex items-start gap-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-[#00A3E0] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white">Deterministic Tie-Breaking Policy:</span>
          <p className="text-[11px] leading-relaxed text-slate-300">
            1. Highest Reference Similarity Score (0-100) → 2. DreamSim Perceptual Similarity → 3. DINOv2 Structural Correspondence → 4. Earliest valid submission timestamp.
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.entries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#002B49] rounded-2xl p-8 space-y-3 bg-[#0B1D35]/30">
          <Trophy className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No submissions yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Be the first contestant to submit an AI recreation and claim rank #1!
          </p>
          <div className="pt-2">
            <Link
              href={`/competitions/${leaderboard.competition_id}/submit`}
              className="px-4 py-2 bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white rounded-xl text-xs font-semibold inline-block transition-all shadow-md shadow-[#0085CA]/20 active:scale-95"
            >
              Submit Recreation
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#002B49] bg-[#0B1D35]/50">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#071527] text-[11px] font-semibold text-slate-400 border-b border-[#002B49] uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3.5 w-16 text-center">Rank</th>
                <th scope="col" className="px-4 py-3.5">Participant</th>
                <th scope="col" className="px-4 py-3.5 text-center">Final Score</th>
                <th scope="col" className="px-4 py-3.5 text-center hidden md:table-cell">DreamSim (35%)</th>
                <th scope="col" className="px-4 py-3.5 text-center hidden md:table-cell">DINO (30%)</th>
                <th scope="col" className="px-4 py-3.5 text-center hidden lg:table-cell">CLIP (15%)</th>
                <th scope="col" className="px-4 py-3.5 text-center hidden lg:table-cell">LPIPS (10%)</th>
                <th scope="col" className="px-4 py-3.5 text-center hidden xl:table-cell">Color (5%)</th>
                <th scope="col" className="px-4 py-3.5 text-center hidden xl:table-cell">Quality (5%)</th>
                <th scope="col" className="px-4 py-3.5 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#002B49]/70 font-sans">
              {leaderboard.entries.map((entry) => {
                let rankBadge = <span className="font-mono font-bold text-slate-400">#{entry.rank}</span>;
                let rowHighlight = '';

                if (entry.rank === 1) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      🥇
                    </span>
                  );
                  rowHighlight = 'bg-amber-500/[0.04]';
                } else if (entry.rank === 2) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/30 font-bold">
                      🥈
                    </span>
                  );
                } else if (entry.rank === 3) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/30 font-bold">
                      🥉
                    </span>
                  );
                }

                return (
                  <tr key={entry.submission_id} className={`hover:bg-[#002B49]/30 transition-colors ${rowHighlight}`}>
                    {/* Rank */}
                    <td className="px-4 py-4 text-center">{rankBadge}</td>

                    {/* Participant */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {entry.recreation_image_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#002B49] shrink-0 bg-[#040C16]">
                            <img
                              src={entry.recreation_image_url}
                              alt={entry.participant_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#002B49] border border-[#0085CA]/30 flex items-center justify-center text-xs font-semibold text-sky-300">
                            {entry.participant_name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-100">{entry.participant_name}</div>
                          <div className="text-[10px] text-slate-400">Attempt #{entry.attempt_number}</div>
                        </div>
                      </div>
                    </td>

                    {/* Final Score */}
                    <td className="px-4 py-4 text-center">
                      <ScoreBadge score={entry.final_score} size="md" />
                    </td>

                    {/* DreamSim */}
                    <td className="px-4 py-4 text-center hidden md:table-cell font-mono text-slate-300">
                      {entry.dreamsim_score}
                    </td>

                    {/* DINO */}
                    <td className="px-4 py-4 text-center hidden md:table-cell font-mono text-slate-300">
                      {entry.dino_score}
                    </td>

                    {/* CLIP */}
                    <td className="px-4 py-4 text-center hidden lg:table-cell font-mono text-slate-400">
                      {entry.clip_score}
                    </td>

                    {/* LPIPS */}
                    <td className="px-4 py-4 text-center hidden lg:table-cell font-mono text-slate-400">
                      {entry.lpips_score}
                    </td>

                    {/* Color */}
                    <td className="px-4 py-4 text-center hidden xl:table-cell font-mono text-slate-400">
                      {entry.color_score}
                    </td>

                    {/* Quality */}
                    <td className="px-4 py-4 text-center hidden xl:table-cell font-mono text-slate-400">
                      {entry.quality_score}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-4 text-right text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(entry.submitted_at).toLocaleDateString()}{' '}
                      <span className="text-slate-500">
                        {new Date(entry.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
