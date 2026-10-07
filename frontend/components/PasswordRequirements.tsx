'use client';

import React from 'react';

export interface PasswordChecks {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePassword(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };
}

export function isPasswordValid(password: string): boolean {
  const checks = evaluatePassword(password);
  return (
    checks.minLength &&
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasNumber &&
    checks.hasSpecial
  );
}

interface PasswordRequirementsProps {
  password: string;
  showAlways?: boolean;
}

export default function PasswordRequirements({ password, showAlways = false }: PasswordRequirementsProps) {
  if (!showAlways && !password) {
    return null;
  }

  const checks = evaluatePassword(password);

  const criteria = [
    { label: 'At least 8 characters', met: checks.minLength },
    { label: 'At least one uppercase letter (A-Z)', met: checks.hasUpper },
    { label: 'At least one lowercase letter (a-z)', met: checks.hasLower },
    { label: 'At least one number (0-9)', met: checks.hasNumber },
    { label: 'At least one special character (!@#$%...)', met: checks.hasSpecial }
  ];

  return (
    <div className="bg-[#FCFDFF] border border-[#DCE4F3] rounded-xl p-3 text-xs space-y-1.5 transition-all">
      <div className="text-[#101A35] font-semibold mb-1">Password Requirements:</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {criteria.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-1.5">
            {item.met ? (
              <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-[#526079]/60 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="7" />
              </svg>
            )}
            <span className={item.met ? 'text-emerald-700 font-medium' : 'text-[#526079]'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
