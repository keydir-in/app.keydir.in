/**
 * Better Auth server instance.
 *
 * Uses the existing Supabase PostgreSQL database (via the app's Prisma
 * client + PostgreSQL driver adapter). Authentication data lives in the
 * `user` / `session` / `account` / `verification` tables that sit alongside
 * the existing KeyDir tables.
 *
 * The Better Auth Infrastructure `dash()` plugin connects this instance to
 * the Better Auth dashboard (https://dash.better-auth.com). Secrets are read
 * from environment variables only and never exposed to the browser.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { dash, sentinel } from "@better-auth/infra";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export const auth = betterAuth({
  appName: "KeyDir",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    baseURL,
    "http://localhost:3000",
    // Sibling deployment. Same identity system + shared session cookie, so
    // requests authenticated on scraper.keydir.in are treated as trusted.
    "https://scraper.keydir.in",
    // The Better Auth dashboard web UI talks to /api/auth/dash/* endpoints
    // cross-origin during ownership verification and project connect.
    "https://dash.better-auth.com",
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    // Email confirmation is handled out-of-band. Keeping this off avoids a
    // dead-end "verify your email" page until verification emails exist.
    requireEmailVerification: false,
    // Sends the Better Auth-generated reset link by email (Resend). Accounts
    // that only have Google/Discord OAuth (no password credential) are skipped
    // so a reset link can never be used to grant a password to a social-only
    // account. The caller still receives the generic "if an account exists"
    // response, so account existence is not revealed.
    sendResetPassword: async ({ user, url }) => {
      const hasPassword = await prisma.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
        select: { id: true },
      });
      if (!hasPassword) return;

      // Better Auth generates the reset link itself, as
      // `${baseURL}/reset-password/<token>?callbackURL=<redirectTo>`, using
      // BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL. We send it unchanged: clicking
      // it hits the Better Auth callback route, which validates the token and
      // redirects to the KeyDir reset-password UI (`/reset-password?token=...`).
      // No manual token construction or URL rewriting here.
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        url,
      });
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    // Discord is only active once DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET
    // are set. Until then the Discord buttons show "not configured".
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? {
          discord: {
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: {
      enabled: true,
      // Encrypt the cached session_data cookie (A256CBC-HS512 JWE) instead of
      // the default compact format, which stores user/session data in a
      // base64-readable, HMAC-signed-but-unencrypted cookie.
      strategy: "jwe",
      maxAge: 60 * 5,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
    // Share the session cookie with scraper.keydir.in. Both hosts share the
    // registrable domain `keydir.in` (same-site), so SameSite=Lax remains
    // correct — no SameSite=None relaxation is needed. Production-only: a
    // `.keydir.in` Domain cookie would never be sent back to `localhost`, so
    // enabling it in dev would break local login.
    crossSubDomainCookies: {
      enabled:
        process.env.NODE_ENV === "production" &&
        new URL(baseURL).hostname.endsWith("keydir.in"),
      domain: ".keydir.in",
    },
    ipAddress: {
      // Deployed on Vercel only (no Cloudflare). Vercel's edge overwrites
      // `x-forwarded-for` with the connecting client IP and also sets
      // `x-vercel-forwarded-for` to the same value, so both are trustworthy
      // and not client-spoofable. `x-vercel-forwarded-for` is included
      // because it is Vercel's canonical client-IP header (it is also the
      // @better-auth/infra plugin's own platform-trusted default). The first
      // configured header that resolves is used. trustedProxies is
      // intentionally unset: Vercel's proxy IPs are dynamic, and the default
      // already rejects multi-value (spoofable) chains.
      ipAddressHeaders: ["x-forwarded-for", "x-vercel-forwarded-for"],
    },
  },
  experimental: {
    // Prisma adapter: merges session+user (and user+account) lookups into one
    // query via include. Relations are already defined in schema.prisma.
    joins: true,
  },
  plugins: [
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY || undefined,
      // Omit apiUrl/kvUrl when unset so the plugin falls back to its own
      // INFRA_API_URL / INFRA_KV_URL defaults (passing `undefined` here
      // overrides those defaults and breaks outbound JWKS/KV calls).
      ...(process.env.BETTER_AUTH_API_URL
        ? { apiUrl: process.env.BETTER_AUTH_API_URL }
        : {}),
      ...(process.env.BETTER_AUTH_KV_URL
        ? { kvUrl: process.env.BETTER_AUTH_KV_URL }
        : {}),
    }),
    // Sentinel security monitoring (blocked/challenged/allowed requests,
    // suspicious activity, IP/security events). Shares the same Dash API
    // connection as `dash`. No security rules are enabled here, so it only
    // records/tracks events and never blocks or challenges legitimate users.
    sentinel({
      apiKey: process.env.BETTER_AUTH_API_KEY || undefined,
      // Omit apiUrl/kvUrl when unset so the plugin falls back to its own
      // INFRA_API_URL / INFRA_KV_URL defaults.
      ...(process.env.BETTER_AUTH_API_URL
        ? { apiUrl: process.env.BETTER_AUTH_API_URL }
        : {}),
      ...(process.env.BETTER_AUTH_KV_URL
        ? { kvUrl: process.env.BETTER_AUTH_KV_URL }
        : {}),
    }),
    // Must be the last plugin: sets auth cookies in server actions/RSC.
    nextCookies(),
  ],
});