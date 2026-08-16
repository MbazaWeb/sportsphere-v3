#!/bin/bash
# ============================================================
#  Sportsphere — Lightweight VPS Deploy (legacy / simplified)
#  Prefer scripts/deploy-production.sh for full deploys.
#  Updated for WebApp/ folder structure (2026-08-16)
# ============================================================
set -e

APP_DIR="/var/www/sportsphere-nextjs"
WEBAPP_DIR="$APP_DIR/WebApp"
REPO="https://github.com/MbazaWeb/sportsphere-v3.git"
PORT=3002
DB_NAME="sportsphere"
DB_USER="sportsphere_admin"
DB_PASS="SS_Secure_2024!"

echo "======================================"
echo "  SportSphere VPS Deploy — Port $PORT"
echo "  (WebApp at $WEBAPP_DIR)"
echo "======================================"

# 1. Clone or pull
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/7] Pulling latest..."
  cd "$APP_DIR" && git pull origin main
else
  echo "[1/7] Cloning..."
  sudo mkdir -p "$APP_DIR" && sudo chown $USER:$USER "$APP_DIR"
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# 2. .env files
echo "[2/7] Writing environment files..."
cat > "$WEBAPP_DIR/.env" << ENV
NODE_ENV=production
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
NEXT_PUBLIC_APP_URL=http://104.152.50.173:${PORT}
NEXT_PUBLIC_BASE_PATH=/sportsphere
NEXT_PUBLIC_APP_NAME=SportSphere
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
PORT=${PORT}
ENV
cp "$WEBAPP_DIR/.env" "$APP_DIR/.env" 2>/dev/null || true

# 3. PostgreSQL
echo "[3/7] Setting up PostgreSQL..."
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}'; END IF; END \$\$;"
sudo -u postgres psql -c "SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='${DB_NAME}')\gexec"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

# 4. Install
echo "[4/7] npm install (WebApp)..."
cd "$WEBAPP_DIR"
npm install --legacy-peer-deps

# 5. Prisma (schema at repo root)
echo "[5/7] Prisma migrate + seed..."
cd "$APP_DIR"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate deploy --schema=prisma/schema.prisma
npx tsx prisma/seed.ts || true

# 6. Build
echo "[6/7] Building WebApp..."
cd "$WEBAPP_DIR"
npm run build

# 7. PM2
echo "[7/7] Restarting via ecosystem..."
cd "$APP_DIR"
pm2 delete sportsphere 2>/dev/null || true
pm2 start ecosystem.config.cjs --only sportsphere
pm2 save

echo ""
echo "======================================"
echo "  Done! http://104.152.50.173:${PORT}/sportsphere"
echo "  pm2 logs sportsphere"
echo "======================================"
