# Customer Documentation

## Purpose

This document covers the customer-facing features: browsing, comparing, searching, profiles, and authentication.

## User Journey

```mermaid
flowchart TD
    Visit["Visit KeyDir"] --> Browse["Browse Categories"]
    Browse --> KB["Keyboards"]
    Browse --> SW["Switches"]
    Browse --> KC["Keycaps"]
    Browse --> MS["Mouse"]

    KB --> Filter["Apply Filters"]
    Filter --> Sort["Sort Results"]
    Sort --> Product["View Product"]

    Product --> Specs["View Specs"]
    Product --> Prices["Compare Prices"]
    Product --> History["View Price History"]
    Product --> Vote["Upvote/Downvote"]
    Product --> Compare["Add to Compare"]
    Product --> Vendor["Visit Vendor"]

    Compare --> ComparePage["Compare Page<br/>Side-by-side"]

    Vote --> Profile["User Profile"]
    Profile --> Collection["My Collection"]
    Profile --> Wishlist["My Wishlist"]
    Profile --> History2["Vote History"]

    style Visit fill:#0070f3,color:#fff
    style Browse fill:#50e3c2,color:#000
    style Product fill:#f5a623,color:#000
    style Profile fill:#e94560,color:#fff
```

## Browsing Products

### Category Pages

Each category has a dedicated page with filtering and sorting:

| Category | URL | Default Sort |
|----------|-----|--------------|
| Keyboards | `/keyboards` | Most Upvoted |
| Switches | `/switches` | Most Upvoted |
| Keycaps | `/keycaps` | Most Upvoted |
| Mouse | `/mouse` | Most Upvoted |

### Filter System

```mermaid
flowchart LR
    FilterBtn["Filter Button"] --> Panel["Filter Panel"]
    Panel --> Checkboxes["Checkbox Groups<br/>Layout, Material, etc."]
    Panel --> PriceRange["Price Range<br/>Min / Max sliders"]
    Panel --> Apply["Apply Button"]
    Panel --> Reset["Reset Button"]

    Apply --> URL["Update URL Params"]
    URL --> Fetch["Fetch Products"]
    Fetch --> Display["Display Results"]

    style Panel fill:#1a1a2e,stroke:#f5a623,color:#fff
```

### Sort Options

| Option | Value | Description |
|--------|-------|-------------|
| Lowest Price | `lowest` | Cheapest first |
| Highest Price | `highest` | Most expensive first |
| Newest | `newest` | Recently added first |
| Most Upvoted | `popular` | Highest vote count first |
| Most Vendors | `vendors` | Most vendor listings first |

### Product Card

Each product card displays:
- Product image
- Product name
- Brand name
- Lowest price (with coupon badge if applicable)
- Upvote count
- Vendor count

## Product Detail Page

```mermaid
flowchart TD
    Product["Product Page"] --> Hero["Hero Section<br/>Image + Name + Brand"]
    Product --> HeroSpecs["Hero Specs<br/>Key specs at a glance"]
    Product --> Description["Description"]
    Product --> VendorCards["Vendor Cards<br/>Price comparison"]
    Product --> PriceChart["Price History Chart<br/>SVG interactive"]
    Product --> Specs["Full Specifications<br/>Grouped by category"]
    Product --> VoteSection["Voting Section<br/>Upvote/Downvote"]

    VendorCards --> Lowest["Lowest Price<br/>Green highlight"]
    VendorCards --> Coupons["Coupons<br/>Discount badges"]
    VendorCards --> Variants["Variants<br/>Color/switch options"]
    VendorCards --> Buy["Buy Now<br/>External link"]

    PriceChart --> TimeRange["Time Range<br/>30D / 3M / 6M / 1Y / ALL"]
    PriceChart --> Tooltip["Tooltip<br/>Hover for details"]
    PriceChart --> Legend["Legend<br/>Vendor colors"]

    style Product fill:#0a0a0a,stroke:#0070f3,color:#fff
    style VendorCards fill:#1a1a2e,stroke:#50e3c2,color:#fff
    style PriceChart fill:#1a1a2e,stroke:#f5a623,color:#fff
```

### Vendor Cards

Each vendor card shows:
- Vendor name
- Price (with original price strikethrough if discounted)
- Shipping cost or "Free Shipping"
- Stock status badge
- Best coupon code and discount
- Variant options (if available)
- "Buy Now" button (links to vendor)

### Price History Chart

Interactive SVG chart with:
- **Time ranges:** 30 days, 3 months, 6 months, 1 year, All
- **Crosshair tooltip:** Hover to see exact price/date/vendor
- **Multi-vendor lines:** Each vendor gets a unique color
- **Area fill:** Semi-transparent area under each line

## Comparison Tool

```mermaid
flowchart TD
    AddCompare["Add to Compare<br/>(on product card)"] --> Tray["Compare Tray<br/>Bottom of screen"]
    Tray --> Go["Go to Compare"]
    Go --> ComparePage["/compare/[category]"]

    ComparePage --> Header["Product Headers<br/>Images + Names"]
    ComparePage --> SpecTable["Spec Comparison Table<br/>Side-by-side rows"]
    ComparePage --> Highlight["Same/Different<br/>Highlighting"]

    SpecTable --> Same["Same Values<br/>Grayed out"]
    SpecTable --> Diff["Different Values<br/>Highlighted"]

    style ComparePage fill:#0a0a0a,stroke:#0070f3,color:#fff
    style SpecTable fill:#1a1a2e,stroke:#50e3c2,color:#fff
```

### Compare Rules

- Maximum 4 products per comparison
- All products must be in the same category
- Clear the tray to switch categories

## Search

```mermaid
flowchart LR
    SearchBar["Search Bar<br/>(in navbar)"] --> Input["Type query<br/>(min 2 chars)"]
    Input --> Debounce["Debounce<br/>(300ms)"]
    Debounce --> API["GET /api/search"]
    API --> Results["Dropdown Results"]
    Results --> Products["Products<br/>(max 8)"]
    Results --> Vendors["Vendors<br/>(max 5)"]
    Results --> Brands["Brands<br/>(max 5)"]

    style SearchBar fill:#1a1a2e,stroke:#f5a623,color:#fff
```

### Search Features

- Minimum 2 characters
- Debounced (300ms)
- Searches product names, vendor names, brand names
- Results grouped by type
- Click result to navigate

## User Profile

```mermaid
flowchart TD
    Profile["/profile/[username]"] --> Avatar["Avatar<br/>(identicon)"]
    Profile --> Stats["Stats<br/>Rank, XP, votes"]
    Profile --> Tabs["Tabs"]

    Tabs --> CollectionTab["Collection<br/>Products I own"]
    Tabs --> WishlistTab["Wishlist<br/>Products I want"]
    Tabs --> VotesTab["Votes<br/>My voting history"]

    Stats --> Rank["Rank<br/>Newbie → Elite"]
    Stats --> XP["XP<br/>Experience points"]
    Stats --> Credits["Vote Credits<br/>25 default"]

    style Profile fill:#0a0a0a,stroke:#0070f3,color:#fff
    style Tabs fill:#1a1a2e,stroke:#50e3c2,color:#fff
```

### Rank System

| Rank | XP Required | Badge |
|------|------------|-------|
| Newbie | 0 | 🌱 |
| Member | 100 | 👤 |
| Contributor | 500 | ⭐ |
| Expert | 1000 | 🏆 |
| Elite | 5000 | 👑 |

## Authentication

```mermaid
flowchart TD
    Login["/auth/login"] --> Email["Email + Password"]
    Login --> Google["Sign in with Google"]
    Login --> Discord["Sign in with Discord"]

    Email --> Supabase["Supabase Auth"]
    Google --> Supabase
    Discord --> Supabase

    Supabase --> Session["Session Cookie"]
    Session --> Profile["Auto-create Profile"]
    Profile --> Home["Redirect to /"]

    Register["/auth/register"] --> CreateAccount["Create Account"]
    CreateAccount --> Verify["Email Verification"]
    Verify --> Login

    Forgot["/auth/forgot-password"] --> ResetEmail["Reset Email"]
    ResetEmail --> NewPassword["New Password"]
    NewPassword --> Login

    style Login fill:#0070f3,color:#fff
    style Register fill:#50e3c2,color:#000
    style Forgot fill:#f5a623,color:#000
```

### Auth Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/auth/login` | Sign in with email/password or OAuth |
| Register | `/auth/register` | Create new account |
| Forgot Password | `/auth/forgot-password` | Request password reset |
| Verify Email | `/auth/verify-email` | Email verification confirmation |
| Account Created | `/auth/account-created` | Post-registration confirmation |

## Voting System

### How Voting Works

1. Click ▲ to upvote or ▼ to downvote
2. Click same vote to remove it
3. Click opposite vote to switch
4. Approval rating shown when total votes ≥ 10

### Community Badges

| Badge | Condition | Display |
|-------|-----------|---------|
| HIGHLY RECOMMENDED | Approval > 90% AND upvotes ≥ 100 | 🏆 Green |
| COMMUNITY FAVORITE | Approval > 80% | ⭐ Blue |

## Related Documents

- [Architecture](../ARCHITECTURE.md) — Data flow diagrams
- [API Reference](../API/) — Search and product endpoints
- [Database](../DATABASE.md) — Data models
