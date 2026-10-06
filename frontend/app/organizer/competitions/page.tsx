'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../../lib/apiClient';
import { Competition } from '../../../types';
import { Shield, Plus, ArrowLeft, Trophy } from 'lucide-react';

export default function OrganizerCompetitionsListPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await apiClient.getMe();
        if (me) {
          const comps = await apiClient.listCompetitions({ organizer_id: me.id });
          setCompetitions(comps);
        }
      } catch (err) {
        console.error('Failed to load competitions:', err);
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
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Organizer Studio</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Managed Competitions
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            All recreation contests created under your organizer profile.
          </p>
        </div>

        <Link
          href="/organizer/competitions/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Competition</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
          No competitions created yet.
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map((comp) => (
            <div
              key={comp.id}
              className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-100">{comp.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {comp.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Ends {new Date(comp.ends_at).toLocaleDateString()} • {comp.submission_limit} attempts max
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/organizer/competitions/${comp.id}`}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
