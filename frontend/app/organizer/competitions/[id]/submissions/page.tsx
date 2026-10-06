'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../../../lib/apiClient';
import { Submission } from '../../../../../types';
import { ScoreBadge } from '../../../../../components/ScoreBadge';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrganizerSubmissionsReviewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const subs = await apiClient.listSubmissions({ competition_id: id });
        setSubmissions(subs);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Review Submissions
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review all contestant recreations and inspect AI evaluation statuses and component metrics.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
          No participant recreations submitted yet for this competition.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-4">
                {sub.signed_image_url ? (
                  <img
                    src={sub.signed_image_url}
                    alt="Submission attempt"
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                    IMG
                  </div>
                )}
                <div>
                  <div className="font-semibold text-zinc-200">
                    Attempt #{sub.attempt_number}
                  </div>
                  <div className="text-[11px] text-zinc-500 pt-0.5">
                    Submitted: {new Date(sub.submitted_at).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-1">
                    SHA256: {sub.id.slice(0, 16)}...
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                {sub.score ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-zinc-500">DreamSim: {sub.score.dreamsim_score} | DINO: {sub.score.dino_score}</div>
                      <div className="text-[10px] text-zinc-500">CLIP: {sub.score.clip_score} | LPIPS: {sub.score.lpips_score}</div>
                    </div>
                    <ScoreBadge score={sub.score.final_score} size="md" />
                  </div>
                ) : (
                  <span className="capitalize px-2.5 py-1 rounded bg-zinc-800 text-zinc-400">
                    {sub.scoring_status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
