'use client';

import { useState } from 'react';
import { ConsentCheckbox } from '@/components/auth/consent-checkbox';
import { PasswordInput } from '@/components/auth/password-input';
import { SubmitButton } from '@/components/auth/submit-button';
import { completeOAuthRegistration } from '@/lib/auth/actions';

export function CompleteRegistrationForm({
  next,
  showEmailInput,
}: {
  next: string;
  showEmailInput: boolean;
}) {
  const [consent, setConsent] = useState(false);
  const [formValid, setFormValid] = useState(false);

  return (
    <form
      action={completeOAuthRegistration}
      onChange={(e) => setFormValid(e.currentTarget.checkValidity())}
    >
      <input type="hidden" name="next" value={next} />
      {showEmailInput && (
        <div className="auth-field">
          <label className="auth-label" htmlFor="cr-email">Email</label>
          <input
            type="email"
            name="email"
            id="cr-email"
            required
            placeholder="you@example.com"
            className="auth-input"
            autoComplete="email"
            aria-label="Email"
          />
          <p className="auth-helper">We will send a verification link to this address.</p>
        </div>
      )}

      <div className="auth-field">
        <label className="auth-label" htmlFor="cr-username">Username</label>
        <input
          type="text"
          name="username"
          id="cr-username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-z0-9_]+"
          placeholder="shadow269"
          className="auth-input"
          autoComplete="username"
          aria-label="Username"
        />
        <p className="auth-helper">Lowercase letters, numbers, and underscores only. 3-20 characters.</p>
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="cr-password">Password</label>
        <PasswordInput
          name="password"
          id="cr-password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          aria-label="Password"
        />
        <p className="auth-helper">Set a password for email+password login.</p>
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="cr-confirm-password">Confirm Password</label>
        <PasswordInput
          name="confirmPassword"
          id="cr-confirm-password"
          required
          minLength={8}
          placeholder="Repeat your password"
          autoComplete="new-password"
          aria-label="Confirm Password"
        />
      </div>

      <ConsentCheckbox value={consent} onChange={setConsent} />

      <SubmitButton disabled={!formValid}>
        <span className="auth-btn-text">Complete Registration</span>
        <span className="auth-btn-arrow">{'\u2192'}</span>
      </SubmitButton>
    </form>
  );
}
