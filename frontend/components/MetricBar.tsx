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
  let barColor = 'bg-emerald-600';
  if (score < 60) {
    barColor = 'bg-rose-500';
  } else if (score < 75) {
    barColor = 'bg-amber-500';
  } else if (score < 88) {
    barColor = 'bg-[#376DDD]';
  }

  return (
    <div className="space-y-1.5 p-3 rounded-xl bg-[#FFFFFF] border border-[#DCE4F3] shadow-xs">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#101A35]">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3]">
            {Math.round(weight * 100)}% weight
          </span>
        </div>
        <div className="font-mono font-semibold text-[#101A35]">
          {formatScore(score)} <span className="text-[10px] text-[#526079] font-sans">/ 100</span>
        </div>
      </div>

      {/* Progress track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7ECFA]">
        <div
          className={cn('h-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[11px] text-[#526079] leading-tight">{description}</p>
    </div>
  );
}
