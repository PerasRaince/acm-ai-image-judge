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
        <div className="flex items-center justify-between text-xs text-[#101A35] font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#376DDD]" />
            {referenceLabel}
          </span>
          <span className="text-[11px] text-[#526079] font-normal">Benchmark Target</span>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#DCE4F3] bg-[#E7ECFA]/30 flex items-center justify-center group shadow-xs">
          {referenceUrl ? (
            <img
              src={referenceUrl}
              alt="Competition Reference Target"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-[#526079] text-xs">No reference image</div>
          )}
        </div>
      </div>

      {/* Candidate Recreation Box */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs text-[#101A35] font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#31B8D0]" />
            {candidateLabel}
          </span>
          <span className="text-[11px] text-[#526079] font-normal">Participant Submission</span>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#DCE4F3] bg-[#E7ECFA]/30 flex items-center justify-center group shadow-xs">
          {candidateUrl ? (
            <img
              src={candidateUrl}
              alt="Participant AI Recreation"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-[#526079]">
              <span className="text-xs">No recreation image submitted yet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
