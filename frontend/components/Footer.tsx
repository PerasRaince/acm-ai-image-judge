import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Cpu, Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-10 text-zinc-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <span>AI Image Judge</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 font-normal">Deterministic AI Image Recreation Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <span>DreamSim • DINOv2 • CLIP • LPIPS</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Anti-Cheat Verified</span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-600">
          <p>© {new Date().getFullYear()} AI Image Judge Platform. All scores computed with immutable model versions.</p>
          <div className="flex items-center gap-4">
            <Link href="/competitions" className="hover:text-zinc-400 transition-colors">
              Competitions
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-400 transition-colors">
              Participant Hub
            </Link>
            <Link href="/organizer" className="hover:text-zinc-400 transition-colors">
              Organizer Studio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
