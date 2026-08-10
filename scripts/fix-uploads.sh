#!/bin/bash
# ============================================================
#  fix-uploads.sh — Fix broken image/video uploads
#
#  Run on the VPS:
#    ssh deploy@104.152.50.173
#    cd /var/www/sportsphere-nextjs
#    git pull origin main
#    bash scripts/fix-uploads.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/sportsphere-nextjs"

echo ""
echo "======================================================"
echo "  SportSphere — Upload Fix Script"
echo "======================================================"
echo ""

cd "$APP_DIR"

# ─── 1. Pull latest code ──────────────────────────────────
echo "[1/7] Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main
echo "  ✓ Code up to date"

# ─── 2. package.json already patched in repo ─────────────
echo ""
echo "[2/7] Checking package.json build script..."
CURRENT=$(node -e "const p=require('./package.json');console.log(p.scripts.build)")
if echo "$CURRENT" | grep -q "ln -sfn"; then
  echo "  ✓ Build script already uses symlink"
else
  echo "  ✗ Build script missing symlink — patching..."
  node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.build = 'next build && cp -r .next/static .next/standalone/.next/ && mkdir -p .next/standalone/public && ln -sfn /var/www/sportsphere-nextjs/public .next/standalone/public';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('  ✓ Patched');
  "
fi

# ─── 3. Ensure NEXT_PUBLIC_BASE_PATH is in .env ──────────
echo ""
echo "[3/7] Checking .env for NEXT_PUBLIC_BASE_PATH..."
if [ -f .env ] && grep -q "NEXT_PUBLIC_BASE_PATH" .env; then
  echo "  ✓ Already set: $(grep NEXT_PUBLIC_BASE_PATH .env)"
else
  echo "NEXT_PUBLIC_BASE_PATH=/sportsphere" >> .env
  echo "  ✓ Added NEXT_PUBLIC_BASE_PATH=/sportsphere"
fi

# ─── 4. Fix nginx — copy updated conf from repo ──────────
echo ""
echo "[4/7] Updating nginx config with sportssphere.fun domain..."

# Find where nginx is actually loading the config from
NGINX_CONF=""
for candidate in \
  /etc/nginx/sites-enabled/sportsphere.conf \
  /etc/nginx/sites-available/sportsphere.conf \
  /etc/nginx/conf.d/sportsphere.conf \
  /etc/nginx/nginx.conf; do
  if [ -f "$candidate" ]; then
    NGINX_CONF="$candidate"
    break
  fi
done

if [ -z "$NGINX_CONF" ]; then
  echo "  ⚠ Could not find nginx config — skipping"
else
  echo "  Found nginx config: $NGINX_CONF"

  if grep -q "sportssphere.fun" "$NGINX_CONF"; then
    echo "  ✓ sportssphere.fun already present"
  else
    # Patch whatever server_name line is there to add the domain
    sudo sed -i -E \
      's/(server_name[^;]+);/\1 sportssphere.fun www.sportssphere.fun;/' \
      "$NGINX_CONF"
    echo "  ✓ Added sportssphere.fun to server_name"
    echo "  New line: $(grep 'server_name' "$NGINX_CONF" | grep -v '#' | head -1)"
  fi

  # Also copy the repo's nginx conf to sites-available if it differs
  SITES_AVAIL="/etc/nginx/sites-available/sportsphere.conf"
  SITES_ENABLED="/etc/nginx/sites-enabled/sportsphere.conf"
  if [ ! -f "$SITES_ENABLED" ] && [ -f "$SITES_AVAIL" ]; then
    sudo ln -sfn "$SITES_AVAIL" "$SITES_ENABLED"
    echo "  ✓ Enabled nginx site"
  fi

  echo "  Testing nginx config..."
  if sudo nginx -t 2>&1; then
    echo "  ✓ nginx config valid"
  else
    echo "  ✗ nginx config error — restore backup and check manually"
    exit 1
  fi
fi

# ─── 5. Build app ─────────────────────────────────────────
echo ""
echo "[5/7] Building app (this takes ~2 minutes)..."
npm install --legacy-peer-deps --silent
npx prisma generate 2>&1 | tail -1
npm run build 2>&1 | tail -10
echo "  ✓ Build complete"

# ─── 6. Ensure uploads dir + symlink ─────────────────────
echo ""
echo "[6/7] Setting up uploads directory and standalone symlink..."
mkdir -p "$APP_DIR/public/uploads"
echo "  ✓ public/uploads/ exists"

# Force-recreate symlink (build script does this but double-check)
rm -rf "$APP_DIR/.next/standalone/public"
mkdir -p "$APP_DIR/.next/standalone"
ln -sfn "$APP_DIR/public" "$APP_DIR/.next/standalone/public"
echo "  ✓ Symlink: .next/standalone/public → $APP_DIR/public"
ls "$APP_DIR/.next/standalone/public/" | head -5
echo "  ✓ Symlink resolves correctly"

# ─── 7. Reload nginx + restart PM2 ───────────────────────
echo ""
echo "[7/7] Reloading nginx and restarting PM2..."
sudo systemctl reload nginx && echo "  ✓ nginx reloaded"
pm2 restart sportsphere 2>/dev/null || pm2 start ecosystem.config.cjs --update-env
pm2 save --force
echo "  ✓ PM2 restarted"

# ─── Done ─────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  ✅ Upload fix applied!"
echo "======================================================"
echo ""
echo "  Test uploads: https://sportssphere.fun/sportsphere/create"
echo "  Check logs:   pm2 logs sportsphere --lines 30"
echo ""
echo "  If images still 404:"
echo "    ls /var/www/sportsphere-nextjs/public/uploads/"
echo "    curl -I http://sportssphere.fun/sportsphere/uploads/<filename>"
echo "======================================================"
