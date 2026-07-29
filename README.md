<div align="center">

# ⌨ KeyDir

### The Definitive Indian Mechanical Keyboard Directory

Compare prices from multiple Indian vendors · View price history · Find the best deals

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3FCF8E?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)](https://vercel.com)

---

**[app.keydir.in](https://app.keydir.in)** · **[Documentation](docs/)** · **[Architecture](docs/ARCHITECTURE.md)** · **[API Reference](docs/API/)**

---

</div>

## Overview

KeyDir is a community-maintained directory of mechanical keyboards, switches, keycaps, vendors, and desk peripherals available in India. It replaces fragmented spreadsheets, scattered Reddit threads, and inconsistent vendor pages with one fast, searchable, unbiased directory.

> **No affiliate links. No ads. Pure signal.**

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Product Directory** | Browse keyboards, switches, keycaps, and mouse products with rich filtering |
| **Price Comparison** | Compare prices across 30+ Indian vendors with effective price calculation |
| **Price History Charts** | Interactive SVG charts with configurable time ranges (30d / 3m / 6m / 1y / all) |
| **Spec Comparison** | Side-by-side product specification comparison across categories |
| **Voting System** | Community upvote/downvote with approval ratings and badges |
| **Global Search** | Real-time search across products, vendors, and brands |
| **Category Filters** | Dynamic multi-select filters for each product category |
| **Vendor Management** | Full vendor CRUD with enable/disable and scraper configuration |
| **Banner System** | Promotional banners with scheduling, targeting, and priority |
| **Admin Dashboard** | System overview, KPIs, activity feed, and scraper metrics |
| **Authentication** | Email/password, Google OAuth, and Discord OAuth |
| **User Profiles** | Collections, wishlists, voting history, XP, and rank system |
| **Automated Scraping** | Cron-based price scraping with Cheerio and Playwright engines |

### Technical Features

| Feature | Description |
|---------|-------------|
| **Server-Side Rendering** | Next.js 16 App Router with Server Components by default |
| **Proxy (Middleware)** | Node.js runtime proxy for session refresh and admin route protection |
| **Image Optimization** | Cloudinary auto-format, lazy loading, and responsive images |
| **Responsive Design** | Mobile-first cyberpunk-industrial aesthetic |
| **Dark/Light Theme** | Theme provider with CSS variables and system preference detection |
| **SEO Optimization** | Dynamic metadata, OpenGraph tags, structured data (JSON-LD) |
| **Type Safety** | TypeScript strict mode with Prisma-generated types |
| **Input Validation** | Zod schemas for all server action inputs |

## Screenshots

| Homepage | Product Detail | Price Comparison |
|----------|---------------|------------------|
| ![Homepage](docs/assets/screenshots/homepage.png) | ![Product](docs/assets/screenshots/product.png) | ![Compare](docs/assets/screenshots/compare.png) |

| Admin Dashboard | Filter Panel | Price History |
|----------------|-------------|---------------|
| ![Admin](docs/assets/screenshots/admin.png) | ![Filters](docs/assets/screenshots/filters.png) | ![Chart](docs/assets/screenshots/chart.png) |

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16 | React framework with App Router |
| **Language** | TypeScript | 5.x | Type-safe development |
| **UI** | React | 19 | Component library |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Database** | PostgreSQL | 17 | Data storage (via Supabase) |
| **ORM** | Prisma | 7.x | Type-safe database access |
| **Auth** | Supabase Auth | — | Authentication & session management |
| **Images** | Cloudinary | — | Image hosting, optimization, CDN |
| **Scraping** | Cheerio + Playwright | — | Automated price data collection |
| **Charts** | Recharts | 3.x | SVG price history charts |
| **Icons** | Lucide React | — | UI icon set |
| **Deployment** | Vercel | — | Hosting, serverless functions, cron |
| **Runtime** | Node.js | 20+ | Server runtime |

## Architecture

```
┌──────────────┐     ┌─────────────────────────────────────┐
│   Browser    │────▶│         Vercel (Next.js 16)          │
└──────────────┘     │  ┌───────────┐  ┌─────────────────┐ │
                     │  │  Proxy    │─▶│  Server          │ │
                     │  │  (Auth)   │  │  Components      │ │
                     │  └───────────┘  └─────────────────┘ │
                     │  ┌───────────┐  ┌─────────────────┐ │
                     │  │  API      │─▶│  Server Actions  │ │
                     │  │  Routes   │  │  (Mutations)     │ │
                     │  └───────────┘  └─────────────────┘ │
                     └──────────┬──────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌────────────┐       ┌──────────────┐      ┌──────────┐
   │  Supabase  │       │   Prisma 7   │      │Cloudinary│
   │  Auth      │       │   ORM        │      │  Images  │
   └────────────┘       └──────┬───────┘      └──────────┘
                               │
                        ┌──────▼───────┐
                        │  PostgreSQL  │
                        │   (Supabase) │
                        └──────────────┘
```

For detailed architecture diagrams, see [Architecture](docs/ARCHITECTURE.md).

## Folder Structure

```
app.keydir.in/
├── prisma/                  # Database schema and seed
│   ├── schema.prisma        # Prisma schema (all models)
│   └── seed.ts              # Database seed script
├── src/
│   ├── proxy.ts             # Next.js 16 proxy (auth guard)
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── api/             # API route handlers
│   │   ├── auth/            # Authentication pages
│   │   ├── keyboards/       # Keyboard catalog
│   │   ├── switches/        # Switch catalog
│   │   ├── keycaps/         # Keycap catalog
│   │   ├── mouse/           # Mouse catalog
│   │   ├── products/        # Product detail pages
│   │   ├── compare/         # Comparison tool
│   │   ├── profile/         # User profiles
│   │   └── settings/        # User settings
│   ├── components/          # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── product/         # Product display components
│   │   ├── compare/         # Comparison components
│   │   ├── banner/          # Banner display components
│   │   ├── auth/            # Authentication components
│   │   ├── profile/         # Profile components
│   │   ├── ui/              # Base UI primitives
│   │   ├── layout/          # Layout components (navbar, footer)
│   │   └── shared/          # Shared utility components
│   ├── lib/                 # Server-side logic
│   │   ├── admin/           # Admin server actions
│   │   ├── services/        # Business logic services
│   │   ├── repositories/    # Data access layer
│   │   ├── scraper/         # Scraper engine
│   │   ├── chart/           # Chart math utilities
│   │   ├── supabase/        # Supabase client factories
│   │   ├── prisma.ts        # Prisma singleton
│   │   └── utils.ts         # Shared utilities
│   ├── domain/              # Domain layer
│   │   └── specs/           # Category spec configurations
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── docs/                    # Project documentation
├── .env.example             # Environment variable template
├── next.config.ts           # Next.js configuration
├── vercel.json              # Vercel deployment config
└── package.json             # Dependencies and scripts
```

## Installation

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 9+
- **PostgreSQL** 17 (via Supabase)
- **Git**

### Clone and Install

```bash
git clone https://github.com/your-org/app.keydir.in.git
cd app.keydir.in
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string from Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_APP_URL` | Application URL (`http://localhost:3000` in dev) |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

See [.env.example](.env.example) for all available variables.

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Seed the database with initial data
npx prisma db seed

# (Optional) View the database in Prisma Studio
npx prisma studio
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Enable auth providers: **Email/Password**, **Google**, **Discord**
3. Configure OAuth redirect URLs to `http://localhost:3000/auth/callback`
4. Copy project URL and anon key to `.env`

### Cloudinary Setup

1. Create an account at [cloudinary.com](https://cloudinary.com)
2. Copy cloud name, API key, and API secret to `.env`
3. Configure upload presets for product and banner images

### OAuth Configuration

For Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://glhjiluliwhfolmaansj.supabase.co/auth/v1/callback`

For Discord OAuth:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create an application and enable OAuth2
3. Add redirect URI: `https://glhjiluliwhfolmaansj.supabase.co/auth/v1/callback`

## Running Locally

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint across the codebase |

### Build Commands

```bash
# Type-check the codebase
npx tsc --noEmit

# Production build
npm run build

# Preview production build locally
npm start
```

## Deployment

KeyDir deploys to Vercel with automatic deployments from the `main` branch.

### Quick Deploy

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables (all from `.env`)
4. Deploy

### Post-Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Cloudinary upload presets configured
- [ ] Auth providers enabled (Google, Discord) with production redirect URIs
- [ ] Custom domain configured with SSL
- [ ] Cron job running (`/api/cron/update-prices` every 6h)
- [ ] Admin emails added to `ADMIN_EMAILS`

For detailed deployment instructions, see [Deployment Guide](docs/DEPLOYMENT/).

## Troubleshooting

### Build Failures

| Symptom | Solution |
|---------|----------|
| TypeScript errors | Run `npx tsc --noEmit` locally and fix errors |
| Prisma client not found | Run `npx prisma generate` |
| Module not found | Run `npm install` to reinstall dependencies |
| Edge runtime error | Ensure proxy uses Node.js runtime (default in Next.js 16) |

### Database Issues

| Symptom | Solution |
|---------|----------|
| Migrations pending | Run `npx prisma migrate dev` |
| Seed data missing | Run `npx prisma db seed` |
| Connection refused | Check `DATABASE_URL` in `.env` and IP allowlist in Supabase |

### Auth Issues

| Symptom | Solution |
|---------|----------|
| OAuth callback fails | Check redirect URIs in Supabase Auth provider settings |
| Session not persisted | Ensure cookies are properly configured in `proxy.ts` |
| Login redirect loop | Clear browser cookies and try again |

### Scraper Issues

| Symptom | Solution |
|---------|----------|
| Scraper returns no data | Check vendor URL and CSS selectors in vendor config |
| Playwright times out | Navigate to vendor site manually to check if it requires JS |
| Price looks wrong | Mark as NEEDS_REVIEW and manually verify |

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, deployment architecture |
| [Database](docs/DATABASE.md) | Schema, ER diagram, relationships, constraints |
| [Security](docs/SECURITY.md) | Authentication, authorization, RLS, best practices |
| [API Reference](docs/API/) | Endpoints, server actions, data contracts |
| [Deployment](docs/DEPLOYMENT/) | Vercel, Supabase, Cloudinary, domain setup |
| [Development](docs/DEVELOPMENT/) | Components, hooks, contexts, patterns |
| [Admin](docs/ADMIN/) | Dashboard, product editor, scraper operations |
| [Customer](docs/CUSTOMER/) | Browse, compare, profile, search |
| [Maintenance](docs/MAINTENANCE.md) | Updates, migrations, caching, troubleshooting |
| [Contributing](docs/CONTRIBUTING.md) | Internal contribution guidelines |
| [Project Overview](docs/PROJECT_OVERVIEW.md) | Vision, features, roadmap |
| [Changelog](docs/CHANGELOG.md) | Release history |

## License

All rights reserved. See [LICENSE](./LICENSE) for details.
