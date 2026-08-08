# Architecture

## Purpose

This document describes the high-level system architecture of KeyDir, including the Next.js App Router structure, data flow, authentication, and deployment architecture.

## System Architecture

```mermaid
flowchart TB
    subgraph Client["🖥 Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile Browser"]
    end

    subgraph Edge["☁ Vercel Edge Network"]
        Proxy["Proxy<br/>Session Refresh + Admin Guard"]
        NextJS["Next.js 16<br/>App Router"]
    end

    subgraph Server["⚙ Server Layer"]
        SC["Server Components<br/>(Default)"]
        CC["Client Components<br/>(Interactive)"]
        SA["Server Actions<br/>(Mutations)"]
        API["API Routes<br/>(Data Fetching)"]
    end

    subgraph Services["🔧 Services Layer"]
        Auth["Supabase Auth<br/>JWT + Cookies"]
        Scraper["Scraper Engine<br/>Cheerio + Playwright"]
        Image["Image Service<br/>Cloudinary SDK"]
        Pricing["Pricing Service<br/>Effective Price Calc"]
        Product["Product Service<br/>Listing + Filter Logic"]
    end

    subgraph Data["💾 Data Layer"]
        Prisma["Prisma 7 ORM<br/>Type-safe Queries"]
        PG["PostgreSQL 17<br/>via Supabase"]
    end

    subgraph External["🌐 External Services"]
        Supabase["Supabase<br/>Auth + Database"]
        Cloudinary["Cloudinary<br/>Image CDN"]
        Vendors["Vendor Websites<br/>Scraped by Scraper"]
    end

    Browser --> HTTPS
    Mobile --> HTTPS
    HTTPS["HTTPS"] --> Proxy
    Proxy --> NextJS
    NextJS --> SC
    NextJS --> CC
    NextJS --> SA
    NextJS --> API

    SC --> Prisma
    SA --> Prisma
    API --> Prisma
    SA --> Auth
    API --> Scraper
    API --> Image
    SA --> Pricing
    SC --> Product

    Prisma --> PG
    Auth --> Supabase
    Image --> Cloudinary
    Scraper --> Vendors
    PG --> Supabase

    style Client fill:#1a1a2e,stroke:#e94560,color:#fff
    style Edge fill:#0a0a0a,stroke:#0070f3,color:#fff
    style Server fill:#1a1a2e,stroke:#f5a623,color:#fff
    style Services fill:#1a1a2e,stroke:#50e3c2,color:#fff
    style Data fill:#1a1a2e,stroke:#3ecf8e,color:#fff
    style External fill:#1a1a2e,stroke:#ff0080,color:#fff
```

## Next.js App Router Structure

### Route Groups

```mermaid
flowchart LR
    subgraph Public["Public Routes"]
        Home["/ (Homepage)"]
        KB["/keyboards"]
        SW["/switches"]
        KC["/keycaps"]
        MS["/mouse"]
        Prod["/products/[slug]"]
        Cmp["/compare/[category]"]
        Prof["/profile/[username]"]
    end

    subgraph Auth["Auth Routes"]
        Login["/auth/login"]
        Register["/auth/register"]
        Forgot["/auth/forgot-password"]
        Callback["/auth/callback"]
    end

    subgraph Admin["Admin Routes"]
        Dash["/admin"]
        AdminProd["/admin/products"]
        AdminVen["/admin/vendors"]
        AdminBrand["/admin/brands"]
        AdminBanner["/admin/banners"]
        AdminUser["/admin/users"]
        AdminVote["/admin/votes"]
        AdminScraper["/admin/scraper"]
    end

    subgraph API["API Routes"]
        Search["/api/search"]
        Category["/api/[category]"]
        Filters["/api/[category]/filters"]
    end

    style Public fill:#1a1a2e,stroke:#50e3c2,color:#fff
    style Auth fill:#1a1a2e,stroke:#f5a623,color:#fff
    style Admin fill:#1a1a2e,stroke:#e94560,color:#fff
    style API fill:#1a1a2e,stroke:#0070f3,color:#fff
```

### Server vs Client Components

| Component Type | When to Use | Examples |
|---------------|-------------|----------|
| **Server Component** (default) | Data fetching, static content, SEO | Product pages, homepage, admin list pages |
| **Client Component** (`'use client'`) | Interactivity, state, browser APIs | Forms, filters, search bar, vote widget |
| **Server Action** (`'use server'`) | Data mutations (create/update/delete) | Product CRUD, vote, profile edit |
| **API Route** | Client-side data fetching | Product listings, search, filters |

```mermaid
flowchart TD
    Request["Incoming Request"] --> Proxy{"Proxy<br/>Auth Check"}
    Proxy -->|Public| Page["Page Component"]
    Proxy -->|Admin + Auth OK| AdminPage["Admin Page"]
    Proxy -->|Admin + No Auth| Redirect["Redirect to /auth/login"]
    Proxy -->|Admin + Not Admin| Home["Redirect to /"]

    Page --> SC["Server Component<br/>(Data Fetch)"]
    SC --> Prisma["Prisma Query"]
    Prisma --> DB["PostgreSQL"]
    DB --> SC
    SC --> HTML["Rendered HTML"]

    AdminPage --> SA["Server Actions"]
    SA --> Validate["Validate Input"]
    Validate --> Mutate["Database Mutation"]
    Mutate --> Revalidate["revalidatePath()"]

    style MW fill:#f5a623,color:#000
    style SC fill:#50e3c2,color:#000
    style SA fill:#0070f3,color:#fff
```

## Data Flow

### 1. Page Load (Server-Side)

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js Router
    participant SC as Server Component
    participant Prisma as Prisma ORM
    participant DB as PostgreSQL

    Browser->>NextJS: GET /keyboards
    NextJS->>SC: Render Server Component
    SC->>Prisma: findMany(products)
    Prisma->>DB: SELECT with JOINs
    DB-->>Prisma: Result set
    Prisma-->>SC: Typed data
    SC->>SC: Render JSX with data
    SC-->>Browser: HTML response
```

### 2. Client Interaction (Server Action)

```mermaid
sequenceDiagram
    participant User
    participant Client as Client Component
    participant SA as Server Action
    participant Prisma as Prisma
    participant DB as PostgreSQL

    User->>Client: Click Upvote
    Client->>SA: voteOnProduct(id, 'upvote')
    SA->>SA: Check auth (Supabase)
    SA->>Prisma: upsert vote
    Prisma->>DB: INSERT/UPDATE
    DB-->>Prisma: Result
    SA->>SA: revalidatePath()
    SA-->>Client: { success: true }
    Client->>Client: Refresh UI
```

### 3. Price Scraper (Cron Job)

```mermaid
sequenceDiagram
    participant Vercel as Vercel Cron
    participant API as /api/cron/update-prices
    participant Scraper as Scraper Engine
    participant Vendor as Vendor Website
    participant DB as PostgreSQL

    Vercel->>API: GET (every 6 hours)
    API->>API: Verify CRON_SECRET
    API->>DB: Fetch VendorProducts (oldest first)
    loop For each VendorProduct
        API->>Scraper: scrape(vendorUrl)
        Scraper->>Vendor: HTTP request
        Vendor-->>Scraper: HTML response
        Scraper->>Scraper: Parse price + availability
        Scraper-->>API: ScrapeResult
        alt Price valid
            API->>DB: Update VendorProduct + PriceHistory
        else Suspicious change
            API->>DB: Mark as NEEDS_REVIEW
        else Failed
            API->>DB: Record ScrapeLog (FAILED)
        end
    end
    API-->>Vercel: JSON summary
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Login as Login Page
    participant Supabase as Supabase Auth
    participant Proxy as Proxy
    participant Server as Server Component

    User->>Login: Enter credentials
    Login->>Supabase: signInWithPassword()
    Supabase-->>Login: JWT + Session cookie
    Login->>Login: Set cookie via Supabase
    Login-->>User: Redirect to /

    Note over User,Server: Subsequent requests

    User->>Proxy: GET /admin/products
    Proxy->>Proxy: Refresh session (Supabase SSR)
    Proxy->>Proxy: Check ADMIN_EMAILS whitelist
    alt Authenticated + Admin
        Proxy-->>Server: Forward request
    else Not authenticated
        Proxy-->>User: Redirect to /auth/login
    else Not admin
        Proxy-->>User: Redirect to /
    end
    Server-->>User: Admin page
```

### OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant App as KeyDir
    participant Supabase as Supabase Auth
    participant Provider as OAuth Provider

    User->>App: Click "Sign in with Google"
    App->>Supabase: signInWithOAuth({ provider })
    Supabase-->>App: Redirect URL
    App-->>User: Redirect to provider
    User->>Provider: Authorize
    Provider-->>Supabase: Callback with code
    Supabase->>Supabase: Exchange code for session
    Supabase-->>App: Redirect to /auth/callback
    App->>App: Create profile if new
    App-->>User: Logged in
```

## Component Hierarchy

```mermaid
flowchart TD
    RootLayout["RootLayout<br/>(layout.tsx)"]
    ThemeScript["ThemeScript"]
    ThemeProvider["ThemeProvider"]
    ProgressBar["ProgressBar"]
    ScrollReveal["ScrollReveal"]

    RootLayout --> ThemeScript
    RootLayout --> ThemeProvider
    ThemeProvider --> ProgressBar
    ThemeProvider --> ScrollReveal
    ThemeProvider --> Children["Children (Pages)"]

    Children --> PageLayout["Page Layout"]
    PageLayout --> Navbar["Navbar"]
    PageLayout --> Content["Page Content"]
    PageLayout --> Footer["Footer"]

    Content --> ProductGrid["Product Grid"]
    Content --> FilterPanel["Filter Panel"]
    Content --> Pagination["Pagination"]

    ProductGrid --> ProductCard["Product Card"]
    ProductCard --> ProductCardImage["Image"]
    ProductCard --> PriceDisplay["Price"]
    ProductCard --> CouponBadge["Coupon Badge"]
    ProductCard --> VoteWidget["Vote Widget"]

    style RootLayout fill:#0a0a0a,stroke:#0070f3,color:#fff
    style ThemeProvider fill:#1a1a2e,stroke:#f5a623,color:#fff
    style Content fill:#1a1a2e,stroke:#50e3c2,color:#fff
```

## Image Upload Flow

```mermaid
flowchart LR
    Select["User Selects Image"] --> Validate["Validate<br/>Type + Size"]
    Validate --> FormData["Create FormData"]
    FormData --> Upload["POST /api/upload"]
    Upload --> Cloudinary["Cloudinary SDK<br/>Upload"]
    Cloudinary --> URL["Return URL +<br/>publicId"]
    URL --> DB["Save to Database"]
    DB --> Display["Display Image"]

    style Select fill:#1a1a2e,stroke:#f5a623,color:#fff
    style Cloudinary fill:#1a1a2e,stroke:#3448c5,color:#fff
    style DB fill:#1a1a2e,stroke:#3ecf8e,color:#fff
```

## Deployment Architecture

```mermaid
flowchart TB
    subgraph GitHub["GitHub"]
        Repo["Repository"]
        Actions["CI/CD"]
    end

    subgraph VercelPlatform["Vercel"]
        Build["Build Pipeline"]
        Edge["Edge Network"]
        Functions["Serverless Functions"]
        Cron["Cron Scheduler"]
    end

    subgraph SupabasePlatform["Supabase"]
        AuthSvc["Auth Service"]
        Database["PostgreSQL"]
        Realtime["Realtime (unused)"]
    end

    subgraph CloudinaryPlatform["Cloudinary"]
        CDN["Image CDN"]
        Transform["Auto-Transform"]
    end

    Repo -->|Push| Build
    Build --> Edge
    Build --> Functions
    Build --> Cron
    Functions --> AuthSvc
    Functions --> Database
    Functions --> CDN
    CDN --> Transform
    Cron --> Functions

    style GitHub fill:#24292e,color:#fff
    style VercelPlatform fill:#000,color:#fff
    style SupabasePlatform fill:#3ecf8e,color:#fff
    style CloudinaryPlatform fill:#3448c5,color:#fff
```

## Key Patterns

### Prisma Client Singleton

Prevents multiple Prisma instances in development (hot reload):

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Supabase SSR Client

Cookie-based session management for server components:

```typescript
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: { getAll: () => cookieStore.getAll(), ... }
  });
}
```

### Server Action Pattern

All mutations follow this pattern:

```typescript
'use server';
export async function action(data: FormData) {
  const admin = await requireAdmin();    // Auth check
  const validated = schema.parse(data);  // Input validation
  await prisma.model.create({ data });   // Database operation
  revalidatePath('/admin/path');         // Cache invalidation
}
```

## Related Documents

- [Database](DATABASE.md) — Schema and ER diagram
- [Security](SECURITY.md) — Authentication and authorization
- [API Reference](API/) — Endpoint documentation
- [Deployment](DEPLOYMENT/) — Deployment guides
