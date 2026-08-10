/**
 * User profile page (dynamic [username]). Server-rendered — fetches the
 * profile, votes, contributions, badges, and reputation stats. Owners see
 * edit/logout controls and a tabbed interface for collection, votes,
 * contributions, and reputation. Auto-creates profile for authenticated
 * users visiting their own URL if one doesn't exist yet.
 */

import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Identicon } from '@/components/profile/identicon';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { getProfileByUsername, getCollectionForProfile, getCurrentUser, ensureProfile, isAuthenticated } from '@/lib/profile/actions';
import { logout } from '@/lib/auth/actions';
import { prisma } from '@/lib/prisma';
import { getRank } from '@/lib/reputation';
import { getUserBadges } from '@/lib/reputation/actions';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ edit?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — Profile | KeyDir`,
    description: `View ${username}'s profile on KeyDir. Check their collection, votes, contributions, and reputation in the mechanical keyboard community.`,
    openGraph: {
      title: `${username} — KeyDir Profile`,
      description: `View ${username}'s mechanical keyboard collection, votes, and community contributions on KeyDir.`,
      url: `https://app.keydir.in/profile/${username}`,
    },
    twitter: {
      card: 'summary',
      title: `${username} — KeyDir Profile`,
      description: `View ${username}'s mechanical keyboard collection and community contributions on KeyDir.`,
    },
    robots: { index: true, follow: true },
  };
}

function formatMemberDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

async function loadProfileData(username: string) {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  // None of these depend on each other's result — only on profile.id, which
  // we already have. Fetching them together makes the page wait for the
  // single slowest query instead of the sum of all of them.
  // ponytail: vote/contribution stat numbers come from count(); the tab lists
  // are capped at 50 recent rows. The tabs have no pagination yet — add
  // "load more" if full history becomes a requirement.
  const [voteCount, votes, contributionCount, contributions, collection, userXpRecord, userBadgesResult, soundTests] = await Promise.all([
    prisma.vote.count({ where: { profileId: profile.id } }),
    prisma.vote.findMany({
      where: { profileId: profile.id },
      select: {
        id: true,
        type: true,
        createdAt: true,
        // The Activity tab only renders slug/name/brand per vote — the old
        // query also pulled `image` and a nested vendorProducts price lookup
        // per vote that nothing ever displayed.
        product: {
          select: {
            name: true,
            slug: true,
            brand: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.contribution.count({ where: { profileId: profile.id, status: 'APPROVED' } }),
    prisma.contribution.findMany({
      where: { profileId: profile.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        xpAwarded: true,
        status: true,
        createdAt: true,
        approvedBy: { select: { username: true } },
      },
    }),
    // The Collection tab (default tab) shows every saved product; unlike
    // votes/contributions this only grows on deliberate saves, so it stays
    // uncapped. Fetched here so it doesn't block the batch (it used to be
    // bundled inside getProfileByUsername, serial before everything else).
    getCollectionForProfile(profile.id),
    prisma.userXP.findUnique({ where: { profileId: profile.id } }),
    getUserBadges(profile.id),
    prisma.soundTest.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        audioUrl: true,
        duration: true,
        keyboardName: true,
        foamUsed: true,
        pcbDetails: true,
        plate: true,
        switchName: true,
        springWeight: true,
        isLubed: true,
        isFilmed: true,
        otherMods: true,
        keycapsName: true,
        keycapsMaterial: true,
        keycapsProfile: true,
        additionalMods: true,
        createdAt: true,
        profile: { select: { username: true } },
        product: { select: { id: true, slug: true, name: true, brand: { select: { name: true } } } },
      },
    }),
  ]);

  // Return plain serializable data (Dates as ISO strings). unstable_cache
  // stores JSON, so without this Date fields would arrive as strings on cache
  // hits but as Dates on misses; converting up front makes both paths identical.
  return {
    profile: {
      id: profile.id,
      username: profile.username,
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      createdAt: profile.createdAt.toISOString(),
      github: profile.github,
      discord: profile.discord,
      reddit: profile.reddit,
      monkeytype: profile.monkeytype,
      website: profile.website,
      voteCredits: profile.voteCredits,
      collectionCount: profile._count?.collection ?? 0,
      collection: collection.map((c) => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        product: c.product,
      })),
    },
    votes: votes.map((v) => ({
      id: v.id,
      type: v.type,
      createdAt: v.createdAt.toISOString(),
      product: v.product,
    })),
    contributions: contributions.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      approvedBy: c.approvedBy,
    })),
    voteCount,
    contributionCount,
    xp: userXpRecord?.xp ?? 0,
    badges: userBadgesResult,
    soundTests: soundTests.map((t) => ({
      productId: t.product.id,
      productSlug: t.product.slug,
      productName: t.product.brand?.name ? `${t.product.brand.name} ${t.product.name}` : t.product.name,
      test: {
        id: t.id,
        audioUrl: t.audioUrl,
        duration: t.duration,
        keyboardName: t.keyboardName,
        foamUsed: t.foamUsed,
        pcbDetails: t.pcbDetails,
        plate: t.plate,
        switchName: t.switchName,
        springWeight: t.springWeight,
        isLubed: t.isLubed,
        isFilmed: t.isFilmed,
        otherMods: t.otherMods,
        keycapsName: t.keycapsName,
        keycapsMaterial: t.keycapsMaterial,
        keycapsProfile: t.keycapsProfile,
        additionalMods: t.additionalMods,
        createdAt: t.createdAt.toISOString(),
        username: t.profile.username,
        profileId: profile.id,
      },
    })),
  };
}

// Per-username profile data is viewer-independent — cache it across requests
// (Vercel Data Cache). Mutations revalidate the path; 300s is the fallback
// staleness floor for anything that doesn't.
const getCachedProfileData = unstable_cache(loadProfileData, ['profile-data'], { revalidate: 300 });

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { edit, tab } = await searchParams;

  // No dependency on `profile` — start it now so its round trip overlaps
  // with the profile lookup below instead of running after it.
  const currentUserPromise = getCurrentUser();

  let data = await getCachedProfileData(username);

  if (!data) {
    const loggedIn = await isAuthenticated();
    if (loggedIn) {
      const created = await ensureProfile();
      if (created) {
        if (created.username !== username) redirect(`/profile/${created.username}`);
        // Bypass cache: the cached `null` for this username would otherwise
        // 404 the just-created profile until it's revalidated.
        data = await loadProfileData(created.username);
      }
    }
    if (!data) notFound();
  }

  const currentUser = await currentUserPromise;
  const profile = data.profile;
  const isOwner = currentUser?.userId === profile.userId;
  const xp = data.xp;
  const rank = getRank(xp);
  const communityBadge = data.badges?.find((ub) => ub.badge.type === 'community');
  const communityRole = communityBadge?.badge.name || 'Member';
  const stats = { xp, rank, voteCount: data.voteCount, collectionCount: profile.collectionCount, contributionCount: data.contributionCount, badges: data.badges };

  return (
    <>
      <div className="profile-page">
        <div className="profile-container">
          {/* ═══ Hero ═══ */}
          <div className="profile-hero">
            <div className="profile-hero-left">
              <Identicon username={profile.username} size={180} memberNumber={42} />
            </div>
            <div className="profile-hero-right">
              <div className="profile-hero-top">
                <h1 className="profile-hero-name">
                  {(profile.displayName || profile.username).toUpperCase()}
                </h1>
                {isOwner && (
                  <div className="profile-hero-actions">
                    {edit ? (
                      <Link href={`/profile/${profile.username}`} className="btn-secondary btn-sm">
                        BACK
                      </Link>
                    ) : (
                      <Link href={`/profile/${profile.username}?edit=1`} className="btn-primary btn-sm">
                        EDIT PROFILE
                      </Link>
                    )}
                    <form action={logout}>
                      <button type="submit" className="btn-secondary btn-sm">
                        LOGOUT
                      </button>
                    </form>
                  </div>
                )}
              </div>
              <div className="profile-hero-handle">@{profile.username}</div>
              <div className="profile-hero-badges">
                {stats?.badges?.map((ub) => (
                  <span
                    key={ub.badge.id}
                    className="profile-hero-badge"
                    style={{
                      backgroundColor: ub.badge.bgColor,
                      color: ub.badge.textColor,
                      borderColor: ub.badge.borderColor,
                    }}
                    title={ub.badge.description || undefined}
                  >
                    {ub.badge.icon} {ub.badge.name}
                  </span>
                ))}
              </div>
              <div className="profile-hero-meta">
                <span>Joined {formatMemberDate(profile.createdAt)}</span>
                <span className="profile-hero-meta-sep">&bull;</span>
                <span>{xp} XP</span>
              </div>

              {profile.bio && (
                <p className="profile-hero-bio">{profile.bio}</p>
              )}

              <div className="profile-hero-socials">
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className="profile-hero-social-icon" title="GitHub">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  </a>
                )}
                {profile.reddit && (
                  <a href={`https://reddit.com/u/${profile.reddit.replace(/^u\//, '')}`} target="_blank" rel="noopener noreferrer" className="profile-hero-social-icon" title="Reddit">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 000-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z"/></svg>
                  </a>
                )}
                {profile.discord && (
                  <span className="profile-hero-social-icon" title={`Discord: ${profile.discord}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  </span>
                )}
                {profile.monkeytype && (
                  <a href={profile.monkeytype} target="_blank" rel="noopener noreferrer" className="profile-hero-social-icon" title="Monkeytype">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h12v2H3v-2zm0 4h18v2H3v-2zm0 4h12v2H3v-2z"/></svg>
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="profile-hero-social-icon" title="Website">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Edit Form ═══ */}
          {isOwner && edit && (
            <div className="profile-edit-section">
              <ProfileEditForm
                profile={{
                  displayName: profile.displayName,
                  bio: profile.bio,
                  github: profile.github,
                  discord: profile.discord,
                  reddit: profile.reddit,
                  monkeytype: profile.monkeytype,
                  website: profile.website,
                }}
              />
            </div>
          )}

          {/* ═══ Stats Row ═══ */}
          <div className="profile-stats-row">
            <div className="profile-stat-box">
              <span className="profile-stat-num">{stats?.voteCount || 0}</span>
              <span className="profile-stat-label">VOTES</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-num">{profile.voteCredits}</span>
              <span className="profile-stat-label">CREDITS</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-num">{stats?.collectionCount || 0}</span>
              <span className="profile-stat-label">COLLECTION</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-num">{stats?.contributionCount || 0}</span>
              <span className="profile-stat-label">CONTRIBUTIONS</span>
            </div>
          </div>

          {/* ═══ Tabs ═══ */}
          <ProfileTabs
            activeTab={tab || 'collection'}
            profileUsername={profile.username}
            isOwner={isOwner}
            collection={profile.collection}
            votes={data.votes}
            voteCredits={profile.voteCredits}
            memberSince={new Date(profile.createdAt).getFullYear()}
            rank={rank}
            reputation={xp}
            communityRole={communityRole}
            profile={{
              id: profile.id,
              displayName: profile.displayName,
              bio: profile.bio,
              github: profile.github,
              discord: profile.discord,
              reddit: profile.reddit,
              monkeytype: profile.monkeytype,
              website: profile.website,
            }}
            contributions={data.contributions}
            soundTests={data.soundTests}
          />
        </div>
      </div>
    </>
  );
}
