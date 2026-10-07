'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { apiClient } from '../lib/apiClient';
import { UserProfile } from '../types';
import { Trophy, LogOut, PlusCircle, Shield } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await apiClient.getMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const u = await apiClient.getMe();
        setUser(u);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DCE4F3] bg-[#FCFDFF]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 text-[#101A35] tracking-tight group">
            <div className="relative h-10 w-10 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#376DDD] transition-colors shrink-0">
              <img
                src="/acm-logo-blue.png"
                alt="ACM GEC Thrissur"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#101A35] text-sm tracking-tight leading-none">ACM GEC Thrissur</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3]">
                  Orientation
                </span>
              </div>
              <span className="text-[10px] text-[#526079] font-medium">AI Image Recreation Competition</span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/competitions"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/competitions'
                  ? 'text-[#376DDD] bg-[#E7ECFA] border border-[#DCE4F3]'
                  : 'text-[#526079] hover:text-[#101A35] hover:bg-[#E7ECFA]'
              }`}
            >
              Competitions
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pathname.startsWith('/dashboard')
                    ? 'text-[#376DDD] bg-[#E7ECFA] border border-[#DCE4F3]'
                    : 'text-[#526079] hover:text-[#101A35] hover:bg-[#E7ECFA]'
                }`}
              >
                Dashboard
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/admin')
                    ? 'text-rose-600 bg-rose-50 border border-rose-200'
                    : 'text-[#526079] hover:text-rose-600 hover:bg-[#E7ECFA]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-3">
          {/* Host New Competition action button */}
          <Link
            href="/competitions/create"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold text-xs transition-all shadow-sm shadow-[#376DDD]/20 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Host Challenge</span>
          </Link>

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-[#E7ECFA]" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#E7ECFA] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#E7ECFA] border border-[#376DDD]/30 flex items-center justify-center text-xs font-semibold text-[#376DDD]">
                  {user.display_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-[#101A35]">{user.display_name}</span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 text-[#526079] hover:text-rose-600 rounded-xl hover:bg-[#E7ECFA] transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-[#526079] hover:text-[#101A35] rounded-lg hover:bg-[#E7ECFA] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white rounded-xl shadow-sm shadow-[#376DDD]/20 transition-all active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
