import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#DCE4F3] bg-[#E7ECFA]/50 py-6 text-[#526079] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        {/* Main Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-[#FFFFFF] border border-[#DCE4F3] flex items-center justify-center p-1 shrink-0 shadow-xs">
              <img
                src="/acm-logo-blue.png"
                alt="ACM GEC Thrissur"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold text-[#101A35]">ACM Student Chapter</span>
              <span className="text-[#526079] text-[11px]">Government Engineering College Thrissur</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FFFFFF] text-[#376DDD] border border-[#DCE4F3] hidden sm:inline-block">
              Orientation 2026
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#526079]">
            <Link href="/competitions" className="hover:text-[#376DDD] transition-colors">
              Competitions
            </Link>
            <Link href="/dashboard" className="hover:text-[#376DDD] transition-colors">
              Dashboard
            </Link>
            <Link href="/competitions/create" className="hover:text-[#376DDD] transition-colors">
              Host Challenge
            </Link>
            <Link href="/login" className="hover:text-[#376DDD] transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        {/* Chapter Attribution */}
        <div className="pt-2 border-t border-[#DCE4F3] text-[10px] text-[#526079] leading-relaxed text-center sm:text-left">
          Organized by the ACM Student Chapter, Government Engineering College Thrissur (GEC Thrissur). AI image recreation fidelity evaluated via an automated 6-metric PyTorch vision ensemble.
        </div>
      </div>
    </footer>
  );
}
