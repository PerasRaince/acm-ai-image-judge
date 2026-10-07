'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../../lib/apiClient';
import { LeaderboardData, LeaderboardEntry } from '../../../../types';
import { ScoreBadge } from '../../../../components/ScoreBadge';
import {
  Trophy,
  ArrowLeft,
  Info,
  AlertCircle,
  Download,
  Crown,
  Eye,
  X,
  Lock,
  CheckCircle2
} from 'lucide-react';

export default function LeaderboardPage() {
  const params = useParams();
  const id = params?.id as string;

  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [compRes, lData] = await Promise.all([
          apiClient.getCompetition(id).catch(() => null),
          apiClient.getLeaderboard(id)
        ]);

        const isHost = Boolean(lData.is_host || compRes?.is_host);
        const normalizedEntries = (lData.entries || [])
          .slice()
          .sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
            if (b.final_score !== a.final_score) return b.final_score - a.final_score;
            if (b.dreamsim_score !== a.dreamsim_score) return b.dreamsim_score - a.dreamsim_score;
            if (b.dino_score !== a.dino_score) return b.dino_score - a.dino_score;
            return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
          })
          .map((entry: LeaderboardEntry, idx: number) => ({
            ...entry,
            rank: idx + 1
          }));

        setLeaderboard({
          ...lData,
          is_host: isHost,
          entries: normalizedEntries
        });
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDownloadSubmission(entry: LeaderboardEntry) {
    if (!leaderboard) return;
    setDownloadingId(entry.submission_id);
    setErrorMsg(null);
    setDownloadSuccessMsg(null);
    try {
      const cleanName = entry.participant_name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}_rank${entry.rank}_attempt${entry.attempt_number}.jpg`;
      await apiClient.downloadSubmissionImage(leaderboard.competition_id, entry.submission_id, filename);
      setDownloadSuccessMsg(`Successfully downloaded recreation for ${entry.participant_name}`);
      setTimeout(() => setDownloadSuccessMsg(null), 3500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to download submission image.');
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-4">
        <div className="h-24 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#DCE4F3]" />
        <div className="h-96 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#DCE4F3]" />
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#101A35]">Leaderboard Not Available</h2>
        <p className="text-xs text-[#526079]">{errorMsg || 'Unable to retrieve leaderboard data.'}</p>
        <Link
          href={`/competitions/${id}`}
          className="inline-block px-4 py-2 bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] rounded-xl text-xs text-[#376DDD] font-semibold transition-colors"
        >
          Back to Competition
        </Link>
      </div>
    );
  }

  const isHost = Boolean(leaderboard.is_host);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/competitions/${leaderboard.competition_id}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#526079] hover:text-[#101A35] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {leaderboard.competition_title}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE4F3] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101A35] tracking-tight">
              Live Competition Leaderboard
            </h1>
          </div>
          <p className="text-xs text-[#526079]">
            {leaderboard.competition_title} • Transparent server-side score rankings
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-[#376DDD] bg-[#E7ECFA] px-3 py-1.5 rounded-xl border border-[#DCE4F3] font-mono">
            Scoring Version: {leaderboard.scoring_version}
          </span>
        </div>
      </div>

      {/* Host permissions control notice */}
      {isHost ? (
        <div className="p-4 rounded-2xl bg-[#E7ECFA] border border-[#DCE4F3] text-xs text-[#101A35] flex items-center justify-between flex-wrap gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Crown className="w-4 h-4 text-[#376DDD] shrink-0" />
            <div>
              <span className="font-bold text-[#101A35]">Host Management Access Active:</span>
              <span className="text-[#526079] ml-1.5">
                You have exclusive host permission to inspect and download contestant recreation images. Competitors cannot download submission files.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-[#FFFFFF] px-2.5 py-1 rounded-lg border border-[#DCE4F3] text-[#376DDD] font-semibold">
            {leaderboard.entries.length} Participant Submissions
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] flex items-center gap-2.5 text-xs text-[#526079] shadow-xs">
          <Lock className="w-4 h-4 text-[#376DDD] shrink-0" />
          <span>
            Participant recreations are protected. Download permissions are restricted strictly to the competition host.
          </span>
        </div>
      )}

      {/* Winner Recreation Download Card for Host (Poster Generation) */}
      {isHost && leaderboard.entries.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
              🥇
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#101A35] text-sm">Rank #1 Winner: {leaderboard.entries[0].participant_name}</span>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {leaderboard.entries[0].final_score}/100 Score
                </span>
              </div>
              <p className="text-xs text-[#526079] mt-0.5">
                Download the winning contestant recreation image to design your ACM Chapter Congratulations poster.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDownloadSubmission(leaderboard.entries[0])}
            disabled={downloadingId === leaderboard.entries[0].submission_id}
            className="shrink-0 px-4 py-2.5 bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span className="text-white">Download Winner Image for Poster</span>
          </button>
        </div>
      )}

      {/* Success / Error Alerts */}
      {downloadSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tie-breaking policy explanation */}
      <div className="p-4 rounded-xl bg-[#E7ECFA] border border-[#DCE4F3] flex items-start gap-3 text-xs text-[#101A35]">
        <Info className="h-4 w-4 text-[#376DDD] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-[#101A35]">Deterministic Tie-Breaking Policy:</span>
          <p className="text-[11px] leading-relaxed text-[#526079]">
            1. Highest Reference Similarity Score (0-100) → 2. DreamSim Perceptual Similarity → 3. DINOv2 Structural Correspondence → 4. Earliest valid submission timestamp.
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.entries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#DCE4F3] rounded-2xl p-8 space-y-3 bg-[#FFFFFF]">
          <Trophy className="h-10 w-10 text-[#526079] mx-auto" />
          <h3 className="text-base font-semibold text-[#101A35]">No submissions yet</h3>
          <p className="text-xs text-[#526079] max-w-sm mx-auto">
            Be the first contestant to submit an AI recreation and claim rank #1!
          </p>
          <div className="pt-2">
            <Link
              href={`/competitions/${leaderboard.competition_id}/submit`}
              className="px-4 py-2 bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white rounded-xl text-xs font-semibold inline-block transition-all shadow-xs active:scale-95"
            >
              Submit Recreation
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] shadow-xs">
          <table className="w-full text-left text-xs text-[#101A35]">
            <thead className="bg-[#E7ECFA] text-[11px] font-semibold text-[#526079] border-b border-[#DCE4F3] uppercase tracking-wider">
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
                {isHost && (
                  <th scope="col" className="px-4 py-3.5 text-center">Host Download</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4F3] font-sans">
              {leaderboard.entries.map((entry) => {
                let rankBadge = <span className="font-mono font-bold text-[#526079]">#{entry.rank}</span>;
                let rowHighlight = '';

                if (entry.rank === 1) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      🥇
                    </span>
                  );
                  rowHighlight = 'bg-amber-50/40';
                } else if (entry.rank === 2) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold">
                      🥈
                    </span>
                  );
                } else if (entry.rank === 3) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                      🥉
                    </span>
                  );
                }

                return (
                  <tr key={entry.submission_id} className={`hover:bg-[#FCFDFF] transition-colors ${rowHighlight}`}>
                    {/* Rank */}
                    <td className="px-4 py-4 text-center">{rankBadge}</td>

                    {/* Participant */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {entry.recreation_image_url ? (
                          <div
                            onClick={() => {
                              if (isHost) setSelectedEntry(entry);
                            }}
                            className={`w-10 h-10 rounded-lg overflow-hidden border border-[#DCE4F3] shrink-0 bg-[#FCFDFF] relative ${
                              isHost
                                ? 'cursor-pointer hover:ring-2 hover:ring-[#376DDD] transition-all'
                                : 'pointer-events-none select-none'
                            }`}
                            title={isHost ? `Click to inspect ${entry.participant_name}'s submission` : undefined}
                          >
                            <img
                              src={entry.recreation_image_url}
                              alt={entry.participant_name}
                              className={`w-full h-full object-cover select-none ${
                                isHost ? '' : 'pointer-events-none'
                              }`}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                            {isHost && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#E7ECFA] border border-[#DCE4F3] flex items-center justify-center text-xs font-semibold text-[#376DDD]">
                            {entry.participant_name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[#101A35]">{entry.participant_name}</div>
                          <div className="text-[10px] text-[#526079]">Attempt #{entry.attempt_number}</div>
                        </div>
                      </div>
                    </td>

                    {/* Final Score */}
                    <td className="px-4 py-4 text-center">
                      <ScoreBadge score={entry.final_score} size="md" />
                    </td>

                    {/* DreamSim */}
                    <td className="px-4 py-4 text-center hidden md:table-cell font-mono text-[#101A35]">
                      {entry.dreamsim_score}
                    </td>

                    {/* DINO */}
                    <td className="px-4 py-4 text-center hidden md:table-cell font-mono text-[#101A35]">
                      {entry.dino_score}
                    </td>

                    {/* CLIP */}
                    <td className="px-4 py-4 text-center hidden lg:table-cell font-mono text-[#526079]">
                      {entry.clip_score}
                    </td>

                    {/* LPIPS */}
                    <td className="px-4 py-4 text-center hidden lg:table-cell font-mono text-[#526079]">
                      {entry.lpips_score}
                    </td>

                    {/* Color */}
                    <td className="px-4 py-4 text-center hidden xl:table-cell font-mono text-[#526079]">
                      {entry.color_score}
                    </td>

                    {/* Quality */}
                    <td className="px-4 py-4 text-center hidden xl:table-cell font-mono text-[#526079]">
                      {entry.quality_score}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-4 text-right text-[11px] text-[#526079] whitespace-nowrap">
                      {new Date(entry.submitted_at).toLocaleDateString()}{' '}
                      <span className="text-[#526079]/70">
                        {new Date(entry.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Host Only Download Column */}
                    {isHost && (
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadSubmission(entry)}
                          disabled={downloadingId === entry.submission_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                          title={`Download ${entry.participant_name}'s submission`}
                        >
                          <Download className="w-3.5 h-3.5 text-white" />
                          <span className="text-white font-semibold">{downloadingId === entry.submission_id ? 'Downloading...' : 'Download'}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Host Inspection Modal */}
      {isHost && selectedEntry && (
        <div className="fixed inset-0 z-50 bg-[#101A35]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#DCE4F3] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#376DDD]" />
                <h3 className="text-base font-bold text-[#101A35]">
                  Submission Preview: {selectedEntry.participant_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-[#526079] hover:text-[#101A35] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recreation Image */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#DCE4F3] bg-[#FCFDFF] flex items-center justify-center">
              {selectedEntry.recreation_image_url ? (
                <img
                  src={selectedEntry.recreation_image_url}
                  alt={selectedEntry.participant_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-[#526079]">No image available</span>
              )}
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#E7ECFA]/50 p-3.5 rounded-xl border border-[#DCE4F3]">
              <div>
                <span className="text-[#526079]">Rank:</span>{' '}
                <span className="font-bold text-[#101A35]">#{selectedEntry.rank}</span>
              </div>
              <div>
                <span className="text-[#526079]">Final Score:</span>{' '}
                <span className="font-bold text-[#376DDD]">{selectedEntry.final_score}/100</span>
              </div>
              <div>
                <span className="text-[#526079]">DreamSim:</span>{' '}
                <span className="font-mono text-[#101A35]">{selectedEntry.dreamsim_score}</span>
              </div>
              <div>
                <span className="text-[#526079]">DINOv2:</span>{' '}
                <span className="font-mono text-[#101A35]">{selectedEntry.dino_score}</span>
              </div>
              <div>
                <span className="text-[#526079]">Attempt:</span>{' '}
                <span className="font-mono text-[#101A35]">#{selectedEntry.attempt_number}</span>
              </div>
              <div>
                <span className="text-[#526079]">Submitted:</span>{' '}
                <span className="text-[#101A35]">{new Date(selectedEntry.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Download and Close Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] text-xs font-semibold text-[#101A35] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadSubmission(selectedEntry)}
                disabled={downloadingId === selectedEntry.submission_id}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-semibold">{downloadingId === selectedEntry.submission_id ? 'Downloading...' : 'Download Recreation Image'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
