'use client';

/**
 * Profile page tabs for collection, contributions, profile info, and
 * activity. Renders tab navigation and conditionally displays product
 * cards, contribution cards, user info, or vote history.
 * Exports: ProfileTabs
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { removeFromCollection } from '@/lib/profile/actions';
import { ProductCard } from '@/components/product/product-card';
import ContributionCard from '@/components/profile/contribution-card';
import { SoundTestCard } from '@/components/product/sound-test-card';
import type { SoundTestItem } from '@/types';

interface CollectionItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    brand: { name: string } | null;
    productType: string;
  };
  createdAt: string;
}

interface VoteItem {
  id: string;
  type: string;
  product: {
    name: string;
    slug: string;
    brand: { name: string } | null;
  };
  createdAt: string;
}

interface ContributionItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  xpAwarded: number;
  status: string;
  createdAt: string;
  approvedBy: { username: string } | null;
}

interface ProfileTabsProps {
  activeTab: string;
  profileUsername: string;
  isOwner: boolean;
  collection: CollectionItem[];
  votes: VoteItem[];
  voteCredits: number;
  memberSince: number;
  rank: string;
  reputation: number;
  communityRole: string;
  profile: {
    id: string;
    displayName: string | null;
    bio: string | null;
    github: string | null;
    discord: string | null;
    reddit: string | null;
    monkeytype: string | null;
    website: string | null;
  };
  contributions?: ContributionItem[];
  soundTests?: {
    productId: string;
    productSlug: string;
    productName: string;
    test: SoundTestItem;
  }[];
}

const TABS = [
  { id: 'collection', label: 'COLLECTION' },
  { id: 'contributions', label: 'CONTRIBUTIONS' },
  { id: 'sound-tests', label: 'SOUND TESTS' },
  { id: 'profile', label: 'PROFILE' },
  { id: 'activity', label: 'ACTIVITY' },
] as const;

const CATEGORIES = [
  { id: 'keyboards', label: 'KEYBOARDS' },
  { id: 'switches', label: 'SWITCHES' },
  { id: 'keycaps', label: 'KEYCAPS' },
  { id: 'mouse', label: 'MOUSE' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function ProfileTabs({
  activeTab,
  profileUsername,
  isOwner,
  collection,
  votes,
  voteCredits,
  memberSince,
  rank,
  reputation,
  communityRole,
  profile,
  contributions,
  soundTests,
}: ProfileTabsProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  // Local tab state, seeded from the server-rendered `tab` search param so
  // deep links / refresh still land on the right tab. Tab clicks update this
  // state directly instead of navigating — the page already passes every
  // tab's data as props, so a router.push() would just re-run all the page's
  // Prisma queries for data we already have.
  const [current, setCurrent] = useState<TabId>(
    () => TABS.find((t) => t.id === activeTab)?.id || 'collection'
  );

  // Keep in sync if `activeTab` changes via a real navigation (shared link,
  // browser back/forward). Our own clicks never touch this prop.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(TABS.find((t) => t.id === activeTab)?.id || 'collection');
  }, [activeTab]);

  function switchTab(id: TabId) {
    setCurrent(id);
    // Update the URL without going through Next's router. page.tsx reads
    // searchParams, so router.push()/replace() re-fetches the RSC payload
    // and re-runs every Prisma query — for data we already have. A plain
    // history update keeps the URL shareable/refreshable at zero network cost.
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    window.history.replaceState(null, '', url.toString());
  }

  async function handleRemove(id: string) {
    setRemoving(id);
    await removeFromCollection(id);
    router.refresh();
  }

  async function handleDeleteSoundTest(id: string) {
    const res = await fetch(`/api/sound-tests/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  return (
    <div className="profile-tabs">
      <div className="profile-tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`profile-tab ${current === t.id ? 'active' : ''}`}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="profile-tab-content">
        {/* ═══ PROFILE TAB ═══ */}
        {current === 'profile' && (
          <div className="profile-info-grid">
            <div className="profile-info-card">
              <div className="profile-info-card-header">ABOUT</div>
              <div className="profile-info-card-body">
                <div className="profile-info-row">
                  <span className="profile-info-label">Username</span>
                  <span className="profile-info-value">{profileUsername}</span>
                </div>
                {profile.displayName && (
                  <div className="profile-info-row">
                    <span className="profile-info-label">Display Name</span>
                    <span className="profile-info-value">{profile.displayName}</span>
                  </div>
                )}
                <div className="profile-info-row">
                  <span className="profile-info-label">Member Since</span>
                  <span className="profile-info-value">{memberSince}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Role</span>
                  <span className="profile-info-value">{communityRole}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Rank</span>
                  <span className="profile-info-value">{rank}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Reputation</span>
                  <span className="profile-info-value">{reputation} XP</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Vote Credits</span>
                  <span className="profile-info-value">{voteCredits}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Collection</span>
                  <span className="profile-info-value">{collection.length} items</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ COLLECTION TAB ═══ */}
        {current === 'collection' && (
          <>
            {collection.length === 0 ? (
              <div className="profile-empty">
                <div className="profile-empty-icon">{'\u25a3'}</div>
                <p className="profile-empty-text">No products in your collection yet.</p>
                <p className="profile-empty-sub">
                  Browse our catalogue and add keyboards, switches, keycaps, and mice to your collection.
                </p>
                <div className="profile-empty-links">
                  <Link href="/keyboards">Keyboards</Link>
                  <Link href="/switches">Switches</Link>
                  <Link href="/keycaps">Keycaps</Link>
                  <Link href="/mouse">Mouse</Link>
                </div>
              </div>
            ) : (
              <div className="profile-collection-sections">
                {CATEGORIES.map((cat) => {
                  const items = collection.filter((c) => c.product.productType === cat.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.id} className="profile-collection-section">
                      <div className="profile-collection-head">
                        <span className="profile-collection-title">{cat.label}</span>
                        <span className="profile-collection-count">{items.length}</span>
                      </div>
                      <div className="profile-grid">
                        {items.map((item) => (
                          <ProductCard
                            key={item.id}
                            product={{
                              ...item.product,
                              lowestPrice: null,
                              originalPrice: null,
                              hasCoupons: false,
                              couponCode: null,
                              vendorCount: 0,
                              upvotes: 0,
                              downvotes: 0,
                              approval: null,
                              userVote: null,
                            }}
                            variant="profile"
                            brand={item.product.brand?.name ?? undefined}
                            onRemove={isOwner ? handleRemove : undefined}
                            removing={removing === item.id}
                            collectionItemId={item.id}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ CONTRIBUTIONS TAB ═══ */}
        {current === 'contributions' && (
          contributions && contributions.length > 0 ? (
            <div className="card-contribution-list">
              {contributions.map((c) => (
                <ContributionCard
                  key={c.id}
                  id={c.id}
                  type={c.type}
                  title={c.title}
                  description={c.description}
                  xpAwarded={c.xpAwarded}
                  status={c.status}
                  createdAt={c.createdAt}
                  approvedBy={c.approvedBy?.username || null}
                />
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              <div className="profile-empty-icon">{'\u2b50'}</div>
              <p className="profile-empty-text">No contributions yet.</p>
              <p className="profile-empty-sub">
                Help improve KeyDir by adding products, updating prices, or editing specs.
              </p>
              <div className="profile-empty-links">
                <Link href="/keyboards">Browse Keyboards</Link>
                <Link href="/switches">Browse Switches</Link>
                <Link href="/mouse">Browse Mice</Link>
              </div>
            </div>
          )
        )}

        {/* ═══ SOUND TESTS TAB ═══ */}
        {current === 'sound-tests' && (
          soundTests && soundTests.length > 0 ? (
            <div className="st-list">
              {soundTests.map(({ test, productId, productSlug, productName }) => (
                <div key={test.id} className="profile-st-item">
                  <Link href={`/products/${productSlug}`} className="profile-st-product">
                    {productName}
                  </Link>
                  <SoundTestCard
                    test={test}
                    productId={productId}
                    productSlug={productSlug}
                    canDelete={isOwner}
                    onDelete={() => handleDeleteSoundTest(test.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              <div className="profile-empty-icon">{'\u266a'}</div>
              <p className="profile-empty-text">No sound tests yet.</p>
              <p className="profile-empty-sub">
                Upload sound tests on any keyboard or switch product page to share your build&apos;s sound.
              </p>
              <div className="profile-empty-links">
                <Link href="/keyboards">Browse Keyboards</Link>
                <Link href="/switches">Browse Switches</Link>
              </div>
            </div>
          )
        )}

        {/* ═══ ACTIVITY TAB ═══ */}
        {current === 'activity' && (
          <>
            {votes.length === 0 ? (
              <div className="profile-empty">
                <div className="profile-empty-icon">{'\u25b2'}</div>
                <p className="profile-empty-text">No activity yet.</p>
                <p className="profile-empty-sub">
                  Upvote or downvote products to see your voting history here.
                </p>
              </div>
            ) : (
              <div className="profile-activity">
                {votes.map((vote) => (
                  <div key={vote.id} className="profile-activity-item">
                    <span className={`profile-activity-icon ${vote.type === 'upvote' ? 'up' : 'down'}`}>
                      {vote.type === 'upvote' ? '\u25b2' : '\u25bc'}
                    </span>
                    <div className="profile-activity-info">
                      <Link href={`/products/${vote.product.slug}`} className="profile-activity-link">
                        {vote.product.brand?.name ? `${vote.product.brand.name} ` : ''}
                        {vote.product.name}
                      </Link>
                      <span className="profile-activity-action">
                        {vote.type === 'upvote' ? 'Upvoted' : 'Downvoted'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
