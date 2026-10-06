import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-5 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        {/* Main Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <img
              src="/acm-logo-blue.png"
              alt="ACM Logo"
              className="h-5 w-5 object-contain"
            />
            <span className="font-semibold text-slate-300">ACM Student Chapter</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              AI Judge
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-500 text-[11px]">
              © {new Date().getFullYear()} Institutional Chapter
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/competitions" className="hover:text-slate-200 transition-colors">
              Competitions
            </Link>
            <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
            <Link href="/competitions/create" className="hover:text-slate-200 transition-colors">
              Host Challenge
            </Link>
            <a
              href="https://www.acm.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition-colors"
            >
              acm.org
            </a>
          </div>
        </div>

        {/* Compact Legal & Trademark Notice */}
        <div className="pt-2 border-t border-slate-900/90 text-[10px] text-slate-500 leading-relaxed text-center sm:text-left">
          ACM and the ACM logo are registered trademarks of the{' '}
          <a
            href="https://www.acm.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-sky-400 underline underline-offset-2"
          >
            Association for Computing Machinery, Inc.
          </a>
          {' '}• Independently operated by the Institutional ACM Student Chapter for non-commercial educational benchmarking under the{' '}
          <a
            href="https://www.acm.org/code-of-ethics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-sky-400 underline underline-offset-2"
          >
            ACM Code of Ethics
          </a>
          . Not hosted or certified by ACM Headquarters.
        </div>
      </div>
    </footer>
  );
}
