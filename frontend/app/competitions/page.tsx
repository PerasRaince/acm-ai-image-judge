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
          <h1 className="text-3xl font-bold text-white tracking-tight">Competitions Directory</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse active recreation challenges, examine reference imagery, and climb the transparent leaderboard.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0B1D35] border border-[#002B49] rounded-xl text-xs self-start md:self-auto">
          {['all', 'active', 'scheduled', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-medium ${
                filter === f
                  ? 'bg-[#0085CA] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#002B49]/60'
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
            <div key={i} className="h-80 rounded-2xl bg-[#0B1D35]/50 border border-[#002B49] animate-pulse" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#002B49] rounded-2xl p-8 space-y-3 bg-[#0B1D35]/30">
          <Trophy className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No competitions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no competitions matching this filter. Check back soon or host your own!
          </p>
          <div className="pt-2">
            <Link
              href="/competitions/create"
              className="px-4 py-2 bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white rounded-xl text-xs font-semibold inline-block transition-colors shadow-md shadow-[#0085CA]/20"
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
                className="flex flex-col overflow-hidden rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 hover:border-[#0085CA]/50 transition-all group shadow-sm"
              >
                {/* Reference Image Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-[#040C16] flex items-center justify-center">
                  {comp.reference_image_url ? (
                    <img
                      src={comp.reference_image_url}
                      alt={comp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-600" />
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md'
                          : isCompleted
                          ? 'bg-[#002B49] text-slate-300 border border-[#0085CA]/25'
                          : 'bg-[#0085CA]/20 text-[#00A3E0] border border-[#0085CA]/30'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>

                  {/* Aspect Ratio Pill */}
                  <div className="absolute bottom-3 left-3 bg-[#040C16]/90 backdrop-blur-sm text-slate-300 text-[10px] px-2 py-0.5 rounded border border-[#002B49] font-mono">
                    Aspect: {comp.required_aspect_ratio}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-white group-hover:text-[#00A3E0] transition-colors line-clamp-1">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {comp.description || 'Recreate this reference image faithfully using your favorite AI image generator.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#002B49] text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Time Window:</span>
                      {isActive ? (
                        <CountdownTimer targetDate={comp.ends_at} />
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {isCompleted ? 'Ended' : `Starts ${new Date(comp.starts_at).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Max Attempts:</span>
                      <span className="font-mono text-slate-200">{comp.submission_limit} per participant</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href={`/competitions/${comp.id}`}
                      className="text-center py-2 px-3 rounded-xl bg-[#0085CA]/15 hover:bg-[#0085CA]/25 border border-[#0085CA]/35 text-[#00A3E0] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View & Submit</span>
                    </Link>
                    <Link
                      href={`/competitions/${comp.id}/leaderboard`}
                      className="text-center py-2 px-3 rounded-xl bg-[#002B49]/80 hover:bg-[#002B49] border border-[#0085CA]/30 text-sky-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
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
