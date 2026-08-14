/**
 * Social login buttons for Google and Discord OAuth providers.
 * Each button triggers a server action to initiate the OAuth flow.
 * Accepts a "next" parameter to redirect users back to their originating page after login.
 * Only renders providers that are configured (env-guarded in src/lib/auth.ts).
 * Exports: SocialButtons
 */

import Image from 'next/image';
import { signInWithGoogle, signInWithDiscord } from '@/lib/auth/actions';

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);
const discordEnabled = Boolean(
  process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET,
);

export function SocialButtons({ next }: { next?: string }) {
  return (
    <div className="auth-social">
      {googleEnabled && (
        <form action={signInWithGoogle.bind(null, next)}>
          <button type="submit" className="btn-secondary auth-btn" aria-label="Sign in with Google">
            <Image src="/logos/google-logo.png" alt="" width={16} height={16} unoptimized />
            Login
          </button>
        </form>
      )}
      {discordEnabled && (
        <form action={signInWithDiscord.bind(null, next)}>
          <button type="submit" className="btn-secondary auth-btn" aria-label="Sign in with Discord">
            <Image src="/logos/discord-logo.png" alt="" width={16} height={16} unoptimized />
            Login
          </button>
        </form>
      )}
    </div>
  );
}