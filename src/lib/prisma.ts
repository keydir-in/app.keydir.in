/**
 * Singleton Prisma client with PostgreSQL adapter.
 * Caches the client on globalThis in development to avoid exhausting
 * connections during hot-reload. Exports `prisma` for direct use.
 * Pool size defaults to 1 to stay within Supabase pooler limits
 * during parallel build workers (11 workers × 1 = 11 ≤ 15 pooler limit).
 * Override with PRISMA_POOL_MAX env var for higher runtime concurrency.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const poolMax = Math.max(1, parseInt(process.env.PRISMA_POOL_MAX || '1', 10));
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: poolMax,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
