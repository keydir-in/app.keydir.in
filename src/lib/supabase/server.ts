/**
 * Compatibility shim for the pre-Better-Auth Supabase server helpers.
 *
 * The app has migrated to Better Auth, but several modules still call
 * `createClient().auth.getUser()` / `getSupabaseUser()`. These now resolve
 * to the Better Auth session (the Supabase JWT flow is gone), so existing
 * call sites keep working unchanged while the migration completes.
 *
 * Returns a normalized `AuthUser` (see @/lib/auth/session) instead of the
 * old Supabase user shape — only `.id` / `.email` were consumed downstream.
 */
import { cache } from 'react';
import { getAuthUser } from '@/lib/auth/session';

export async function createClient() {
  return {
    auth: {
      getUser: async () => {
        const user = await getAuthUser();
        return { data: { user }, error: null };
      },
    },
  };
}

/**
 * Request-scoped signed-in user. Every helper that previously called
 * `supabase.auth.getUser()` routes through here. React cache() scopes the
 * dedup to a single request only — user identity must never enter a shared
 * data cache.
 */
export const getSupabaseUser = cache(async () => {
  return getAuthUser();
});