import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    // Migrations must not run through the transaction pooler (port 6543,
    // pgbouncer=true) — Prisma hangs on it. Point DATABASE_URL at the session
    // pooler/direct URL when running migrate commands (see run-migration.sh).
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: `npx tsx ${path.join(__dirname, 'prisma', 'seed.ts')}`,
  },
});
