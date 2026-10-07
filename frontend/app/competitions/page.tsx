'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/apiClient';
import { Competition } from '../../types';
import { Trophy, Clock, Image as ImageIcon, ArrowRight, Filter, Upload } from 'lucide-react';
import { CountdownTimer } from '../../components/CountdownTimer';

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiClient.listCompetitions(filter === 'all' ? undefined : { status: filter });
        setCompetitions(data);
      } catch (err) {
        console.error('Failed to load competitions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101A35] tracking-tight">Competitions Directory</h1>
          <p className="text-xs text-[#526079] mt-1">
            Browse active recreation challenges, examine reference imagery, and climb the transparent leaderboard.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#E7ECFA] border border-[#DCE4F3] rounded-xl text-xs self-start md:self-auto">
          {['all', 'active', 'scheduled', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-medium ${
                filter === f
                  ? 'bg-[#376DDD] text-white shadow-xs'
                  : 'text-[#526079] hover:text-[#101A35] hover:bg-[#FFFFFF]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-[#FFFFFF] border border-[#DCE4F3] animate-pulse" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#DCE4F3] rounded-2xl p-8 space-y-3 bg-[#FFFFFF]">
          <Trophy className="h-10 w-10 text-[#526079] mx-auto" />
          <h3 className="text-base font-semibold text-[#101A35]">No competitions found</h3>
          <p className="text-xs text-[#526079] max-w-sm mx-auto">
            There are currently no competitions matching this filter. Check back soon or host your own!
          </p>
          <div className="pt-2">
            <Link
              href="/competitions/create"
              className="px-4 py-2 bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white rounded-xl text-xs font-semibold inline-block transition-colors shadow-xs"
            >
              Host a Competition
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((comp) => {
            const isActive = comp.status === 'active';
            const isCompleted = comp.status === 'completed';

            return (
              <div
                key={comp.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] hover:border-[#376DDD]/50 transition-all group shadow-xs"
              >
                {/* Reference Image Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-[#E7ECFA]/50 flex items-center justify-center">
                  {comp.reference_image_url ? (
                    <img
                      src={comp.reference_image_url}
                      alt={comp.title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        comp.is_host ? '' : 'blur-2xl scale-110 select-none pointer-events-none filter'
                      }`}
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-[#526079]/50" />
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 backdrop-blur-md'
                          : isCompleted
                          ? 'bg-[#E7ECFA] text-[#526079] border border-[#DCE4F3]'
                          : 'bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3]'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>

                  {/* Aspect Ratio Pill */}
                  <div className="absolute bottom-3 left-3 bg-[#FFFFFF]/90 backdrop-blur-sm text-[#526079] text-[10px] px-2 py-0.5 rounded border border-[#DCE4F3] font-mono">
                    Aspect: {comp.required_aspect_ratio}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-[#101A35] group-hover:text-[#376DDD] transition-colors line-clamp-1">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-[#526079] line-clamp-2 leading-relaxed">
                      {comp.description || 'Recreate this reference image faithfully using your favorite AI image generator.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#DCE4F3] text-xs text-[#526079]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#526079]">Time Window:</span>
                      {isActive ? (
                        <CountdownTimer targetDate={comp.ends_at} />
                      ) : (
                        <span className="text-[11px] text-[#526079]">
                          {isCompleted ? 'Ended' : `Starts ${new Date(comp.starts_at).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Max Attempts:</span>
                      <span className="font-mono text-[#101A35] font-semibold">{comp.submission_limit} per participant</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href={`/competitions/${comp.id}`}
                      className="text-center py-2 px-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>View & Submit</span>
                    </Link>
                    <Link
                      href={`/competitions/${comp.id}/leaderboard`}
                      className="text-center py-2 px-3 rounded-xl bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] text-[#376DDD] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Trophy className="h-3 w-3" />
                      <span>Leaderboard</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
