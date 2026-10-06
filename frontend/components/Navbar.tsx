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
    <header className="sticky top-0 z-50 w-full border-b border-[#002B49] bg-[#071527]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 text-white tracking-tight group">
            <div className="relative h-9 w-9 rounded-xl bg-[#002B49]/60 border border-[#0085CA]/40 flex items-center justify-center p-1.5 shadow-md group-hover:border-[#0085CA] transition-colors">
              <img
                src="/acm-logo-blue.png"
                alt="ACM Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-sm tracking-tight leading-none">ACM Chapter</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0085CA]/15 text-[#00A3E0] border border-[#0085CA]/30">
                  AI Judge
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Association for Computing Machinery</span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/competitions"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/competitions'
                  ? 'text-white bg-[#002B49] border border-[#0085CA]/35'
                  : 'text-slate-300 hover:text-white hover:bg-[#002B49]/40'
              }`}
            >
              Competitions
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pathname.startsWith('/dashboard')
                    ? 'text-white bg-[#002B49] border border-[#0085CA]/35'
                    : 'text-slate-300 hover:text-white hover:bg-[#002B49]/40'
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
                    ? 'text-rose-400 bg-rose-950/40 border border-rose-800/50'
                    : 'text-slate-300 hover:text-rose-400 hover:bg-[#002B49]/40'
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
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white font-semibold text-xs transition-all shadow-md shadow-[#0085CA]/20 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Host Challenge</span>
          </Link>

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-[#002B49]/50" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#002B49]/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#0085CA]/20 border border-[#0085CA]/40 flex items-center justify-center text-xs font-semibold text-sky-300">
                  {user.display_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-200">{user.display_name}</span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-[#002B49]/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-[#002B49]/40 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white rounded-xl shadow-md shadow-[#0085CA]/20 transition-all active:scale-95"
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
