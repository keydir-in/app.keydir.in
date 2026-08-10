import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ConnectedAccounts } from '@/components/auth/connected-accounts';
import { getConnectedAccounts } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/profile/actions';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Account Settings | KeyDir',
  description: 'Manage your KeyDir account settings, connected accounts, and authentication methods.',
  robots: { index: false, follow: false },
};

function SettingsSectionSkeleton() {
  return (
    <div className="stg-section" style={{ minHeight: 120 }}>
      <div className="stg-section-head">
        <span className="stg-section-title">LOADING...</span>
      </div>
    </div>
  );
}

async function ConnectedProvidersSection({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  const accounts = await getConnectedAccounts();
  const connectedCount = accounts?.methods.filter((m) => m.connected).length ?? 0;
  const totalCount = accounts?.methods.length ?? 0;

  return (
    <section className="stg-section">
      <div className="stg-section-head">
        <span className="stg-section-title">CONNECTED PROVIDERS</span>
        <span className="stg-section-count">{connectedCount} OF {totalCount}</span>
      </div>
      <ConnectedAccounts
        methods={accounts?.methods ?? []}
        oauthEmails={accounts?.oauthEmails}
        error={error}
        message={message}
      />
    </section>
  );
}

async function AccountDetailsSection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { profile } = await getCurrentUserAndProfile();
  const accounts = await getConnectedAccounts();
  const hasPassword = accounts?.methods.find((m) => m.id === 'password')?.connected ?? false;

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="stg-section">
      <div className="stg-section-head">
        <span className="stg-section-title">ACCOUNT DETAILS</span>
      </div>
      <div className="stg-details">
        <div className="stg-detail-row">
          <span className="stg-detail-key">USERNAME</span>
          <span className="stg-detail-val">{profile?.username ?? '\u2014'}</span>
        </div>
        <div className="stg-detail-row">
          <span className="stg-detail-key">EMAIL</span>
          <span className="stg-detail-val">{user.email}</span>
        </div>
        <div className="stg-detail-row">
          <span className="stg-detail-key">MEMBER SINCE</span>
          <span className="stg-detail-val">{memberSince}</span>
        </div>
        <div className="stg-detail-row">
          <span className="stg-detail-key">PASSWORD LOGIN</span>
          <span className={`stg-detail-val ${hasPassword ? 'stg-detail-val--on' : 'stg-detail-val--off'}`}>
            {hasPassword ? 'ENABLED' : 'NOT ENABLED'}
          </span>
        </div>
        <div className="stg-detail-row">
          <span className="stg-detail-key">USER ID</span>
          <span className="stg-detail-val stg-detail-val--mono">{user.id}</span>
        </div>
      </div>
    </section>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { profile } = await getCurrentUserAndProfile();

  const accounts = await getConnectedAccounts();
  const connectedCount = accounts?.methods.filter((m) => m.connected).length ?? 0;
  const totalCount = accounts?.methods.length ?? 0;
  const pct = totalCount ? Math.round((connectedCount / totalCount) * 100) : 0;

  const hasPassword = accounts?.methods.find((m) => m.id === 'password')?.connected ?? false;
  const hasGoogle = accounts?.methods.find((m) => m.id === 'google')?.connected ?? false;
  const hasDiscord = accounts?.methods.find((m) => m.id === 'discord')?.connected ?? false;

  const votingEligible = accounts?.votingEligible ?? false;
  const voteCredits = accounts?.voteCredits ?? 0;

  const soundTestCount = profile ? await prisma.soundTest.count({ where: { profileId: profile.id } }) : 0;

  const checks = [
    { label: 'Password', met: hasPassword },
    { label: 'Google', met: hasGoogle },
    { label: 'Discord', met: hasDiscord },
  ];
  const checksMet = checks.filter((c) => c.met).length;

  return (
    <>
      <main className="stg-page">
        <div className="page-body" style={{ maxWidth: '1400px', paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: '64px' }}>

          {/* ═══ HERO ═══ */}
          <section className="stg-hero">
            <div className="stg-hero-grid">
              <div className="stg-hero-left">
                <div className="hero-eyebrow" style={{ marginBottom: '1rem' }}>
                  <span className="dot" /> auth --status
                </div>
                <h1 className="page-hero-title" style={{ fontSize: 'clamp(2.5rem, 4.2vw, 3.75rem)', marginBottom: '.5rem', lineHeight: .9 }}>
                  {profile?.username ?? user.email?.split('@')[0] ?? 'USER'}
                </h1>
              </div>

              <div className="stg-hero-right">
                <div className="stg-status-panel">
                  <div className="stg-status-head">
                    <span className="stg-status-title">USAGE &amp; QUOTA</span>
                  </div>
                  <div className="stg-quota">
                    <div className="stg-quota-item">
                      <div className="stg-quota-top">
                        <span className="stg-quota-label">VOTING CREDITS</span>
                        <span className="stg-quota-val">{voteCredits} / 10</span>
                      </div>
                      <div className="stg-progress-bar">
                        <div className="stg-progress-fill" style={{ width: `${Math.min(100, (voteCredits / 10) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="stg-quota-item">
                      <div className="stg-quota-top">
                        <span className="stg-quota-label">SOUND TEST UPLOADS</span>
                        <span className="stg-quota-val">{soundTestCount} / 10 used</span>
                      </div>
                      <div className="stg-progress-bar">
                        <div className="stg-progress-fill" style={{ width: `${Math.min(100, (soundTestCount / 10) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stg-hero-right">
                <div className="stg-status-panel">
                  <div className="stg-status-head">
                    <span className="stg-status-title">AUTH STATUS</span>
                  </div>
                  <div className="stg-progress">
                    <div className="stg-progress-meta">
                      <span className="stg-progress-label">{checksMet} OF {totalCount} CONNECTED</span>
                      <span className="stg-progress-pct">{pct}%</span>
                    </div>
                    <div className="stg-progress-bar">
                      <div className="stg-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="stg-checks">
                    {checks.map((c) => (
                      <div key={c.label} className={`stg-check ${c.met ? 'stg-check--met' : ''}`}>
                        <span className="stg-check-mark">{c.met ? '\u2713' : '\u25CB'}</span>
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="stg-status-divider" />

                  <div className="stg-voting">
                    <div className="stg-voting-head">
                      <span className="stg-voting-title">VOTING</span>
                      {votingEligible ? (
                        <span className="stg-status-badge stg-status-badge--on">UNLOCKED</span>
                      ) : (
                        <span className="stg-status-badge stg-status-badge--off">LOCKED</span>
                      )}
                    </div>
                    {votingEligible ? (
                      <div className="stg-voting-rewards">
                        <div className="stg-reward">
                          <span className="stg-reward-check">✓</span>
                          <span className="stg-reward-text">Voting Unlocked</span>
                        </div>
                        <div className="stg-reward">
                          <span className="stg-reward-check">✓</span>
                          <span className="stg-reward-text">Sound Test Uploads Unlocked</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {!hasDiscord && (
                          <Link href="/settings" className="stg-voting-cta">Connect Discord {'\u2192'}</Link>
                        )}
                        <div className="stg-voting-preview">
                          <span className="stg-voting-preview-label">Unlock to access:</span>
                          <span>{'>'} {voteCredits} Voting Credits</span>
                          <span>{'>'} Community Reputation</span>
                          <span>{'>'} Sound Test Uploads</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ CONNECTED PROVIDERS (streamed) ═══ */}
          <Suspense fallback={<SettingsSectionSkeleton />}>
            <ConnectedProvidersSection error={params.error} message={params.message} />
          </Suspense>

          {/* ═══ ACCOUNT DETAILS (streamed) ═══ */}
          <Suspense fallback={<SettingsSectionSkeleton />}>
            <AccountDetailsSection />
          </Suspense>

        </div>
      </main>
    </>
  );
}
