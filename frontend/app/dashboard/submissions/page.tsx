'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../../lib/apiClient';
import { Submission, UserProfile } from '../../../types';
import { ScoreBadge } from '../../../components/ScoreBadge';
import { MetricBar } from '../../../components/MetricBar';
import { ArrowLeft, Trophy, Calendar, Sparkles } from 'lucide-react';

export default function SubmissionsHistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await apiClient.getMe();
        if (me) {
          const subs = await apiClient.listSubmissions({ participant_id: me.id });
          setSubmissions(subs);
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[#526079] hover:text-[#101A35] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101A35] tracking-tight">
          My Submissions History
        </h1>
        <p className="text-xs text-[#526079] mt-1">
          Detailed metrics, execution durations, and explainable score breakdowns for all your attempts.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#DCE4F3]" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-[#DCE4F3] bg-[#FFFFFF] text-[#526079] text-xs shadow-xs">
          No recreation attempts submitted yet.
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE4F3] pb-4">
                <div className="flex items-center gap-4">
                  {sub.signed_image_url && (
                    <img
                      src={sub.signed_image_url}
                      alt="Recreation"
                      className="w-16 h-16 rounded-xl object-cover border border-[#DCE4F3]"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-base text-[#101A35]">
                      Recreation Attempt #{sub.attempt_number}
                    </h3>
                    <div className="text-[11px] text-[#526079] flex items-center gap-3 pt-0.5">
                      <span>Submitted: {new Date(sub.submitted_at).toLocaleString()}</span>
                      <span>•</span>
                      <span className="capitalize text-[#101A35]">Status: {sub.scoring_status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {sub.score && <ScoreBadge score={sub.score.final_score} size="lg" />}
                  <Link
                    href={`/competitions/${sub.competition_id}/leaderboard`}
                    className="px-3.5 py-2 rounded-xl bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] text-[#376DDD] text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trophy className="h-3.5 w-3.5 text-[#376DDD]" />
                    <span>Leaderboard</span>
                  </Link>
                </div>
              </div>

              {/* Component breakdown */}
              {sub.score && (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-[#101A35] uppercase tracking-wider">
                    Score Components
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <MetricBar
                      label="DreamSim Perceptual"
                      score={sub.score.dreamsim_score}
                      weight={0.35}
                      description="Human perceptual similarity"
                    />
                    <MetricBar
                      label="DINOv2 Structure"
                      score={sub.score.dino_score}
                      weight={0.30}
                      description="Visual structure correspondence"
                    />
                    <MetricBar
                      label="OpenCLIP Semantic"
                      score={sub.score.clip_score}
                      weight={0.15}
                      description="Semantic concept matching"
                    />
                    <MetricBar
                      label="LPIPS Detail"
                      score={sub.score.lpips_score}
                      weight={0.10}
                      description="Patch-level texture fidelity"
                    />
                    <MetricBar
                      label="Color Distribution"
                      score={sub.score.color_score}
                      weight={0.05}
                      description="CIE Lab & HSV histogram"
                    />
                    <MetricBar
                      label="Technical Quality"
                      score={sub.score.quality_score}
                      weight={0.05}
                      description="Sharpness and dynamic range"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
