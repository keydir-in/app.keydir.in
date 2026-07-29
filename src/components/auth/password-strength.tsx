'use client';

/**
 * Password strength indicator bar that evaluates a sibling password input
 * against five requirements (length, case, digit, special char) and
 * displays a segmented strength meter with a checklist.
 * Exports: PasswordStrength
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface PasswordStrengthProps {
  inputName: string;
}

interface Requirement {
  label: string;
  test: (v: string) => boolean;
}

const requirements: Requirement[] = [
  { label: '8+ characters', test: (v) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'Number', test: (v) => /[0-9]/.test(v) },
  { label: 'Special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function getStrengthClass(score: number) {
  if (score <= 1) return 'auth-strength--weak';
  if (score <= 2) return 'auth-strength--fair';
  if (score <= 3) return 'auth-strength--medium';
  if (score <= 4) return 'auth-strength--strong';
  return 'auth-strength--very-strong';
}

function getStrengthLabel(score: number) {
  if (score <= 1) return 'Weak';
  if (score <= 2) return 'Fair';
  if (score <= 3) return 'Medium';
  if (score <= 4) return 'Strong';
  return 'Very Strong';
}

export function PasswordStrength({ inputName }: PasswordStrengthProps) {
  const [value, setValue] = useState('');
  const valueRef = useRef('');

  const handleInput = useCallback((e: Event) => {
    const v = (e.target as HTMLInputElement).value;
    valueRef.current = v;
    setValue(v);
  }, []);

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(
      `input[name="${inputName}"]`
    );
    if (!input) return;
    valueRef.current = input.value;
    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, [inputName, handleInput]);

  const score = requirements.filter((r) => r.test(value)).length;
  const cls = getStrengthClass(score);
  const label = getStrengthLabel(score);

  return (
    <div className="auth-strength-wrap">
      <div className="auth-strength">
        <div className="auth-strength-track">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`auth-strength-seg ${i < score ? cls : ''}`}
            />
          ))}
        </div>
        {value.length > 0 && (
          <span className={`auth-strength-label ${cls}`}>{label}</span>
        )}
      </div>
      <ul className="auth-requirements">
        {requirements.map((r) => (
          <li key={r.label} className={r.test(value) ? 'auth-req--met' : ''}>
            <span className="auth-req-icon">{r.test(value) ? '\u2713' : '\u25CB'}</span>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
