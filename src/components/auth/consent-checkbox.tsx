'use client';

import Link from 'next/link';

const TERMS_URL = 'https://keydir.in/app/terms';
const PRIVACY_URL = 'https://keydir.in/app/privacy';

type Props = {
  value: boolean;
  onChange: (val: boolean) => void;
  error?: string;
};

export function ConsentCheckbox({ value, onChange, error }: Props) {
  return (
    <div className="auth-field">
      <div className="auth-checkbox auth-consent-check">
        <input
          type="checkbox"
          name="consent"
          value="true"
          id="consent"
          required
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          aria-label="Agree to the Terms of Service, Privacy Policy, and KeyDir Guidelines"
        />
        <label htmlFor="consent">
          I agree to the <Link href={TERMS_URL} target="_blank" rel="noopener noreferrer">Terms of Service</Link>,{' '}
          <Link href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">Privacy Policy</Link>, and KeyDir Guidelines
        </label>
      </div>
      {error && <div className="auth-msg error" role="alert">{error}</div>}
    </div>
  );
}
