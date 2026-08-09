'use client';

import { useState } from 'react';
import { ConsentCheckbox } from '@/components/auth/consent-checkbox';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { SubmitButton } from '@/components/auth/submit-button';
import { register } from '@/lib/auth/actions';

export function RegisterForm() {
  const [consent, setConsent] = useState(false);
  const [formValid, setFormValid] = useState(false);

  return (
    <form
      action={register}
      onChange={(e) => setFormValid(e.currentTarget.checkValidity())}
    >
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-username">Username</label>
        <input
          type="text"
          name="username"
          id="reg-username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-z0-9_]+"
          placeholder="shadow269"
          className="auth-input"
          autoComplete="username"
          aria-label="Username"
        />
        <p className="auth-helper">Your username is permanent and will be part of your public KeyDir profile.</p>
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-email">Email</label>
        <input
          type="email"
          name="email"
          id="reg-email"
          required
          placeholder="you@email.com"
          className="auth-input"
          autoComplete="email"
          aria-label="Email address"
        />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-password">Password</label>
        <PasswordInput
          name="password"
          id="reg-password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label="Password"
        />
        <PasswordStrength inputName="password" />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
        <PasswordInput
          name="confirmPassword"
          id="reg-confirm"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label="Confirm password"
        />
      </div>

      <ConsentCheckbox value={consent} onChange={setConsent} />

      <SubmitButton disabled={!formValid}>
        <span className="auth-btn-text">Create Account</span>
        <span className="auth-btn-arrow">{'\u2192'}</span>
      </SubmitButton>
    </form>
  );
}
