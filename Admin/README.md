# SportSphere Admin (Standalone)

A **fully detached** Next.js admin console for SportSphere. It runs in its own
process on its own port, has its own package.json and install pipeline, and
communicates with the main fan web app exclusively over HTTP.

```
┌─────────────────────┐         ┌─────────────────────┐
│  Admin Console      │         │  Fan Web App        │
│  (this app)         │ ──HTTP──│  (sportSphere v3)   │
│  Port 3003          │   /api  │  Port 3002          │
│  /login             │         │  /sportsphere       │
│  /dashboard/*       │         │  /api/admin/*       │
└─────────────────────┘         └──────────┬──────────┘
                                           │ HTTP
                                ┌──────────┴──────────┐
                                │   Mobile App        │
                                │   (Capacitor)       │
                                └─────────────────────┘
```

## Why detached?

- **Independent deploys** — change admin UI without rebuilding the fan app.
- **Independent scaling** — run admin on a separate VPS if needed.
- **Independent port** — `/admin/*` no longer fights with the fan app's
  basePath (`/sportsphere`).
- **Smaller attack surface** — the admin app has no database credentials,
  no Cloudinary keys, no direct Prisma access. If it's compromised, the
  attacker only gets the admin session cookie (which expires in 7 days).

## How it talks to the fan app

The admin app is a **thin shell**. It has:

1. **Its own login page** at `/login`.
2. **Its own auth API** at `/api/auth/{login,logout,me}` that proxies to
   the main app's `/api/admin/auth/*` endpoints.
3. **Its own admin API** at `/api/admin/*` that forwards every request to
   the main app's `/api/admin/*` endpoints, injecting the `ss_session`
   cookie that the main app expects.

The admin app stores the main app's `ss_session` JWT inside its own
HTTP-only cookie called `admin_session`. When you sign out of the admin
console, the admin app clears its cookie AND calls the main app's logout
endpoint to invalidate the session server-side.

## Installation

### Local development

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env
# Edit .env — at minimum set MAIN_APP_URL to point at your running fan app

# 3. Run the dev server
npm run dev
# → http://localhost:3003
```

### Production (on the same VPS as the fan app)

The fan app already runs on port 3002 under PM2. This admin app runs on
port 3003 under its own PM2 process.

```bash
# 1. Put the project somewhere stable
sudo mkdir -p /var/www/sportsphere-admin
sudo chown deploy:deploy /var/www/sportsphere-admin
# (then rsync or git clone this folder into /var/www/sportsphere-admin)

# 2. Install deps
cd /var/www/sportsphere-admin
npm ci --no-audit --no-fund

# 3. Create .env
cat > .env <<'EOF'
MAIN_APP_URL=http://127.0.0.1:3002/sportsphere
PORT=3003
ADMIN_COOKIE_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_ADMIN_URL=http://104.152.50.173:3003
NEXT_PUBLIC_ADMIN_NAME=SportSphere Admin
EOF

# 4. Build
npm run build

# 5. Start with PM2
pm2 start "npm run start" --name sportsphere-admin
pm2 save
```

### nginx reverse proxy (optional)

If you want a single public port (80/443) routing both apps by path:

```nginx
location /sportsphere/ {
    proxy_pass http://127.0.0.1:3002/sportsphere/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /admin/ {
    proxy_pass http://127.0.0.1:3003/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Then the admin URL becomes `https://your-domain/admin/login`.

## File structure

```
sportsphere-admin/
├── package.json              ← own deps (Next 16 + React 19 + Tailwind 4)
├── next.config.ts            ← port 3003, no basePath
├── tsconfig.json
├── postcss.config.mjs
├── .env.example
├── README.md                 ← this file
├── scripts/
│   └── deploy.sh             ← sample deploy script
└── src/
    ├── proxy.ts              ← protects /dashboard/* (Next 16 middleware)
    ├── lib/
    │   ├── main-app-client.ts ← server-side fetch to the fan app
    │   ├── session.ts         ← admin cookie helpers (sign/verify)
    │   └── utils.ts           ← cn() helper
    └── app/
        ├── layout.tsx
        ├── page.tsx           ← redirects to /dashboard or /login
        ├── globals.css
        ├── login/page.tsx     ← admin login form
        ├── dashboard/
        │   ├── layout.tsx     ← sidebar + session hydration + logout
        │   ├── page.tsx       ← overview (KPIs)
        │   ├── users/page.tsx
        │   ├── sports/page.tsx
        │   ├── roles/page.tsx
        │   └── posts/page.tsx
        └── api/
            ├── auth/
            │   ├── login/route.ts   ← bridges to main app's /api/admin/auth/login
            │   ├── logout/route.ts
            │   └── me/route.ts
            └── admin/
                ├── stats/route.ts   ← proxies to main app
                ├── users/route.ts
                ├── users/[id]/route.ts
                ├── posts/route.ts
                ├── posts/[id]/route.ts
                ├── roles/route.ts
                └── roles/[id]/route.ts
```

## API contract with the fan app

The admin app calls these endpoints on the fan app (defined in
`sportsphere-v3/src/app/api/admin/`):

| Admin app route          | Forwards to (fan app)            |
|--------------------------|----------------------------------|
| `POST /api/auth/login`   | `POST /api/admin/auth/login`     |
| `POST /api/auth/logout`  | `POST /api/admin/auth/logout`    |
| `GET  /api/auth/me`      | `GET  /api/admin/auth/me`        |
| `GET  /api/admin/stats`  | `GET  /api/admin/stats`          |
| `GET  /api/admin/users`  | `GET  /api/admin/users`          |
| `PUT  /api/admin/users/[id]` | `PUT /api/admin/users/[id]`  |
| `GET  /api/admin/posts`  | `GET  /api/admin/posts`          |
| `DELETE /api/admin/posts/[id]` | `DELETE /api/admin/posts/[id]` |
| `GET  /api/admin/roles`  | `GET  /api/admin/roles`          |
| `PATCH /api/admin/roles/[id]` | `PATCH /api/admin/roles/[id]` |

All fan-app admin endpoints are already gated by `verifyAdminSession()` in
the fan app — so even if someone bypasses the admin console and hits the
fan app directly, they still need a valid admin JWT.

## Mobile app compatibility

The mobile app (Capacitor) already talks directly to the fan web app's
`/api/*` routes. **It does not need any changes** — it continues to use
the same endpoints as before.

If you later want a mobile admin app, you can point it at THIS admin app's
`/api/*` routes instead; the contract is identical.
