'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/apiClient';
import { Competition, UserProfile } from '../../types';
import { Shield, Plus, Trophy, ArrowRight, Eye, Calendar, Layers } from 'lucide-react';

export default function OrganizerDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await apiClient.getMe();
        setUser(me);
        if (me) {
          const comps = await apiClient.listCompetitions({ organizer_id: me.id });
          setCompetitions(comps);
        }
      } catch (err) {
        console.error('Failed to load organizer competitions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Organizer Studio
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Host and manage deterministic AI image recreation competitions with automatic multi-model scoring.
          </p>
        </div>

        <Link
          href="/organizer/competitions/new"
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Competition</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Hosted Competitions</span>
          <div className="text-3xl font-extrabold text-white font-mono">{competitions.length}</div>
          <span className="text-[11px] text-zinc-500">Total created</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Active Competitions</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {competitions.filter((c) => c.status === 'active').length}
          </div>
          <span className="text-[11px] text-zinc-500">Open for submissions</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400">Scoring Engine</span>
          <div className="text-xl font-bold text-indigo-400 font-mono pt-1">v1.0.0 Ensemble</div>
          <span className="text-[11px] text-zinc-500">DreamSim + DINOv2 + CLIP + LPIPS</span>
        </div>
      </div>

      {/* Competitions list */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Your Competitions</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs space-y-3">
            <Trophy className="h-8 w-8 mx-auto text-zinc-600" />
            <p>You haven&apos;t created any competitions yet.</p>
            <Link
              href="/organizer/competitions/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold inline-block transition-colors"
            >
              Launch your first competition
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {competitions.map((comp) => (
              <div
                key={comp.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850/60 transition-colors gap-4"
              >
                <div className="flex items-center gap-4">
                  {comp.reference_image_url ? (
                    <img
                      src={comp.reference_image_url}
                      alt={comp.title}
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-800 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 shrink-0">
                      IMG
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-zinc-100">{comp.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {comp.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                      <span>Aspect: {comp.required_aspect_ratio}</span>
                      <span>•</span>
                      <span>Ends: {new Date(comp.ends_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    href={`/organizer/competitions/${comp.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/competitions/${comp.id}/leaderboard`}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-300 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Trophy className="h-3 w-3" />
                    <span>Leaderboard</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
