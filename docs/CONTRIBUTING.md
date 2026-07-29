# Contributing to KeyDir

This project is proprietary — contributions are limited to invited team members.

## Coding Conventions

### TypeScript

- Always use TypeScript (no plain `.js` files)
- Use strict TypeScript — no `any` type
- Use `unknown` and narrow with type guards instead of `any`
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and utility types

### Components

- **Server Components by default** — only add `'use client'` when interactivity is needed
- One component per file, named after the file
- Use named exports, not default exports (except pages)
- Destructure props inline in the function signature

### Server Actions

- Place in `src/lib/admin/` for admin actions
- Always include auth check (`requireAdmin()`)
- Always validate input with Zod
- Always call `revalidatePath()` after mutations

### Styling

- Use Tailwind CSS utility classes
- No hardcoded colors — use CSS variables
- Follow the existing cyberpunk-industrial aesthetic
- Use the existing design tokens (spacing, fonts, colors)

### Database

- Always use Prisma ORM — no raw SQL
- Use Prisma transactions for multi-step operations
- Add indexes for frequently queried columns
- Use `onDelete: Cascade` for related records

### Imports

- Use `@/` path alias for src files (e.g., `@/lib/prisma`)
- Group imports: external → internal → CSS
- No barrel files (index.ts re-exports) — import directly

### Git Conventions

- Use descriptive commit messages
- Prefix commits with type: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- Keep commits focused on a single change
- Rebase before merging to maintain a clean history

## Development Workflow

```bash
# Clone and install
git clone https://github.com/your-org/app.keydir.in.git
cd app.keydir.in
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Database setup
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev

# Before committing
npm run lint
npx tsc --noEmit
```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/components/` | React components organized by domain |
| `src/lib/` | Server-side logic, services, repositories |
| `src/hooks/` | Custom React hooks |
| `src/domain/` | Domain layer (spec configs, business rules) |
| `src/types/` | TypeScript type definitions |
| `prisma/` | Database schema and seed data |
| `docs/` | Project documentation |
