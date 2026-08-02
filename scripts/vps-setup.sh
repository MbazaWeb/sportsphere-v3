#!/bin/bash
set -e

APP_DIR="/var/www/sportsphere-nextjs"
PORT=3002
DB_NAME="sportsphere"
DB_USER="sportsphere"
DB_PASS="sportsphere"

echo "======================================"
echo "  SportSphere Full VPS Setup"
echo "  Port: $PORT | DB: $DB_NAME"
echo "======================================"

# 1. Pull latest code
echo "[1/7] Pulling latest code..."
cd $APP_DIR
git pull origin main

# 2. Write production .env
echo "[2/7] Writing production .env..."
cat > .env << ENV
NODE_ENV=production
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
SESSION_SECRET="$(openssl rand -base64 48)"
NEXT_PUBLIC_APP_URL=http://104.152.50.173:${PORT}
NEXT_PUBLIC_APP_NAME=SportSphere
PORT=${PORT}
ENV

# 3. Setup PostgreSQL
echo "[3/7] Setting up PostgreSQL..."
sudo -u postgres psql << SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
SQL

# 4. Install deps
echo "[4/7] Installing dependencies..."
npm install --legacy-peer-deps

# 5. Run Prisma migrations
echo "[5/7] Running Prisma migrations..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push --force-reset

# 6. Seed database
echo "[6/7] Seeding database..."
npx tsx prisma/seed.ts

# 7. Build and start
echo "[7/7] Building Next.js..."
npm run build

pm2 delete sportsphere-nextjs 2>/dev/null || true
cat > ecosystem.config.cjs << 'PM2'
module.exports = {
  apps: [{
    name: 'sportsphere-nextjs',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/sportsphere-nextjs',
    env: { NODE_ENV: 'production', PORT: 3002 }
  }]
}
PM2
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "======================================"
echo "  Done! http://104.152.50.173:${PORT}"
echo "  All 22 test accounts: SportSphere2024!"
echo "======================================"
