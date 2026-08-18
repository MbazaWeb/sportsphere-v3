# SportSphere — Supabase Migration Plan

## Why Supabase?
- Built-in Auth (replaces NextAuth + Prisma auth)
- Realtime subscriptions (live scores, messages, notifications)
- Storage (replaces local /uploads)
- Edge Functions
- Free tier + auto-scaling

## Migration Strategy
**Zero-downtime approach** — replace `lib/db.ts` with a Supabase adapter
that keeps the same API shape. All 58 route files work unchanged.

## Steps

### Step 1 — Create Supabase Project
1. Go to https://supabase.com/dashboard
2. New project → name: **sportsphere**
3. Copy: Project URL + anon key + service_role key

### Step 2 — Run Schema in Supabase SQL Editor
Copy and run `supabase/schema.sql` (generated below)

### Step 3 — Environment Variables
Add to `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 4 — Replace db.ts
`src/lib/db.ts` → Supabase client with Prisma-compatible wrapper

### Step 5 — Migrate Data
Run `scripts/migrate-to-supabase.ts` to copy existing PostgreSQL data

### Step 6 — Update Auth
Replace JWT custom auth with Supabase Auth

### Step 7 — Enable Realtime
Replace socket.io with Supabase realtime channels

### Step 8 — Enable Storage
Replace /uploads to Supabase Storage bucket
