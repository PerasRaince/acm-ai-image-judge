'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  onExpire?: () => void;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    function calculateTime() {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
        Closed
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs font-mono text-[#101A35]">
      <div className="flex items-center gap-1">
        <span className="bg-[#E7ECFA] border border-[#DCE4F3] px-2 py-1 rounded-md text-[#376DDD] font-bold">{timeLeft.days}d</span>
        <span className="bg-[#E7ECFA] border border-[#DCE4F3] px-2 py-1 rounded-md text-[#376DDD] font-bold">{timeLeft.hours}h</span>
        <span className="bg-[#E7ECFA] border border-[#DCE4F3] px-2 py-1 rounded-md text-[#376DDD] font-bold">{timeLeft.minutes}m</span>
        <span className="bg-[#E7ECFA] border border-[#DCE4F3] px-2 py-1 rounded-md text-[#376DDD] font-bold">{timeLeft.seconds}s</span>
      </div>
      <span className="text-[11px] text-[#526079] font-sans">remaining</span>
    </div>
  );
}
