#!/bin/bash
# ============================================================
#  Hotfix: Fix broken image/video uploads in standalone mode
#  Run this on the VPS:  bash scripts/hotfix-uploads.sh
# ============================================================
set -euo pipefail

cd /var/www/sportsphere-nextjs

echo "[1/6] Pulling latest changes..."
git pull origin main

echo "[2/6] Prisma generate + migrate..."
npx prisma generate
npx prisma migrate deploy

echo "[3/6] Rebuilding..."
npm run build 2>&1 | tail -5

# Create symlink so standalone server can see public/uploads/
echo "[4/6] Linking public/ into standalone output..."
mkdir -p .next/standalone/public
ln -sfn ../../public .next/standalone/public

# Copy static assets if missing
if [ ! -d ".next/standalone/.next/static" ]; then
  echo "  Copying .next/static/ → .next/standalone/.next/static/"
  mkdir -p .next/standalone/.next/static
  cp -r .next/static/* .next/standalone/.next/static/
fi

echo "[5/6] Restarting PM2..."
pm2 restart sportsphere 2>/dev/null || pm2 start ecosystem.config.cjs --update-env
pm2 save

echo "[6/6] Updating nginx config..."
# Copy the nginx config with uploads location block
sudo cp nginx/sportsphere.conf /etc/nginx/sites-available/sportsphere.conf 2>/dev/null || true
sudo cp nginx.conf /etc/nginx/sites-available/sportsphere.conf 2>/dev/null || true
sudo nginx -t 2>&1 && sudo systemctl reload nginx 2>&1 || echo "  (nginx update skipped — config may differ on server)"

echo ""
echo "======================================"
echo "  Uploads hotfix applied!"
echo "======================================"
echo ""
echo "  Test: Upload a photo in the app and verify it shows in the feed."
echo "  Logs: pm2 logs sportsphere"
echo "======================================"
