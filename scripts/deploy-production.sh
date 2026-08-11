#!/bin/bash
# ============================================================
#  Sportsphere — Full Production Deploy
#  Targets VPS at 104.152.50.173, app at /var/www/sportsphere-nextjs
#  Runs on the VPS itself (SSH in first, then run this script)
# ============================================================
set -euo pipefail

APP_DIR="/var/www/sportsphere-nextjs"
REPO="https://github.com/MbazaWeb/sportsphere-v3.git"
PORT=3002
DB_NAME="sportsphere"
DB_USER="sportsphere_admin"
DB_PASS="SS_Secure_2024!"
VPS_IP="104.152.50.173"

# ─── Pre-flight: make sure we have a SESSION_SECRET ───────────────
# Persist it across deploys so existing JWTs stay valid.
SECRET_FILE="$APP_DIR/.session-secret"
if [ ! -f "$SECRET_FILE" ]; then
  echo "[pre] Generating persistent SESSION_SECRET..."
  openssl rand -hex 32 > /tmp/secret-tmp
  sudo mv /tmp/secret-tmp "$SECRET_FILE"
  sudo chmod 600 "$SECRET_FILE"
  sudo chown $USER:$USER "$SECRET_FILE"
fi
SESSION_SECRET=$(sudo cat "$SECRET_FILE")

echo "======================================"
echo "  SportSphere VPS Deploy — Port $PORT"
echo "  Repo:    $REPO"
echo "  AppDir:  $APP_DIR"
echo "======================================"

# ─── 1. Clone or pull latest ─────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/9] Pulling latest..."
  cd "$APP_DIR"
  # Remove stray junk files from old shell redirects (0-byte artifacts
  # that block Windows checkouts and clutter the working tree).
  rm -f -- '-' ipconfig next sudo sportsphere@2.0.0 tsc-errors.txt tsconfig.tsbuildinfo 72 seed.sql 2>/dev/null || true
  git fetch origin main
  git reset --hard origin/main
  # Also remove untracked junk that may have come back via stray shell redirects.
  git clean -fd
  rm -rf .next
  # proxy.ts at src/ is the Next.js 16 edge auth guard — do NOT delete it.
  # Next.js 16 renamed middleware.ts → proxy.ts with export function proxy().
  # Remove any stale middleware.ts that may linger from pre-v16 deploys.
  rm -f ./src/middleware.ts ./middleware.ts ./middleware.js 2>/dev/null || true
  # Also collapse accidental nested src/src/ directory if present
  # (caused by a bad cp/rsync in a previous deploy — Next.js then sees
  # causing duplicate proxy detection)
  if [ -d "./src/src" ]; then
    echo "  Found nested ./src/src/ — removing (causes 'Both middleware and proxy detected' error)"
    rm -rf ./src/src
  fi
else
  echo "[1/9] Cloning..."
  sudo mkdir -p "$APP_DIR"
  sudo chown $USER:$USER "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── 2. Write .env (Next.js reads .env in production) ────────────
echo "[2/9] Writing environment files..."
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
DOMAIN="sportssphere.fun"

# Main App .env
cat > .env << ENV
NODE_ENV=production
DATABASE_URL="${DATABASE_URL}"
SESSION_SECRET="${SESSION_SECRET}"
JWT_SECRET="${SESSION_SECRET}"
NEXT_PUBLIC_APP_URL=https://${DOMAIN}/sportsphere
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}/sportsphere
NEXT_PUBLIC_APP_NAME=SportSphere
PORT=${PORT}
CRON_SECRET="sportsphere-sync-key-2026"
ENV

# Admin App .env
cat > Admin/.env << ENV
DATABASE_URL="${DATABASE_URL}"
ADMIN_JWT_SECRET="${SESSION_SECRET}"
NEXT_PUBLIC_ADMIN_URL=https://${DOMAIN}/sportsphere-admin
NEXT_PUBLIC_MAIN_APP_URL=https://${DOMAIN}/sportsphere
PORT=3003
ENV

export DATABASE_URL="$DATABASE_URL"

# ─── 3. PostgreSQL (idempotent) ──────────────────────────────────
echo "[3/9] Ensuring PostgreSQL database + user..."
sudo -u postgres psql -v ON_ERROR_STOP=1 << SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL
sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" || true

# ─── 4. Install dependencies ────────────────────────────────────
echo "[4/9] npm install..."
npm install --legacy-peer-deps

# ─── 5. Prisma generate ─────────────────────────────────────────
echo "[5/9] prisma generate..."
npx prisma generate

# ─── 6. Apply ALL pending migrations (Phase 1 → Phase 5) ────────
echo "[6/9] prisma migrate deploy..."
npx prisma migrate deploy

# ─── 7. Seed: roles + KPI config (idempotent upserts) ───────────
echo "[7a/9] Seeding roles..."
npx tsx prisma/seed-roles.ts || echo "  (seed-roles skipped — already seeded)"

echo "[7b/9] Seeding KPI weight config (28 default KPIs)..."
npx tsx prisma/seed-kpi-config.ts || echo "  (seed-kpi-config skipped)"

# ─── 8. Backfill existing data ──────────────────────────────────
echo "[8a/9] Backfilling typed role profiles (Phase 4)..."
npx tsx prisma/backfill-typed-profiles.ts || echo "  (backfill-typed-profiles warning — see above)"

echo "[8b/9] Backfilling PerformanceProfile rows (Phase 5)..."
npx tsx prisma/backfill-performance-profiles.ts || echo "  (backfill-performance-profiles warning — see above)"

# ─── 9. Build + restart PM2 ─────────────────────────────────────
echo "[9a/9] Building Main App..."
npm run build

echo "[9b/9] Building Admin App..."
cd Admin
npm install --legacy-peer-deps
npm run build
cd ..

# ─── 9c. Standalone post-build: link public/ & static assets ────────
echo "[9c/9] Linking static assets..."
mkdir -p .next/standalone/public
ln -sfn ../../public .next/standalone/public

if [ ! -d ".next/standalone/.next/static" ]; then
  mkdir -p .next/standalone/.next/static
  cp -r .next/static/* .next/standalone/.next/static/
fi

# Admin app standalone assets
mkdir -p Admin/.next/standalone/Admin/public
ln -sfn ../../../public Admin/.next/standalone/Admin/public

# ─── 9d. Restart PM2 (using ecosystem config) ──────────────────────
echo "[9d/9] Restarting all services via PM2..."
pm2 delete sportsphere sportsphere-admin sportsphere-ws 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "======================================"
echo "  ✅ FULL STACK DEPLOY COMPLETE"
echo "======================================"
echo "  Fan App:    https://sportssphere.fun/sportsphere"
echo "  Admin:      https://sportssphere.fun/sportsphere-admin"
echo "  Real-time:  https://sportssphere.fun/socket.io"
echo ""
echo "  PM2 Status:"
pm2 status
echo "======================================"
