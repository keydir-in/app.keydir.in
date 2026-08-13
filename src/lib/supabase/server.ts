/**
 * Server-side Supabase client factory for Server Components and Route Handlers.
 * Reads/writes auth cookies via next/headers cookies().
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Component — expected, keep going
            }
          }
        },
      },
    }
  );
}

/**
 * One request-scoped source of truth for the signed-in user. Every helper
 * that needs `supabase.auth.getUser()` (getCurrentUserAndProfile,
 * getCurrentUser, isVotingEligible, checkAndGrantReward, getConnectedAccounts,
 * settings page) routes through this, so a render that touches several of
 * them makes a single Supabase JWT verification round trip instead of one
 * per helper. React cache() scopes the dedup to a single request only —
 * user identity must never enter a shared data cache.
 */
export const getSupabaseUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
