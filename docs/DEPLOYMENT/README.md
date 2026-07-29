# Deployment Guide

## Purpose

This document covers deploying KeyDir to production, including Vercel, Supabase, Cloudinary, and domain setup.

## Deployment Architecture

```mermaid
flowchart LR
    Git["Git Push"] --> GitHub["GitHub"]
    GitHub --> Vercel["Vercel<br/>Auto Deploy"]
    Vercel --> Edge["Edge Network<br/>Global CDN"]
    Vercel --> Serverless["Serverless<br/>Functions"]
    Vercel --> Cron["Cron Scheduler<br/>Daily at 9:30 PM UTC"]

    Serverless --> Supabase["Supabase<br/>PostgreSQL + Auth"]
    Serverless --> Cloudinary["Cloudinary<br/>Image CDN"]
    Cron --> Scraper["Scraper<br/>Vendor Sites"]
    Scraper --> Supabase

    style Git fill:#f05033,color:#fff
    style GitHub fill:#24292e,color:#fff
    style Vercel fill:#000,color:#fff
    style Supabase fill:#3ecf8e,color:#000
    style Cloudinary fill:#3448c5,color:#fff
```

## Prerequisites

- Vercel account
- Supabase project
- Cloudinary account
- GitHub repository

## Vercel Setup

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New > Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### 3. Environment Variables

Set these in **Settings > Environment Variables**:

| Variable | Environment | Description |
|----------|------------|-------------|
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Production | `https://app.keydir.in` |
| `ADMIN_EMAILS` | Production | Comma-separated admin emails |
| `CLOUDINARY_CLOUD_NAME` | Production | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Production | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Production | Cloudinary API secret |
| `CRON_SECRET` | Production | Random secret for cron jobs |
| `DELETE_PASSWORD` | Production | Password for product deletion |

### 4. Deploy

Push to `main` triggers production deployment.
Push to other branches creates preview deployments.

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note the project URL and keys

### 2. Configure Auth Providers

1. Go to **Authentication > Providers**
2. Enable **Email/Password**
3. Enable **Google OAuth** (optional)
4. Enable **Discord OAuth** (optional)

### 3. Database Migrations

```bash
# Run migrations on production
npx prisma migrate deploy

# Seed initial data (if needed)
npx prisma db seed
```

### 4. Connection Pooling

Use Supabase's built-in connection pooling:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true
```

## Cloudinary Setup

### 1. Create Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Create an account
3. Note cloud name, API key, and API secret

### 2. Upload Presets

Configure upload presets for:
- Product images (max 5MB)
- Banner images (max 10MB)
- User avatars (max 2MB)

### 3. Domain Allowlist

Add your Vercel domain to Cloudinary's allowed domains for image optimization.

## Cron Jobs

### Price Update Job

```mermaid
flowchart TD
    Vercel["Vercel Cron<br/>30 21 * * *"] --> API["GET /api/cron/update-prices"]
    API --> Auth{"Verify Bearer<br/>CRON_SECRET"}
    Auth -->|"Valid"| Fetch["Fetch 100 VendorProducts<br/>(oldest checked first)"]
    Fetch --> Loop["For each: scrape, log, update"]
    Loop --> Summary["Return JSON summary"]
    Auth -->|"Invalid"| Reject["401 Unauthorized"]

    style Vercel fill:#000,color:#fff
    style API fill:#0070f3,color:#fff
    style Fetch fill:#50e3c2,color:#000
```

### vercel.json Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/update-prices",
      "schedule": "30 21 * * *"
    }
  ]
}
```

### Manual Trigger

```bash
curl -X GET https://app.keydir.in/api/cron/update-prices \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Custom Domain

1. In Vercel, go to **Settings > Domains**
2. Add your custom domain
3. Configure DNS records as shown
4. SSL is automatic

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Cloudinary configured with upload presets
- [ ] Auth providers enabled (Google, Discord)
- [ ] Custom domain configured with SSL
- [ ] Cron job running (`/api/cron/update-prices`)
- [ ] Admin emails added to `ADMIN_EMAILS`
- [ ] Error monitoring set up

## Rollback

If issues occur:

1. **Vercel:** Go to **Deployments** and promote a previous deployment
2. **Database:** Run `npx prisma migrate resolve --rolled-back MIGRATION_NAME`
3. **Code:** Revert commits and push

## Related Documents

- [Security](../SECURITY.md) — Environment variable security
- [Architecture](../ARCHITECTURE.md) — Deployment architecture diagram
