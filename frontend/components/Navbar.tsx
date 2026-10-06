'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { apiClient } from '../lib/apiClient';
import { UserProfile } from '../types';
import { Trophy, Image as ImageIcon, LayoutDashboard, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';

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

    // Listen to Supabase auth state change
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

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Trophy className="h-4 w-4" />
            </div>
            <span>AI Image Judge</span>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/competitions"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/competitions')
                  ? 'text-white bg-zinc-800/80'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Competitions
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/dashboard' || pathname.startsWith('/dashboard/submissions')
                    ? 'text-white bg-zinc-800/80'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Dashboard
              </Link>
            )}

            {isOrganizer && (
              <Link
                href="/organizer"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/organizer')
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-900'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Organizer Studio
              </Link>
            )}
          </nav>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-zinc-800" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
                  {user.display_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-zinc-200">{user.display_name}</span>
                  <span className="text-[10px] text-zinc-400 capitalize">{user.role}</span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-md hover:bg-zinc-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-sm transition-colors"
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
