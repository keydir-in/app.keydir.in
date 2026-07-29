# Project Overview

## Purpose

KeyDir is the definitive community-maintained directory of mechanical keyboards, switches, keycaps, vendors, and desk peripherals available in India. It serves as a single, trusted source of truth for the Indian mechanical keyboard community.

## Vision

> Replace fragmented spreadsheets, scattered Reddit threads, and inconsistent vendor pages with one fast, searchable, unbiased directory.

### Core Principles

```mermaid
mindmap
  root((Core Principles))
    No Affiliate Links
      Unbiased pricing
      No ads
      Pure signal
    Community Driven
      User contributions
      Vote-based quality
      Peer verification
    India First
      INR pricing
      Indian vendors
      Local shipping context
    Proprietary
      Private codebase
      Invite-only contributions
      Commercial license
```

## User Roles

```mermaid
flowchart TD
    V["Visitor<br/>Browse, Search, Compare"]
    R["Registered User<br/>+ Vote, Wishlist, Collection"]
    C["Contributor<br/>+ Submit Products, Prices"]
    M["Moderator<br/>+ Review, Moderate"]
    A["Administrator<br/>+ Full CRUD, Settings"]

    V -->|"Register"| R
    R -->|"Contribute"| C
    C -->|"Trusted"| M
    M -->|"Elevated"| A

    style V fill:#1a1a2e,stroke:#e94560,color:#fff
    style R fill:#1a1a2e,stroke:#f5a623,color:#fff
    style C fill:#1a1a2e,stroke:#50e3c2,color:#fff
    style M fill:#1a1a2e,stroke:#0070f3,color:#fff
    style A fill:#1a1a2e,stroke:#ff0080,color:#fff
```

| Role | Capabilities |
|------|-------------|
| **Visitor** | Browse products, view specs, compare prices, search, view profiles |
| **Registered** | + Vote (up/down), add to wishlist/collection, edit profile |
| **Contributor** | + Submit new products, vendor listings, price updates |
| **Moderator** | + Review submissions, moderate votes, manage banners |
| **Administrator** | + Full CRUD, scraper management, system settings |

## Product Categories

```mermaid
pie title Product Distribution
    "Keyboards" : 35
    "Switches" : 30
    "Keycaps" : 20
    "Mouse" : 15
```

| Category | Page | Filters | Description |
|----------|------|---------|-------------|
| **Keyboards** | `/keyboards` | Layout, material, mount, connectivity, PCB | Full-size, TKL, 60%, split, ortho |
| **Switches** | `/switches` | Type, feel, spring, manufacturer | Linear, tactile, clicky |
| **Keycaps** | `/keycaps` | Profile, material, legend, language | Cherry, OEM, SA, MT3 |
| **Mouse** | `/mouse` | Connectivity, sensor, DPI, weight | Gaming, ergonomic, wireless |

## Key Features

### Price Comparison

```mermaid
sequenceDiagram
    User->>Product Page: View product
    Product Page->>Database: Fetch vendor prices
    Database-->>Product Page: VendorProduct list
    Product Page->>Product Page: Sort by effective price
    Product Page-->>User: Display price table
    Note over User: Lowest price highlighted in green
    Note over User: Coupons shown with 🏷 badge
```

### Voting System

```mermaid
stateDiagram-v2
    [*] --> NoVote
    NoVote --> Upvoted: Upvote
    NoVote --> Downvoted: Downvote
    Upvoted --> NoVote: Remove vote
    Downvoted --> NoVote: Remove vote
    Upvoted --> Downvoted: Switch vote
    Downvoted --> Upvoted: Switch vote

    Upvoted: ▲ Active (green)
    Downvoted: ▼ Active (red)
```

### Community Badges

| Badge | Condition | Display |
|-------|-----------|---------|
| **HIGHLY RECOMMENDED** | Approval > 90% AND upvotes ≥ 100 | 🏆 Green badge |
| **COMMUNITY FAVORITE** | Approval > 80% | ⭐ Blue badge |

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Products listed | 500+ | Database count |
| Vendors listed | 30+ | Database count |
| Monthly active users | 1,000+ | Analytics |
| Products with 3+ vendor prices | 60% | Database query |
| Average page load time | < 2s | Lighthouse |
| Community votes per month | 500+ | Database count |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| E-commerce / direct sales | Directory, not a store |
| Affiliate links | Conflicts with unbiased mission |
| Advertising | Conflicts with unbiased mission |
| International vendor coverage | India-first focus |
| User-to-user marketplace | Out of scope |

## Related Documents

- [Architecture](ARCHITECTURE.md) — System design and data flow
- [Database](DATABASE.md) — Schema and relationships
- [Security](SECURITY.md) — Authentication and authorization
- [Changelog](CHANGELOG.md) — Release history
