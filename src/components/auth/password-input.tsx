'use client';

/**
 * Password input with show/hide toggle button. Renders an SVG eye icon
 * to switch between masked and visible password states.
 * Exports: PasswordInput
 */

import { useState } from 'react';

interface PasswordInputProps {
  name: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  'aria-label'?: string;
  onChange?: (value: string) => void;
}

export function PasswordInput({
  name,
  id,
  placeholder = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
  required,
  minLength,
  autoComplete,
  'aria-label': ariaLabel,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-input-wrap">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        id={id}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        className="auth-input auth-input--toggle"
        onChange={(e) => onChange?.(e.target.value)}
      />
      <button
        type="button"
        className="auth-input-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
