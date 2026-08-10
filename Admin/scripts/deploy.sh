#!/usr/bin/env bash
#
# Deploy the SportSphere Admin console to a Ubuntu/Debian VPS.
# Run from your local machine:
#   ADMIN_HOST=104.152.50.173 ADMIN_USER=deploy bash scripts/deploy.sh
#
# Prerequisites on the VPS:
#   - Node 20+
#   - npm
#   - PM2 (npm install -g pm2)
#   - The fan web app already running on port 3002 under PM2 as "sportsphere"
#
set -euo pipefail

ADMIN_HOST="${ADMIN_HOST:-104.152.50.173}"
ADMIN_USER="${ADMIN_USER:-deploy}"
PROJECT_DIR="/var/www/sportsphere-admin"
FAN_APP_URL="http://127.0.0.1:3002/sportsphere"
ADMIN_PORT=3003
PM2_NAME="sportsphere-admin"

echo "==> Deploying SportSphere Admin to ${ADMIN_USER}@${ADMIN_HOST}:${PROJECT_DIR}"

# 1. Ensure project directory exists on the VPS
ssh "${ADMIN_USER}@${ADMIN_HOST}" "mkdir -p ${PROJECT_DIR}"

# 2. Rsync the local project (excluding node_modules and .next)
rsync -azP --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.git' \
  ./ "${ADMIN_USER}@${ADMIN_HOST}:${PROJECT_DIR}/"

# 3. Install deps, write .env, build, and (re)start PM2 — all on the VPS
ssh "${ADMIN_USER}@${ADMIN_HOST}" bash <<REMOTE
set -euo pipefail
cd ${PROJECT_DIR}

# Install deps
echo '==> Installing dependencies'
npm ci --no-audit --no-fund

# Write .env (idempotent — preserves ADMIN_COOKIE_SECRET if it exists)
if [ ! -f .env ]; then
  echo '==> Creating .env'
  cat > .env <<EOF
MAIN_APP_URL=${FAN_APP_URL}
PORT=${ADMIN_PORT}
ADMIN_COOKIE_SECRET=\$(openssl rand -hex 32)
NEXT_PUBLIC_ADMIN_URL=http://${ADMIN_HOST}:${ADMIN_PORT}
NEXT_PUBLIC_ADMIN_NAME=SportSphere Admin
NEXT_PUBLIC_MAIN_APP_URL=http://${ADMIN_HOST}:3002/sportsphere
EOF
  echo '  (new ADMIN_COOKIE_SECRET generated)'
else
  echo '==> .env exists — leaving it untouched'
fi

# Build
echo '==> Building Next.js'
npm run build

# Restart PM2
echo '==> (Re)starting PM2'
pm2 describe ${PM2_NAME} >/dev/null 2>&1 && pm2 restart ${PM2_NAME} || pm2 start "npm run start" --name ${PM2_NAME}
pm2 save

echo '==> Done. Admin console should be live at http://${ADMIN_HOST}:${ADMIN_PORT}'
REMOTE

echo
echo "==> Deploy complete."
echo "    Login URL:  http://${ADMIN_HOST}:${ADMIN_PORT}/login"
echo "    Dashboard:  http://${ADMIN_HOST}:${ADMIN_PORT}/dashboard"
