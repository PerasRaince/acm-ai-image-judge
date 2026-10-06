'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../../../lib/apiClient';
import { ArrowLeft, Users, Shield } from 'lucide-react';

export default function OrganizerParticipantsPage() {
  const params = useParams();
  const id = params?.id as string;

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
          Competition Participants Roster
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Registered participants who have joined this competition.
        </p>
      </div>

      <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-center text-xs text-zinc-500 space-y-3">
        <Users className="h-8 w-8 mx-auto text-zinc-600" />
        <p>Active participants are linked and synchronized via Supabase PostgreSQL.</p>
        <Link
          href={`/competitions/${id}/leaderboard`}
          className="text-blue-400 hover:underline inline-block pt-1"
        >
          View current leaderboard standings →
        </Link>
      </div>
    </div>
  );
}
