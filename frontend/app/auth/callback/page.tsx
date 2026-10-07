'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const next = searchParams.get('next') || '/dashboard';
        router.replace(next);
        router.refresh();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Authentication callback failed.');
      }
    }

    handleAuthCallback();
  }, [router, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="p-3 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#101A35]">Sign-in Error</h2>
        <p className="text-sm text-[#526079] max-w-sm">{errorMsg}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 px-4 py-2 rounded-xl bg-[#E7ECFA] hover:bg-[#DCE4F3] border border-[#DCE4F3] text-[#376DDD] text-xs font-semibold transition-colors"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-2 border-[#376DDD] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[#526079] font-medium">Completing authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#376DDD] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
