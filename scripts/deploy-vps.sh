#!/bin/bash
set -e

APP_DIR="/var/www/sportsphere"
REPO="https://github.com/MbazzaTZ/SportSphere-Project.git"
PORT=3002
DB_NAME="sportsphere"
DB_USER="sportsphere_admin"
DB_PASS="SS_Secure_2024!"

echo "======================================"
echo "  SportSphere VPS Deploy — Port $PORT"
echo "======================================"

# 1. Clone or pull
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/7] Pulling latest..."
  cd $APP_DIR && git pull origin main
else
  echo "[1/7] Cloning..."
  sudo mkdir -p $APP_DIR && sudo chown $USER:$USER $APP_DIR
  git clone $REPO $APP_DIR && cd $APP_DIR
fi
cd $APP_DIR

# 2. .env.production
echo "[2/7] Writing .env.production..."
cat > .env.production << ENV
NODE_ENV=production
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
NEXT_PUBLIC_APP_URL=http://104.152.50.173:${PORT}
NEXT_PUBLIC_APP_NAME=SportSphere
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://104.152.50.173:${PORT}
PORT=${PORT}
ENV

# 3. PostgreSQL
echo "[3/7] Setting up PostgreSQL..."
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}'; END IF; END \$\$;"
sudo -u postgres psql -c "SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='${DB_NAME}')\gexec"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

# 4. Install
echo "[4/7] npm install..."
npm install --legacy-peer-deps

# 5. Prisma
echo "[5/7] Prisma migrate + seed..."
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 6. Build
echo "[6/7] next build..."
npm run build

# 7. PM2
echo "[7/7] PM2..."
pm2 delete sportsphere 2>/dev/null || true
PORT=$PORT pm2 start npm --name "sportsphere" -- start
pm2 save

echo ""
echo "======================================"
echo "  Done! http://104.152.50.173:${PORT}"
echo "  pm2 logs sportsphere"
echo "======================================"
