'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  linkProviderAction,
  unlinkProvider,
  enableEmailLogin,
  changePassword,
  disablePasswordLogin,
} from '@/lib/auth/actions';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';

interface AccountMethod {
  id: string;
  name: string;
  connected: boolean;
  email?: string;
  lastUsedAt?: string;
}

interface ConnectedAccountsProps {
  methods: AccountMethod[];
  oauthEmails?: { email: string; provider: string }[];
  error?: string;
  message?: string;
}

const PROVIDER_ICONS: Record<string, string> = {
  password: '🔑',
  google: '/logos/google-logo.png',
  discord: '/logos/discord-logo.png',
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  discord: 'Connecting Discord unlocks voting.',
};

function formatLastUsed(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function ConnectedAccounts({ methods, oauthEmails, error, message }: ConnectedAccountsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const connectedCount = methods.filter((m) => m.connected).length;

  function handleUnlink(provider: string) {
    if (!confirm(`Unlink ${provider}? You will no longer be able to sign in with this method.`)) return;
    startTransition(async () => {
      await unlinkProvider(provider);
      router.refresh();
    });
  }

  function handleLink(provider: string) {
    startTransition(async () => {
      await linkProviderAction(provider);
      router.refresh();
    });
  }

  function handleEnablePassword(formData: FormData) {
    startTransition(async () => {
      await enableEmailLogin(formData);
      router.refresh();
    });
  }

  function handleChangePassword(formData: FormData) {
    startTransition(async () => {
      await changePassword(formData);
      router.refresh();
    });
  }

  function handleDisablePassword() {
    if (connectedCount <= 1) {
      alert('Cannot disable your last authentication method. Connect another method first.');
      return;
    }
    if (!confirm('Disable Password Login? You will no longer be able to sign in with email and password.')) return;
    startTransition(async () => {
      await disablePasswordLogin();
      router.refresh();
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="stg-providers">
      {error && <div className="auth-msg error">{error}</div>}
      {message && <div className="auth-msg success">{message}</div>}

      {methods.map((method) => {
        if (method.id === 'password') {
          return (
            <PasswordRow
              key={method.id}
              method={method}
              oauthEmails={oauthEmails}
              expanded={expanded === 'password'}
              onToggle={() => toggleExpand('password')}
              onEnablePassword={handleEnablePassword}
              onChangePassword={handleChangePassword}
              onDisablePassword={handleDisablePassword}
              canDisable={connectedCount > 1}
              isPending={isPending}
            />
          );
        }

        return (
          <OAuthRow
            key={method.id}
            method={method}
            connectedCount={connectedCount}
            isPending={isPending}
            onLink={handleLink}
            onUnlink={handleUnlink}
          />
        );
      })}
    </div>
  );
}

function PasswordRow({
  method,
  oauthEmails,
  expanded,
  onToggle,
  onEnablePassword,
  onChangePassword,
  onDisablePassword,
  canDisable,
  isPending,
}: {
  method: AccountMethod;
  oauthEmails?: { email: string; provider: string }[];
  expanded: boolean;
  onToggle: () => void;
  onEnablePassword: (formData: FormData) => void;
  onChangePassword: (formData: FormData) => void;
  onDisablePassword: () => void;
  canDisable: boolean;
  isPending: boolean;
}) {
  const lastUsed = formatLastUsed(method.lastUsedAt);
  const emails = oauthEmails ?? [];
  const readOnlyEmail = emails.length === 1 ? emails[0].email : null;

  return (
    <div className={`stg-provider ${expanded ? 'stg-provider--expanded' : ''}`}>
      <div className="stg-provider-row">
        <div className="stg-provider-left">
          <div className="stg-provider-icon"><span>{PROVIDER_ICONS.password}</span></div>
          <div className="stg-provider-info">
            <div className="stg-provider-name">PASSWORD LOGIN</div>
            {lastUsed && <div className="stg-provider-meta">Last used: {lastUsed}</div>}
          </div>
        </div>
        <div className="stg-provider-right">
          <span className={`stg-provider-status ${method.connected ? 'stg-provider-status--on' : 'stg-provider-status--off'}`}>
            {method.connected ? '\u2713 ENABLED' : '\u25CB OFF'}
          </span>
          {method.connected ? (
            <div className="stg-provider-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={onToggle} aria-expanded={expanded}>
                Change
              </button>
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={onDisablePassword}
                disabled={isPending || !canDisable}
                title={!canDisable ? 'Cannot disable your last authentication method' : undefined}
              >
                Disable
              </button>
            </div>
          ) : (
            <button type="button" className="btn-primary btn-sm" onClick={onToggle} aria-expanded={expanded}>
              Enable
            </button>
          )}
        </div>
      </div>

      {expanded && !method.connected && (
        <div className="stg-expand">
          <p className="stg-expand-hint">
            This adds a password to your existing account. You will then be able to sign in with this email and password. No new account will be created.
          </p>
          <form action={onEnablePassword} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="sp-email">Email</label>
              {readOnlyEmail ? (
                <>
                  <input
                    type="email"
                    name="email"
                    id="sp-email"
                    className="auth-input"
                    value={readOnlyEmail}
                    readOnly
                    aria-label="Email"
                  />
                  <span className="auth-helper">Using your {emails[0].provider} email</span>
                </>
              ) : emails.length > 1 ? (
                <select name="email" id="sp-email" className="auth-input" defaultValue={emails[0].email} aria-label="Email">
                  {emails.map((e) => (
                    <option key={e.email} value={e.email}>{e.email} ({e.provider})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="email"
                  name="email"
                  id="sp-email"
                  className="auth-input"
                  required
                  autoComplete="email"
                  aria-label="Email"
                />
              )}
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="sp-password">Password</label>
              <PasswordInput
                name="password"
                id="sp-password"
                required
                minLength={8}
                autoComplete="new-password"
                aria-label="Password"
              />
              <PasswordStrength inputName="password" />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="sp-confirm">Confirm Password</label>
              <PasswordInput
                name="confirmPassword"
                id="sp-confirm"
                required
                minLength={8}
                autoComplete="new-password"
                aria-label="Confirm password"
              />
            </div>
            <button type="submit" className="btn-primary auth-btn auth-btn-tight" disabled={isPending}>
              <span className="auth-btn-text">Enable Password Login</span>
              <span className="auth-btn-arrow">{'\u2192'}</span>
            </button>
          </form>
        </div>
      )}

      {expanded && method.connected && (
        <div className="stg-expand">
          <form action={onChangePassword} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="sp-current-password">Current Password</label>
              <PasswordInput
                name="currentPassword"
                id="sp-current-password"
                required
                minLength={8}
                autoComplete="current-password"
                aria-label="Current password"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="sp-new-password">New Password</label>
              <PasswordInput
                name="newPassword"
                id="sp-new-password"
                required
                minLength={8}
                autoComplete="new-password"
                aria-label="New password"
              />
              <PasswordStrength inputName="newPassword" />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="sp-confirm-new">Confirm New Password</label>
              <PasswordInput
                name="confirmPassword"
                id="sp-confirm-new"
                required
                minLength={8}
                autoComplete="new-password"
                aria-label="Confirm new password"
              />
            </div>
            <button type="submit" className="btn-primary auth-btn auth-btn-tight" disabled={isPending}>
              <span className="auth-btn-text">Change Password</span>
              <span className="auth-btn-arrow">{'\u2192'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function OAuthRow({
  method,
  connectedCount,
  isPending,
  onLink,
  onUnlink,
}: {
  method: AccountMethod;
  connectedCount: number;
  isPending: boolean;
  onLink: (provider: string) => void;
  onUnlink: (provider: string) => void;
}) {
  const lastUsed = formatLastUsed(method.lastUsedAt);
  const description = PROVIDER_DESCRIPTIONS[method.id];

  return (
    <div className="stg-provider">
      <div className="stg-provider-row">
        <div className="stg-provider-left">
          <div className="stg-provider-icon">
            {PROVIDER_ICONS[method.id]?.startsWith('/') ? (
              <Image src={PROVIDER_ICONS[method.id]} alt="" width={20} height={20} unoptimized />
            ) : (
              <span>{PROVIDER_ICONS[method.id] || '?'}</span>
            )}
          </div>
          <div className="stg-provider-info">
            <div className="stg-provider-name">{method.name.toUpperCase()}</div>
            {method.email && <div className="stg-provider-meta">{method.email}</div>}
            {lastUsed && <div className="stg-provider-meta">Last used: {lastUsed}</div>}
          </div>
        </div>
        <div className="stg-provider-right">
          <span className={`stg-provider-status ${method.connected ? 'stg-provider-status--on' : 'stg-provider-status--off'}`}>
            {method.connected ? '\u2713 CONNECTED' : '\u25CB OFF'}
          </span>
          {method.connected ? (
            <form action={() => onUnlink(method.id)}>
              <button
                type="submit"
                className="btn-danger btn-sm"
                disabled={isPending || connectedCount <= 1}
                title={connectedCount <= 1 ? 'Cannot unlink your last authentication method' : undefined}
              >
                Unlink
              </button>
            </form>
          ) : (
            <form action={() => onLink(method.id)}>
              <button type="submit" className="btn-secondary btn-sm">
                Connect
              </button>
            </form>
          )}
        </div>
      </div>

      {description && !method.connected && (
        <div className="stg-provider-desc">{description}</div>
      )}
    </div>
  );
}
