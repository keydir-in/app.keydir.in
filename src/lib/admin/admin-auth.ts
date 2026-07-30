/**
 * Admin authentication helper.
 * Verifies the current Supabase user's email against ADMIN_EMAILS env var.
 * Returns the user's profile if authorized, null otherwise.
 * Wrapped in React.cache() for per-request deduplication.
 */

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

async function _requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes(user.email?.toLowerCase() || '')) return null;

  return prisma.profile.findUnique({ where: { userId: user.id } });
}

export const requireAdmin = cache(_requireAdmin);
