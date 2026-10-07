import React from 'react';
import { formatScore, cn } from '../lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  className
}: ScoreBadgeProps) {
  // Determine color scheme based on score tier
  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score < 60) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (score < 75) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (score < 88) {
    colorClasses = 'bg-[#E7ECFA] text-[#376DDD] border-[#DCE4F3]';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-lg px-3.5 py-1.5 font-bold',
    xl: 'text-3xl px-5 py-3 font-extrabold tracking-tight'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono',
        colorClasses,
        sizeClasses[size],
        className
      )}
    >
      <span>{formatScore(score)}</span>
      {showLabel && <span className="text-[0.7em] opacity-75 font-sans font-normal">/ 100</span>}
    </div>
  );
}
