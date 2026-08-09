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
  # `-` and `72` and `ipconfig` etc. are never legitimate source files.
  git clean -fd -- '-' ipconfig next sudo sportsphere@2.0.0 tsc-errors.txt tsconfig.tsbuildinfo 72 seed.sql 2>/dev/null || true
  # Remove legacy middleware.ts (Next.js 16 uses proxy.ts instead).
  # This file is untracked on the VPS from a previous deploy and breaks the
  # build with "Middleware is missing expected function export name" or
  # "Both middleware file and proxy file are detected".
  # Use find to catch ALL copies (src/middleware.ts, src/src/middleware.ts, etc.)
  find . -path ./node_modules -prune -o -path ./.next -prune -o \
    -name 'middleware.ts' -not -path '*/node_modules/*' -not -path '*/.next/*' \
    -not -path '*/mobile/*' -print -delete 2>/dev/null || true
  find . -path ./node_modules -prune -o -path ./.next -prune -o \
    -name 'middleware.js' -not -path '*/node_modules/*' -not -path '*/.next/*' \
    -not -path '*/mobile/*' -print -delete 2>/dev/null || true
  # Remove root-level proxy.ts — only src/proxy.ts should exist. A root
  # proxy.ts that re-exports from src/ breaks the build with "Next.js can't
  # recognize the exported `config` field in route. It mustn't be reexported."
  rm -f ./proxy.ts ./proxy.js 2>/dev/null || true
  # Also collapse accidental nested src/src/ directory if present
  # (caused by a bad cp/rsync in a previous deploy — Next.js then sees
  # ./src/src/proxy.ts as a second proxy file)
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
echo "[2/9] Writing .env..."
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
cat > .env << ENV
NODE_ENV=production
DATABASE_URL="${DATABASE_URL}"
SESSION_SECRET="${SESSION_SECRET}"
JWT_SECRET="${SESSION_SECRET}"
NEXT_PUBLIC_APP_URL=http://${VPS_IP}:${PORT}
NEXT_PUBLIC_BASE_URL=http://${VPS_IP}:${PORT}
NEXT_PUBLIC_APP_NAME=SportSphere
PORT=${PORT}
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
echo "[9a/9] next build..."
npm run build

echo "[9b/9] Restarting PM2..."
pm2 delete sportsphere 2>/dev/null || true
PORT=$PORT pm2 start npm --name "sportsphere" -- start
pm2 save

echo ""
echo "======================================"
echo "  ✅ DEPLOY COMPLETE"
echo "======================================"
echo "  URL:        http://${VPS_IP}:${PORT}"
echo "  Admin:      http://${VPS_IP}:${PORT}/admin"
echo "  KPI cfg:    http://${VPS_IP}:${PORT}/admin/kpi"
echo "  Verify:     http://${VPS_IP}:${PORT}/admin/verification"
echo "  Leaderboard:http://${VPS_IP}:${PORT}/leaderboard"
echo ""
echo "  Logs:       pm2 logs sportsphere"
echo "  Status:     pm2 status"
echo "======================================"
