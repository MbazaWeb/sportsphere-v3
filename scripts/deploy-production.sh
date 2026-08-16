#!/bin/bash
# ============================================================
#  Sportsphere — Full Production Deploy
#  Targets VPS at 104.152.50.173
#  Repo root: /var/www/sportsphere-nextjs
#  Fan Web App: /var/www/sportsphere-nextjs/WebApp
#  Admin:       /var/www/sportsphere-nextjs/Admin
#  Runs on the VPS itself (SSH in first, then run this script)
# ============================================================
set -euo pipefail

APP_DIR="/var/www/sportsphere-nextjs"
WEBAPP_DIR="$APP_DIR/WebApp"
ADMIN_DIR="$APP_DIR/Admin"
REPO="https://github.com/MbazaWeb/sportsphere-v3.git"
PORT=3002
DB_NAME="sportsphere"
DB_USER="sportsphere_admin"
DB_PASS="SS_Secure_2024!"
VPS_IP="104.152.50.173"
DOMAIN="sportssphere.fun"

# ─── Pre-flight: persistent SESSION_SECRET ───────────────────────
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
echo "  Repo:     $REPO"
echo "  AppDir:   $APP_DIR"
echo "  WebApp:   $WEBAPP_DIR"
echo "  Admin:    $ADMIN_DIR"
echo "======================================"

# ─── 1. Clone or pull latest ─────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/9] Pulling latest..."
  cd "$APP_DIR"
  rm -f -- '-' ipconfig next sudo sportsphere@2.0.0 tsc-errors.txt tsconfig.tsbuildinfo 72 seed.sql 2>/dev/null || true
  git fetch origin main
  git reset --hard origin/main
  git clean -fd
  # Clean old root-level .next if it exists from previous layout
  rm -rf .next WebApp/.next Admin/.next 2>/dev/null || true
  # Clean stale middleware files (Next.js 16 uses proxy.ts)
  rm -f ./src/middleware.ts ./middleware.ts ./middleware.js 2>/dev/null || true
  rm -f "$WEBAPP_DIR/src/middleware.ts" "$WEBAPP_DIR/middleware.ts" 2>/dev/null || true
  if [ -d "$WEBAPP_DIR/src/src" ]; then
    echo "  Found nested WebApp/src/src/ — removing"
    rm -rf "$WEBAPP_DIR/src/src"
  fi
else
  echo "[1/9] Cloning..."
  sudo mkdir -p "$APP_DIR"
  sudo chown $USER:$USER "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── 2. Write .env files ─────────────────────────────────────────
echo "[2/9] Writing environment files..."
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# Root .env (used by Prisma / shared tools)
cat > "$APP_DIR/.env" << ENV
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

# WebApp .env (Next.js reads this from its own directory)
cat > "$WEBAPP_DIR/.env" << ENV
NODE_ENV=production
DATABASE_URL="${DATABASE_URL}"
SESSION_SECRET="${SESSION_SECRET}"
JWT_SECRET="${SESSION_SECRET}"
NEXT_PUBLIC_APP_URL=https://${DOMAIN}/sportsphere
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}/sportsphere
NEXT_PUBLIC_APP_NAME=SportSphere
NEXT_PUBLIC_BASE_PATH=/sportsphere
PORT=${PORT}
CRON_SECRET="sportsphere-sync-key-2026"
ENV

# Admin App .env
cat > "$ADMIN_DIR/.env" << ENV
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
echo "[4a/9] npm install (WebApp)..."
cd "$WEBAPP_DIR"
npm install --legacy-peer-deps

echo "[4b/9] npm install (Admin)..."
cd "$ADMIN_DIR"
npm install --legacy-peer-deps

# ─── 5. Prisma generate (schema lives at repo root) ──────────────
echo "[5/9] prisma generate..."
cd "$APP_DIR"
npx prisma generate --schema=prisma/schema.prisma

# ─── 6. Apply migrations ─────────────────────────────────────────
echo "[6/9] prisma migrate deploy..."
npx prisma migrate deploy --schema=prisma/schema.prisma

# ─── 7. Seed (idempotent) ────────────────────────────────────────
echo "[7a/9] Seeding roles..."
npx tsx prisma/seed-roles.ts || echo "  (seed-roles skipped — already seeded)"

echo "[7b/9] Seeding KPI weight config..."
npx tsx prisma/seed-kpi-config.ts || echo "  (seed-kpi-config skipped)"

# ─── 8. Backfill ─────────────────────────────────────────────────
echo "[8a/9] Backfilling typed role profiles..."
npx tsx prisma/backfill-typed-profiles.ts || echo "  (backfill-typed-profiles warning)"

echo "[8b/9] Backfilling PerformanceProfile rows..."
npx tsx prisma/backfill-performance-profiles.ts || echo "  (backfill-performance-profiles warning)"

# ─── 9. Build + restart PM2 ──────────────────────────────────────
echo "[9a/9] Building WebApp (Fan)..."
cd "$WEBAPP_DIR"
npm run build

echo "[9b/9] Building Admin..."
cd "$ADMIN_DIR"
npm run build

# ─── 9c. Standalone post-build: link public/ & static assets ─────
echo "[9c/9] Linking static assets..."
cd "$WEBAPP_DIR"
mkdir -p .next/standalone/public
ln -sfn ../../public .next/standalone/public 2>/dev/null || true

if [ ! -d ".next/standalone/.next/static" ] && [ -d ".next/static" ]; then
  mkdir -p .next/standalone/.next/static
  cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true
fi

# Admin standalone assets (if using standalone output)
if [ -d "$ADMIN_DIR/.next/standalone" ]; then
  mkdir -p "$ADMIN_DIR/.next/standalone/Admin/public" 2>/dev/null || true
  ln -sfn ../../../public "$ADMIN_DIR/.next/standalone/Admin/public" 2>/dev/null || true
fi

# ─── 9d. Restart PM2 ─────────────────────────────────────────────
echo "[9d/9] Restarting all services via PM2..."
cd "$APP_DIR"
pm2 delete sportsphere sportsphere-admin sportsphere-ws 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "======================================"
echo "  ✅ FULL STACK DEPLOY COMPLETE"
echo "======================================"
echo "  Fan App:    https://${DOMAIN}/sportsphere"
echo "  Admin:      https://${DOMAIN}/sportsphere-admin"
echo "  Real-time:  https://${DOMAIN}/socket.io"
echo ""
echo "  Paths:"
echo "    Repo root : $APP_DIR"
echo "    WebApp    : $WEBAPP_DIR"
echo "    Admin     : $ADMIN_DIR"
echo ""
echo "  PM2 Status:"
pm2 status
echo "======================================"
