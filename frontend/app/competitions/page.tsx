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
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs self-start md:self-auto">
          {['all', 'active', 'scheduled', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-medium ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
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
            <div key={i} className="h-80 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl p-8 space-y-3">
          <Trophy className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-300">No competitions found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            There are currently no competitions matching this filter. Check back soon or host your own!
          </p>
          <div className="pt-2">
            <Link
              href="/competitions/create"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-block transition-colors"
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
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all group"
              >
                {/* Reference Image Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
                  {comp.reference_image_url ? (
                    <img
                      src={comp.reference_image_url}
                      alt={comp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-zinc-700" />
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md'
                          : isCompleted
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>

                  {/* Aspect Ratio Pill */}
                  <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-sm text-zinc-300 text-[10px] px-2 py-0.5 rounded border border-zinc-800 font-mono">
                    Aspect: {comp.required_aspect_ratio}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {comp.description || 'Recreate this reference image faithfully using your favorite AI image generator.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Time Window:</span>
                      {isActive ? (
                        <CountdownTimer targetDate={comp.ends_at} />
                      ) : (
                        <span className="text-[11px] text-zinc-500">
                          {isCompleted ? 'Ended' : `Starts ${new Date(comp.starts_at).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Max Attempts:</span>
                      <span className="font-mono text-zinc-200">{comp.submission_limit} per participant</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href={`/competitions/${comp.id}`}
                      className="text-center py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View & Submit</span>
                    </Link>
                    <Link
                      href={`/competitions/${comp.id}/leaderboard`}
                      className="text-center py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
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
