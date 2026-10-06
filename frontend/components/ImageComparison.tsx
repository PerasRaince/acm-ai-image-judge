import React from 'react';

interface ImageComparisonProps {
  referenceUrl: string;
  candidateUrl?: string;
  referenceLabel?: string;
  candidateLabel?: string;
}

export function ImageComparison({
  referenceUrl,
  candidateUrl,
  referenceLabel = 'Official Reference',
  candidateLabel = 'AI Recreation Attempt'
}: ImageComparisonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Reference Image Box */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {referenceLabel}
          </span>
          <span className="text-[11px] text-zinc-500">Benchmark Target</span>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center group">
          {referenceUrl ? (
            <img
              src={referenceUrl}
              alt="Competition Reference Target"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-zinc-600 text-xs">No reference image</div>
          )}
        </div>
      </div>

      {/* Candidate Recreation Box */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            {candidateLabel}
          </span>
          <span className="text-[11px] text-zinc-500">Participant Submission</span>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center group">
          {candidateUrl ? (
            <img
              src={candidateUrl}
              alt="Participant AI Recreation"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
              <span className="text-xs">No recreation image submitted yet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
