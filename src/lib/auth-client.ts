/**
 * Better Auth client (browser). Used by client components for social
 * sign-in, sign-out, session fetching, and password operations.
 */
import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : undefined),
  plugins: [dashClient()],
});