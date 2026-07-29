/**
 * Pure functions for computing vote statistics from vote arrays.
 * Exports: computeVoteStats() and getCommunityBadge() for approval badges.
 */
export interface VoteStats {
  upvotes: number;
  downvotes: number;
  total: number;
  approval: number | null;
}

export function computeVoteStats(votes: { type: string }[]): VoteStats {
  let upvotes = 0;
  let downvotes = 0;
  for (const v of votes) {
    if (v.type === 'upvote') upvotes++;
    else if (v.type === 'downvote') downvotes++;
  }
  const total = upvotes + downvotes;
  const approval = total >= 10 ? Math.round((upvotes / total) * 100) : null;
  return { upvotes, downvotes, total, approval };
}

export function getCommunityBadge(upvotes: number, approval: number | null): { label: string; cls: string } | null {
  if (approval === null || upvotes < 10) return null;
  if (approval > 90 && upvotes >= 100) return { label: 'HIGHLY RECOMMENDED', cls: 'b-green' };
  if (approval > 80) return { label: 'COMMUNITY FAVORITE', cls: 'b-blue' };
  return null;
}
