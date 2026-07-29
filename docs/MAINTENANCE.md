# Maintenance Guide

## Purpose

This document covers routine maintenance tasks for the KeyDir application: dependency updates, database migrations, data management, caching, and troubleshooting common issues.

## Updating Dependencies

### Regular Updates

```bash
# Check for outdated packages
npm outdated

# Update all minor/patch versions
npm update

# Update a specific package
npm install package-name@latest

# After updating, run type check and lint
npx tsc --noEmit
npm run lint
```

### Major Version Updates

1. Check the package's changelog for breaking changes
2. Update the package: `npm install package-name@latest`
3. Run full build: `npm run build`
4. Test all functionality manually

### Prisma Updates

```bash
# Update Prisma CLI and client together
npm install prisma@latest @prisma/client@latest

# Regenerate client
npx prisma generate

# Run any new migrations
npx prisma migrate dev
```

## Running Prisma Migrations

### Development

```bash
# Create a new migration after schema changes
npx prisma migrate dev --name description_of_change

# Reset database (drops all data and re-runs all migrations)
npx prisma migrate reset

# Apply pending migrations
npx prisma migrate dev
```

### Production

```bash
# Deploy migrations to production database
npx prisma migrate deploy

# If migration fails:
npx prisma migrate resolve --rolled-back migration_name
# Fix the migration file locally, then redeploy
```

## Regenerating Prisma Client

```bash
# Regenerate client after pulling schema changes
npx prisma generate

# This is also run automatically on postinstall
```

## Updating Product Data

### Manual Updates (Admin Panel)

1. Navigate to `/admin/products`
2. Search for the product
3. Click to edit
4. Update fields as needed
5. Click Save

### Bulk Updates

Product data is managed through the admin panel's individual product editor. There is no batch update interface. For bulk operations:

1. Use Prisma Studio: `npx prisma studio`
2. Query and edit directly in the GUI
3. Export/import via SQL if needed (requires direct database access)

## Running Scrapers

### Automated (Production)

The scraper runs automatically every 6 hours via Vercel Cron at `30 21 * * *` (9:30 PM UTC).

### Manual Triggers (Admin Panel)

| Action | Location | Description |
|--------|----------|-------------|
| Run All | `/admin/scraper` → Run All | Scrapes all enabled vendor products |
| Run Failed | `/admin/scraper` → Run Failed | Re-scrapes products with FAILED status |
| Per Vendor | `/admin/vendor/[id]` → Run Scraper | Scrapes one vendor's products |
| Per Product | `/admin/product/[id]` → Run Scraper | Scrapes one product listing |

### Manual Trigger (API)

```bash
curl -X GET https://app.keydir.in/api/cron/update-prices \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Scraper Statuses

| Status | Meaning | Next Step |
|--------|---------|-----------|
| `SUCCESS` | Price updated successfully | None |
| `FAILED` | Scraper could not fetch/parse | Check log, fix selectors, re-run |
| `NEEDS_REVIEW` | Price change > 50% from last | Review in admin panel, approve or reject |
| `PENDING` | Not yet scraped | Will be picked up on next run |

## Clearing Caches

### Next.js Build Cache

```bash
# Clear Turbopack cache (development)
rm -rf .next

# Rebuild
npm run build
```

### Browser Cache

If changes aren't reflecting:

1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear site data in browser dev tools
3. Use an incognito/private window

### Vercel Cache

Vercel caches builds. To bypass:

1. Go to Vercel Dashboard → Deployments
2. Click the three dots on the latest deployment
3. Select "Redeploy" (this skips cache)

## Troubleshooting Build Failures

### TypeScript Errors

```bash
# Run type checker
npx tsc --noEmit

# Common fixes:
# - Missing type: add proper type annotation
# - any type: replace with proper type
# - Import error: check path and export
```

### Prisma Client Errors

```bash
# Prisma client not found
npx prisma generate

# Schema validation errors
npx prisma validate

# Migration conflicts
npx prisma migrate resolve
```

### Module Resolution Errors

```bash
# Node.js version mismatch
node --version  # Should be 20+

# Missing dependencies
npm install

# Turbopack / Edge Runtime errors
# Ensure proxy uses Node.js runtime (default in Next.js 16)
# Remove 'export const runtime = "edge"' from proxy.ts
```

### Database Connection Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `connect ECONNREFUSED` | Database server not reachable | Check IP allowlist in Supabase |
| `password authentication failed` | Wrong password | Regenerate database password |
| `too many connections` | Connection pool exhausted | Check Prisma connection limit config |
| `relation does not exist` | Migrations not applied | Run `npx prisma migrate deploy` |

### Build Performance Issues

```bash
# Slow builds: check for large dependencies
npm ls --depth=0

# Verify serverExternalPackages in next.config.ts
# (playwright, cheerio should be external)
```

## Monitoring

### Error Tracking

- Check Vercel Dashboard → Functions → Logs for server errors
- Check browser console for client-side errors
- Monitor Supabase Dashboard for database errors

### Health Checks

| Check | How | Frequency |
|-------|-----|-----------|
| Page load | Visit homepage and a product page | Daily |
| Auth flow | Test login and protected routes | Weekly |
| Search | Verify search returns results | Weekly |
| Scraper | Check scraper logs for failures | Daily |
| Database | Check connection pool usage | Weekly |
| Images | Verify Cloudinary images load | Monthly |
