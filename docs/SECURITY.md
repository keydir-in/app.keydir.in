# Security

## Purpose

This document describes KeyDir's security architecture, including authentication, authorization, session management, and security best practices.

## Security Architecture

```mermaid
flowchart TB
    subgraph AuthLayer["Authentication Layer"]
        SupabaseAuth["Supabase Auth"]
        JWT["JWT Tokens"]
        Cookies["HttpOnly Cookies"]
    end

    subgraph AuthzLayer["Authorization Layer"]
        Proxy["Proxy Guard"]
        AdminCheck["Admin Email Check"]
        ProfileCheck["Profile Ownership"]
    end

    subgraph DataLayer["Data Protection"]
        RLS["Row Level Security"]
        Validation["Zod Validation"]
        Sanitization["Input Sanitization"]
    end

    subgraph InfraLayer["Infrastructure"]
        HTTPS["HTTPS Only"]
        EnvSecrets["Env Variables"]
        CronSecret["Cron Secret"]
    end

    AuthLayer --> AuthzLayer
    AuthzLayer --> DataLayer
    DataLayer --> InfraLayer

    style AuthLayer fill:#0070f3,color:#fff
    style AuthzLayer fill:#f5a623,color:#000
    style DataLayer fill:#50e3c2,color:#000
    style InfraLayer fill:#e94560,color:#fff
```

## Authentication

### Authentication Providers

| Provider | Type | Status |
|----------|------|--------|
| Email/Password | Supabase Auth | ✅ Implemented |
| Google OAuth | Supabase Auth | ✅ Implemented |
| Discord OAuth | Supabase Auth | ✅ Implemented |

### Session Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Supabase as Supabase Auth
    participant Proxy as Proxy
    participant Server as Server Component

    User->>Browser: Login request
    Browser->>Supabase: signInWithPassword()
    Supabase-->>Browser: JWT + Refresh Token
    Browser->>Browser: Store in HttpOnly cookie

    Note over Browser,Server: Subsequent requests

    Browser->>Proxy: HTTP Request
    Proxy->>Supabase: getUser() (refresh session)
    Supabase-->>Proxy: User data
    Proxy->>Proxy: Check auth status
    alt Authenticated
        Proxy->>Server: Forward with user context
    else Not authenticated
        Proxy-->>Browser: Redirect to /auth/login
    end
    Server-->>Browser: Page response
```

### OAuth Callback Flow

```mermaid
sequenceDiagram
    participant User
    participant App as KeyDir
    participant Supabase as Supabase Auth
    participant Provider as OAuth Provider
    participant DB as PostgreSQL

    User->>App: Click "Sign in with Google"
    App->>Supabase: signInWithOAuth({ provider: 'google' })
    Supabase-->>App: Redirect URL
    App-->>User: Redirect to Google

    User->>Provider: Authorize app
    Provider-->>Supabase: Callback with auth code
    Supabase->>Supabase: Exchange code for session
    Supabase-->>App: Redirect to /auth/callback

    App->>App: Exchange code for session
    App->>DB: Check if profile exists
    alt Profile exists
        App-->>User: Redirect to /
    else New user
        App->>DB: Create Profile row
        App->>DB: Create UserXP row
        App-->>User: Redirect to /
    end
```

## Authorization

### Route Protection

```mermaid
flowchart TD
    Request["Request"] --> Proxy{"Proxy"}
    Proxy -->|"Not /admin/*"| Public["Public Route<br/>Allow"]
    Proxy -->|"/admin/*"| AuthCheck{"Authenticated?"}
    AuthCheck -->|"No"| Login["Redirect /auth/login"]
    AuthCheck -->|"Yes"| AdminCheck{"Email in<br/>ADMIN_EMAILS?"}
    AdminCheck -->|"No"| Home["Redirect /"]
    AdminCheck -->|"Yes"| Admin["Admin Route<br/>Allow"]

    style Proxy fill:#f5a623,color:#000
    style AuthCheck fill:#0070f3,color:#fff
    style AdminCheck fill:#e94560,color:#fff
```

### Proxy Implementation

The proxy at `src/proxy.ts` handles:

1. **Session Refresh**: Calls `supabase.auth.getUser()` to refresh the JWT on every request
2. **Admin Protection**: Checks if the user's email is in the `ADMIN_EMAILS` environment variable
3. **Cookie Management**: Properly sets/updates Supabase auth cookies

```typescript
// src/proxy.ts (simplified)
export async function proxy(request: NextRequest) {
  const supabase = createServerClient(url, key, { cookies: {...} });
  
  // Protect /admin routes
  if (path.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/auth/login');
    
    const adminEmails = process.env.ADMIN_EMAILS.split(',');
    if (!adminEmails.includes(user.email)) return redirect('/');
  }
  
  return supabaseResponse;
}
```

### Server Action Auth Pattern

Every server action that modifies data follows this pattern:

```typescript
'use server';
export async function adminAction(data: FormData) {
  // 1. Check authentication
  const admin = await requireAdmin();
  if (!admin) throw new Error('Unauthorized');
  
  // 2. Validate input
  const validated = schema.parse(Object.fromEntries(data));
  
  // 3. Perform mutation
  await prisma.model.create({ data: validated });
  
  // 4. Invalidate cache
  revalidatePath('/admin/path');
}
```

## Data Protection

### Row Level Security (RLS)

```mermaid
flowchart LR
    subgraph Supabase["Supabase PostgreSQL"]
        subgraph Tables["Tables with RLS"]
            ProfileRLS["Profile"]
            VoteRLS["Vote"]
            CollectionRLS["Collection"]
            WishlistRLS["Wishlist"]
        end
    end

    subgraph Policies["RLS Policies"]
        PublicRead["Public SELECT"]
        OwnerWrite["Owner INSERT/UPDATE/DELETE"]
        AuthInsert["Authenticated INSERT"]
    end

    ProfileRLS --> PublicRead
    ProfileRLS --> OwnerWrite
    VoteRLS --> PublicRead
    VoteRLS --> AuthInsert
    CollectionRLS --> OwnerWrite
    WishlistRLS --> OwnerWrite

    style Supabase fill:#3ecf8e,color:#000
    style Policies fill:#1a1a2e,stroke:#f5a623,color:#fff
```

### Input Validation

All user input is validated using Zod schemas:

```typescript
// Example: Profile update validation
export const profileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(200).optional(),
  github: z.string().url().optional().or(z.literal('')),
  discord: z.string().optional(),
  reddit: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});
```

### File Upload Security

| Check | Implementation |
|-------|---------------|
| File size | Max 10MB enforced in API route |
| File type | Whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/avif` |
| Storage | Cloudinary CDN (no local file storage) |
| Access | API route handles upload, not direct Cloudinary upload |

## Environment Variables Security

### Secret Variables (Server-Side Only)

| Variable | Risk if Exposed | Protection |
|----------|----------------|------------|
| `DATABASE_URL` | Full database access | Never in client code |
| `CLOUDINARY_API_SECRET` | Image deletion/management | Server-side only |
| `CRON_SECRET` | Unauthorized scraper runs | Bearer token validation |
| `DELETE_PASSWORD` | Product deletion | Password check in action |

### Public Variables (Safe for Client)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (RLS-protected) |
| `NEXT_PUBLIC_APP_URL` | Application base URL |

### Security Rules

```mermaid
flowchart TD
    Code["Code"] --> Check{"Contains secrets?"}
    Check -->|"No"| Safe["✅ Safe to commit"]
    Check -->|"Yes"| Env["Move to .env"]
    Env --> Gitignore["Add to .gitignore"]
    Gitignore --> Safe

    style Check fill:#f5a623,color:#000
    style Safe fill:#50e3c2,color:#000
    style Env fill:#e94560,color:#fff
```

## API Security

### Cron Job Authentication

```mermaid
sequenceDiagram
    participant Vercel as Vercel Cron
    participant API as /api/cron/update-prices
    participant Secret as CRON_SECRET

    Vercel->>API: GET /api/cron/update-prices
    API->>API: Extract Authorization header
    API->>Secret: Compare with Bearer token
    alt Match
        API->>API: Execute scraper
    else Mismatch
        API-->>Vercel: 401 Unauthorized
    end
```

### Rate Limiting

| Endpoint | Rate Limit | Protection |
|----------|-----------|------------|
| `/api/search` | Standard Vercel limits | Public |
| `/api/upload` | File size + type checks | Auth required |
| `/api/cron/*` | CRON_SECRET bearer token | Secret-based |
| Server Actions | Admin email check | Proxy + requireAdmin |

## Security Best Practices

### Checklist

- [x] No secrets in client-side code
- [x] All inputs validated with Zod
- [x] RLS enabled on sensitive tables
- [x] Admin routes protected by proxy
- [x] Server actions check authentication
- [x] File uploads validated (type + size)
- [x] Cron jobs authenticated with secret
- [x] HTTPS enforced in production
- [x] Environment variables in .gitignore
- [x] Prisma prevents SQL injection

### Never Do

- ❌ Expose `DATABASE_URL` in client code
- ❌ Skip input validation on server actions
- ❌ Trust client-side validation alone
- ❌ Log environment variables
- ❌ Commit `.env` files
- ❌ Use `any` type (bypasses type safety)
- ❌ Allow file uploads without type checking

## Related Documents

- [Architecture](ARCHITECTURE.md) — Security in the system context
- [Database](DATABASE.md) — RLS policies and constraints
- [Deployment](DEPLOYMENT/) — Environment variable setup
