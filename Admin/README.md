# SportSphere Admin Console

Standalone Next.js admin console for SportSphere. Runs on its own process
(port **3003**), talks **directly** to the shared PostgreSQL database via
Prisma, and issues its own admin JWTs.

```
┌──────────────────────┐     ┌──────────────────────┐
│  Admin Console       │     │  Fan Web App         │
│  /sportsphere-admin  │     │  /sportsphere        │
│  Port 3003 (PM2)     │     │  Port 3002 (PM2)     │
│  Direct Prisma       │────▶│  Same PostgreSQL     │
│  Own JWT sessions    │     │  Own JWT sessions    │
└──────────────────────┘     └──────────┬───────────┘
                                        │
                             ┌──────────┴───────────┐
                             │  Mobile (Expo)       │
                             │  → /api on fan app   │
                             └──────────────────────┘
```

## Architecture notes

- **Shared DB** — same `DATABASE_URL` as the fan app. Schema is introspected
  from production (`npx prisma db pull`) so the admin client matches live tables.
- **Auth** — `admin_session` HTTP-only cookie, signed with `ADMIN_JWT_SECRET`
  (separate from the fan app secret). TTL 7 days.
- **RBAC** — `verifyAdmin()` on every `/api/admin/*` route. Role claims must
  include ADMINISTRATOR / ADMIN.
- **Modules** — users, sports data (players/teams/leagues/coaches/matches),
  news, rumors, claims, AI agent, delegation, performance verifications,
  moderation, audit, backups, notifications broadcast.


## Prisma schema (shared)

Admin **does not own** a separate schema file.  
`Admin/prisma/schema.prisma` is a **symlink** to `../prisma/schema.prisma` (main app).

- **Migrations** — only from the main app (`npx prisma migrate deploy` at repo root).
- **After main migrates** — regenerate Admin client only:
  ```bash
  cd Admin && npx prisma generate && npm run build && pm2 restart sportsphere-admin
  ```
- **Do not** run `prisma db pull` or `migrate` from Admin — it would fight the shared file.

## Local development

```bash
cd Admin
cp .env.example .env   # set DATABASE_URL, ADMIN_JWT_SECRET (>=32 chars)
npm install
npx prisma generate
npm run dev            # http://localhost:3003
```

## Production (VPS)

```bash
cd /var/www/sportsphere-nextjs/Admin
npm ci
npx prisma generate
npm run build
pm2 restart sportsphere-admin
```

Nginx serves `/sportsphere-admin` → `127.0.0.1:3003` (see root `nginx.conf`).

## After DB schema changes

When the main app migrates new tables/columns:

```bash
npx prisma db pull
npx prisma generate
npm run build
pm2 restart sportsphere-admin
```

Do **not** run migrations from the admin app — the fan app owns the schema.
