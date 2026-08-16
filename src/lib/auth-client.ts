/**
 * Better Auth client (browser). Used by client components for social
 * sign-in, sign-out, session fetching, and password operations.
 */
import { createAuthClient } from "better-auth/react";
import { dashClient, sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : undefined),
  plugins: [
    dashClient(),
    // Sentinel: sends browser fingerprint/device identification to the
    // project-scoped KV ingestion URL so the server can attribute security
    // events to a stable visitor id. The identify URL is public (not a
    // secret) but environment-specific, so it stays behind NEXT_PUBLIC_.
    sentinelClient({
      identifyUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL,
    }),
  ],
});
