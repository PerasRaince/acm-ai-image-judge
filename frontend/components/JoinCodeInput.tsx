'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { apiClient } from '../lib/apiClient';

interface JoinCodeInputProps {
  className?: string;
  size?: 'default' | 'large';
  onSuccess?: (competitionId: string) => void;
}

export default function JoinCodeInput({
  className = '',
  size = 'default',
  onSuccess
}: JoinCodeInputProps) {
  const router = useRouter();
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const normalizeCode = (raw: string): string => {
    let cleaned = raw.trim().toLowerCase();
    if (cleaned.includes('/join/')) {
      const parts = cleaned.split('/join/');
      cleaned = parts[parts.length - 1];
    } else if (cleaned.includes('/competitions/')) {
      const parts = cleaned.split('/competitions/');
      cleaned = parts[parts.length - 1];
    }
    cleaned = cleaned.split('?')[0].split('#')[0];
    return cleaned.replace(/^\/+|\/+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const code = normalizeCode(inputVal);
    if (!code) {
      setErrorMsg('Please enter a competition code or link.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user is currently authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login preserving destination
        router.push(`/login?returnUrl=${encodeURIComponent(`/join/${code}`)}`);
        return;
      }

      // 2. User is authenticated, join competition directly via code API
      const result = await apiClient.joinCompetitionByCode(code);
      if (onSuccess) {
        onSuccess(result.competition.id);
      } else {
        router.push(`/competitions/${result.competition.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Competition not found or unable to join.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const isLarge = size === 'large';

  return (
    <div className={`w-full max-w-md ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {/* Keyboard / Link icon */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Enter a code or link"
            className={`w-full bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono pl-11 pr-4 ${
              isLarge ? 'py-3.5 text-base' : 'py-2.5 text-sm'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={!inputVal.trim() || loading}
          className={`font-semibold rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-900/30 active:scale-95 ${
            isLarge ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-sm'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Joining...
            </span>
          ) : (
            'Join'
          )}
        </button>
      </form>

      {errorMsg && (
        <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 px-1 animate-fadeIn">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
