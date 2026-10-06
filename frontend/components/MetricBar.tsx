import React from 'react';
import { formatScore, cn } from '../lib/utils';

interface MetricBarProps {
  label: string;
  score: number;
  weight: number;
  description: string;
  iconName?: string;
}

export function MetricBar({
  label,
  score,
  weight,
  description
}: MetricBarProps) {
  const percentage = Math.min(100, Math.max(0, score));

  // Dynamic bar colors based on score
  let barColor = 'bg-emerald-500';
  if (score < 60) {
    barColor = 'bg-rose-500';
  } else if (score < 75) {
    barColor = 'bg-amber-500';
  } else if (score < 88) {
    barColor = 'bg-blue-500';
  }

  return (
    <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-200">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {Math.round(weight * 100)}% weight
          </span>
        </div>
        <div className="font-mono font-semibold text-zinc-100">
          {formatScore(score)} <span className="text-[10px] text-zinc-500 font-sans">/ 100</span>
        </div>
      </div>

      {/* Progress track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn('h-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[11px] text-zinc-400 leading-tight">{description}</p>
    </div>
  );
}
