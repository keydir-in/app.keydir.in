# Changelog

## Purpose

This document tracks all notable changes to the KeyDir project, following [Keep a Changelog](https://keepachangelog.com/) format.

## [Unreleased]

### Added
- `AdminPageHeader` UI primitive for consistent admin page headers
- `SpecEngine` generic spec form renderer from `CATEGORY_SPECS` config
- `useCatalogFilters` hook for filter state management
- `useProductListing` hook for product fetching and pagination
- `useDirtyForm` hook for form dirty state tracking
- `useProductVote` hook for vote state management
- `product-repository.ts` with detail, compare, and user data queries
- `vendor-repository.ts` with vendor stats and scraper operations
- Domain layer (`src/domain/specs/category-specs.ts`) for spec configurations
- `CATEGORY_SPECS` moved to domain layer with re-export shim

### Changed
- `CompareProduct` renamed to `CompareTrayItem` in compare store
- `any` type eliminated in `spec-actions.ts` via `SpecDelegate` interface
- `getBestCoupon` moved to `utils.ts` (client-safe)
- `category-content.tsx` rewritten to use `useCatalogFilters` + `useProductListing`
- `vendor-card.tsx` now uses `getBestCoupon` for coupon display
- Admin list pages (vendors, brands, products) use `AdminPageHeader`
- `globals.css` split into 8 domain-specific CSS files

### Documentation
- `README.md` rewritten with comprehensive project overview, features, architecture, and setup guide
- `.env.example` cleaned up: removed unused `SUPABASE_SERVICE_ROLE_KEY`, added detailed comments
- `docs/CONTRIBUTING.md` created with coding conventions and contribution workflow
- `docs/MAINTENANCE.md` created with database, scraper, caching, and troubleshooting guides
- `docs/API/README.md` expanded with all 13 API routes, request/response specs, auth requirements
- `docs/ARCHITECTURE.md` updated: `middleware` references renamed to `proxy`
- `docs/SECURITY.md` updated: `middleware` references renamed to `proxy`
- `docs/DEVELOPMENT/README.md` updated: removed references to non-existent `Rules.md`
- `docs/DEPLOYMENT/README.md` updated: cron schedule corrected to `30 21 * * *` (daily)
- `LICENSE` created: proprietary, all rights reserved
- `docs/CONTRIBUTING.md` revised: removed public-facing language, restricted to invited contributors
- `docs/PROJECT_OVERVIEW.md` updated: replaced Open Source principle with Proprietary

### Removed
- `VendorHeader` component (merged into `AdminHeader`)
- Duplicate `SpecModel` type (replaced with `SpecDelegate`)
- `middleware.ts` and `middleware.ts.bak` (replaced by `proxy.ts`)
- References to non-existent `docs/Rules.md` and `LICENSE`

---

## [0.1.0] — 2026-07-14

### Added
- Initial release of KeyDir
- Product browsing with category pages (keyboards, switches, keycaps, mouse)
- Price comparison across Indian vendors
- Price history charts with SVG rendering
- Voting system (upvote/downvote)
- Global search (products, vendors, brands)
- Admin dashboard with KPIs
- Product CRUD with spec forms
- Vendor management with scraper config
- Brand management
- Banner system with scheduling
- User profiles with collections and wishlists
- Authentication (email/password, Google, Discord OAuth)
- Cloudinary image hosting
- Automated price scraping cron job
- Responsive cyberpunk-industrial design
- Dark/light theme support
- SEO optimization with dynamic metadata

---

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| 0.1.0 | 2026-07-14 | Initial release |
| Unreleased | — | Codebase refactor, new hooks, domain layer |
