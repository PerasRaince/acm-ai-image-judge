'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../../../lib/apiClient';
import { LeaderboardData } from '../../../../../types';
import { ScoreBadge } from '../../../../../components/ScoreBadge';
import { ArrowLeft, Trophy, Download } from 'lucide-react';

export default function OrganizerResultsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await apiClient.getLeaderboard(id);
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function exportCsv() {
    if (!leaderboard) return;
    const headers = ['Rank,Participant,Final Score,DreamSim,DINO,CLIP,LPIPS,Color,Quality,Submission Time'];
    const rows = leaderboard.entries.map((e) =>
      [
        e.rank,
        `"${e.participant_name}"`,
        e.final_score,
        e.dreamsim_score,
        e.dino_score,
        e.clip_score,
        e.lpips_score,
        e.color_score,
        e.quality_score,
        `"${e.submitted_at}"`
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `results_${leaderboard.competition_title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/organizer/competitions/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Control Panel</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Final Competition Results
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Official ranking standings with CSV export.
          </p>
        </div>

        {leaderboard && leaderboard.entries.length > 0 && (
          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
      ) : !leaderboard || leaderboard.entries.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
          No finalized results available yet.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 divide-y divide-zinc-800/60 text-xs">
            {leaderboard.entries.map((entry) => (
              <div key={entry.submission_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-400 w-6">#{entry.rank}</span>
                  <span className="font-semibold text-zinc-200">{entry.participant_name}</span>
                </div>
                <ScoreBadge score={entry.final_score} size="md" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
