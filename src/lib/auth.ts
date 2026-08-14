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
import { dash } from "@better-auth/infra";
import { prisma } from "@/lib/prisma";

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
    // The Better Auth dashboard web UI talks to /api/auth/dash/* endpoints
    // cross-origin during ownership verification and project connect.
    "https://dash.better-auth.com",
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    // Email confirmation is handled out-of-band (currently no mailer is
    // wired up). Keeping this off avoids a dead-end "verify your email"
    // page that can never actually deliver a link.
    requireEmailVerification: false,
    // No SMTP provider is configured yet. For local development this prints
    // the reset link so the flow can be tested; in production it only logs
    // that a reset was requested (never the token).
    sendResetPassword: async ({ user, url }) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[KeyDir] Password reset link for ${user.email}: ${url}`);
      } else {
        console.warn(
          `[KeyDir] sendResetPassword is not configured — reset requested for ${user.email}`
        );
      }
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
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
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
    // Must be the last plugin: sets auth cookies in server actions/RSC.
    nextCookies(),
  ],
});