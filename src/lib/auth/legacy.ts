/**
 * Legacy Supabase Auth migration helpers (read-only + non-destructive).
 *
 * The pre-Better-Auth users live in Supabase's `auth.users` / `auth.identities`
 * tables and their KeyDir profiles are keyed by those old UUIDs (Profile.userId,
 * no foreign key). Existing accounts are never modified: on their next sign-in
 * the matching Profile row is re-pointed to the new Better Auth user id.
 *
 * `auth.users` stays in place until all legacy accounts have migrated.
 */
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";

export interface LegacyUser {
  id: string;
  email: string;
  confirmedAt: string | null;
  encryptedPassword: string | null;
  providerIds: string[];
}

export async function findLegacyUserByEmail(
  email: string,
): Promise<LegacyUser | null> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      confirmed_at: string | null;
      encrypted_password: string | null;
    }>
  >`
    SELECT id, email, confirmed_at, encrypted_password
    FROM auth.users
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `;
  if (rows.length === 0) return null;

  const providers = await prisma.$queryRaw<Array<{ provider: string }>>`
    SELECT DISTINCT provider FROM auth.identities WHERE user_id = ${rows[0].id}
  `;

  return {
    id: rows[0].id,
    email: rows[0].email,
    confirmedAt: rows[0].confirmed_at,
    encryptedPassword: rows[0].encrypted_password,
    providerIds: providers.map((p) => p.provider),
  };
}

export async function getLegacyEligibility(email: string) {
  const legacy = await findLegacyUserByEmail(email);
  if (!legacy) {
    return { hasPassword: false, hasGoogle: false, hasDiscord: false };
  }
  return {
    hasPassword: Boolean(legacy.encryptedPassword),
    hasGoogle: legacy.providerIds.includes("google"),
    hasDiscord: legacy.providerIds.includes("discord"),
  };
}

/**
 * Adopt a legacy profile: if a Profile row is keyed by the legacy auth.users id
 * (found by email) and the current Better Auth user has no Profile yet, repoint
 * it to the Better Auth user id. Returns the adopted profile or null.
 */
export async function adoptLegacyProfile(
  userId: string,
  email: string,
): Promise<{ id: string; userId: string; registrationComplete: boolean } | null> {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) return existing;

  const legacy = await findLegacyUserByEmail(email);
  if (!legacy) return null;

  const legacyProfile = await prisma.profile.findUnique({
    where: { userId: legacy.id },
  });
  if (!legacyProfile) return null;

  try {
    const adopted = await prisma.profile.update({
      where: { id: legacyProfile.id },
      data: { userId },
      select: { id: true, userId: true, registrationComplete: true },
    });
    return adopted;
  } catch {
    // Profile already claimed by another Better Auth user.
    return null;
  }
}

/** Verify a password against a legacy Supabase bcrypt hash. */
export async function verifyLegacyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const legacy = await findLegacyUserByEmail(email);
  if (!legacy?.encryptedPassword) return false;
  try {
    const bcrypt = await import("bcryptjs");
    return await bcrypt.compare(password, legacy.encryptedPassword);
  } catch {
    return false;
  }
}

/**
 * Migrate a legacy password user into Better Auth at sign-in time: create the
 * user + credential account (password re-hashed with Better Auth's hasher) and
 * adopt their existing Profile. Idempotent.
 */
export async function migrateLegacyUser(email: string, password: string) {
  const legacy = await findLegacyUserByEmail(email);
  if (!legacy) return null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: email.split("@")[0],
      email,
      emailVerified: Boolean(legacy.confirmedAt),
      image: null,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          providerId: "credential",
          accountId: email,
          password: passwordHash,
        },
      },
    },
    select: { id: true, email: true },
  });
  await adoptLegacyProfile(user.id, email);
  return user;
}