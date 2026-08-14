/**
 * User-specific product page sections. These are the ONLY parts of the
 * product page that read cookies/session identity, so they are isolated
 * behind their own Suspense boundaries: the cached public content (hero,
 * vendors, price history, specs) streams immediately while auth + the
 * user's vote/collection state resolve.
 *
 * Nothing here enters a shared cache — every read is request-scoped
 * (React cache() dedupes within one request only), so a user's vote,
 * collection membership, credits, or upload permissions can never leak
 * into a cross-request cached payload.
 */
import { cache } from 'react';
import { ProductHeroCommunity } from '@/components/product/product-hero-community';
import { BookmarkButton } from '@/components/product/bookmark-button';
import { SoundTests } from '@/components/product/sound-tests';
import { getSoundTests, getSwitchOptions } from '@/lib/cache/product-page';
import { getCurrentUserAndProfile } from '@/lib/profile/actions';
import { canUploadSoundTests, getCurrentUser } from '@/lib/auth/actions';
import { prisma } from '@/lib/prisma';

const readUserState = cache(async (productId: string) => {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) return { profile: null, userVote: null, inCollection: false };

  const [voteItem, collectionItem] = await Promise.all([
    prisma.vote.findUnique({
      where: { profileId_productId: { profileId: profile.id, productId } },
    }),
    prisma.collection.findUnique({
      where: { profileId_productId: { profileId: profile.id, productId } },
    }),
  ]);

  return {
    profile,
    userVote: (voteItem?.type as 'upvote' | 'downvote') || null,
    inCollection: !!collectionItem,
  };
});

export async function ProductHeroCommunitySection({
  productId,
  upvotes,
  downvotes,
  showVoting,
}: {
  productId: string;
  upvotes: number;
  downvotes: number;
  showVoting: boolean;
}) {
  const { userVote } = await readUserState(productId);
  return (
    <ProductHeroCommunity
      productId={productId}
      upvotes={upvotes}
      downvotes={downvotes}
      userVote={userVote}
      showVoting={showVoting}
    />
  );
}

export async function ProductBookmark({ productId }: { productId: string }) {
  const { inCollection } = await readUserState(productId);
  return <BookmarkButton productId={productId} initialSaved={inCollection} />;
}

export async function SoundTestsSection({
  productId,
  productSlug,
  productName,
  productType,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  productType: string;
}) {
  const [soundTests, switchOptions, { profile: currentUser }, authUser] = await Promise.all([
    getSoundTests(productSlug),
    getSwitchOptions(),
    getCurrentUserAndProfile(),
    getCurrentUser(),
  ]);

  const canUpload = currentUser
    ? await canUploadSoundTests(currentUser.userId, currentUser.isVerified)
    : false;
  const userSoundTestCount = currentUser
    ? await prisma.soundTest.count({ where: { profileId: currentUser.id } })
    : 0;

  return (
    <SoundTests
      productId={productId}
      productSlug={productSlug}
      productName={productName}
      productType={productType}
      canUpload={canUpload}
      isLoggedIn={!!currentUser}
      currentProfileId={currentUser?.id ?? null}
      isAdmin={authUser?.isAdmin ?? false}
      items={soundTests}
      switches={switchOptions}
      userSoundTestCount={userSoundTestCount}
    />
  );
}