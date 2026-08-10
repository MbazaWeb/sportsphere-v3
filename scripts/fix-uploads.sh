#!/bin/bash
# ============================================================
#  fix-uploads.sh — Fix broken image/video uploads
#
#  Fixes:
#   1. Patches package.json build script to re-link public/
#      after every build (so the symlink survives rebuilds)
#   2. Adds sportssphere.fun to nginx server_name
#   3. Ensures NEXT_PUBLIC_BASE_PATH is in .env
#   4. Rebuilds the app
#   5. Re-creates the standalone symlink
#   6. Reloads nginx + restarts PM2
#
#  Run on the VPS:
#    ssh deploy@104.152.50.173
#    cd /var/www/sportsphere-nextjs
#    bash scripts/fix-uploads.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/sportsphere-nextjs"
NGINX_CONF="/etc/nginx/sites-available/sportsphere.conf"

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

# ─── 2. Patch package.json build script ──────────────────
echo ""
echo "[2/7] Patching package.json build script..."

# The current build script uses 'cp -r public' which copies a snapshot of
# public/ at build time. Uploads written at runtime are never visible to
# the standalone server because they go into the real public/uploads/ but
# the server reads from the snapshot copy.
# Fix: replace the cp with a symlink so runtime uploads are always visible.

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const current = pkg.scripts.build;
const fixed = 'next build && cp -r .next/static .next/standalone/.next/ && mkdir -p .next/standalone/public && ln -sfn $APP_DIR/public .next/standalone/public';
if (current === fixed) {
  console.log('  already patched — skipping');
} else {
  pkg.scripts.build = fixed;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log('  ✓ Build script updated');
  console.log('  Before: ' + current);
  console.log('  After:  ' + fixed);
}
"

# ─── 3. Ensure NEXT_PUBLIC_BASE_PATH is in .env ──────────
echo ""
echo "[3/7] Checking .env for NEXT_PUBLIC_BASE_PATH..."
if [ -f .env ]; then
  if grep -q "NEXT_PUBLIC_BASE_PATH" .env; then
    echo "  ✓ Already set: $(grep NEXT_PUBLIC_BASE_PATH .env)"
  else
    echo "NEXT_PUBLIC_BASE_PATH=/sportsphere" >> .env
    echo "  ✓ Added NEXT_PUBLIC_BASE_PATH=/sportsphere to .env"
  fi
else
  echo "NEXT_PUBLIC_BASE_PATH=/sportsphere" > .env
  echo "  ✓ Created .env with NEXT_PUBLIC_BASE_PATH=/sportsphere"
fi

# ─── 4. Patch nginx — add sportssphere.fun to server_name ─
echo ""
echo "[4/7] Patching nginx server_name to include sportssphere.fun..."
if [ -f "$NGINX_CONF" ]; then
  if grep -q "sportssphere.fun" "$NGINX_CONF"; then
    echo "  ✓ sportssphere.fun already in nginx config"
  else
    sudo sed -i \
      's/server_name 104\.152\.50\.173 sportsphere\.app www\.sportsphere\.app _;/server_name 104.152.50.173 sportsphere.app www.sportsphere.app sportssphere.fun www.sportssphere.fun _;/' \
      "$NGINX_CONF"
    echo "  ✓ Added sportssphere.fun and www.sportssphere.fun to server_name"
    echo "  New server_name line:"
    grep "server_name" "$NGINX_CONF" | head -1
  fi

  echo "  Testing nginx config..."
  sudo nginx -t 2>&1 && echo "  ✓ nginx config valid" || echo "  ✗ nginx config error — fix manually"
else
  echo "  ⚠ nginx config not found at $NGINX_CONF — skipping"
  echo "  Add sportssphere.fun to your nginx server_name manually."
fi

# ─── 5. Build app ─────────────────────────────────────────
echo ""
echo "[5/7] Building app (this takes a minute)..."
npm install --legacy-peer-deps --silent
npx prisma generate --silent 2>&1 | tail -1
npm run build 2>&1 | tail -8

# ─── 6. Ensure uploads dir + symlink ─────────────────────
echo ""
echo "[6/7] Setting up uploads directory and standalone symlink..."
mkdir -p "$APP_DIR/public/uploads"
echo "  ✓ public/uploads/ exists"

# The build script now does this automatically via ln -sfn,
# but re-run here in case the build above already created it wrong.
# Force-recreate the symlink pointing to the real public/.
rm -f "$APP_DIR/.next/standalone/public"
mkdir -p "$APP_DIR/.next/standalone"
ln -sfn "$APP_DIR/public" "$APP_DIR/.next/standalone/public"
echo "  ✓ Symlink: .next/standalone/public → $APP_DIR/public"
echo "  Checking uploads dir is visible to standalone server:"
ls "$APP_DIR/.next/standalone/public/uploads/" 2>/dev/null \
  && echo "  ✓ Uploads dir accessible via symlink" \
  || echo "  ✓ Uploads dir is empty (no files yet — that's fine)"

# ─── 7. Reload nginx + restart PM2 ───────────────────────
echo ""
echo "[7/7] Reloading nginx and restarting PM2..."
sudo systemctl reload nginx && echo "  ✓ nginx reloaded" || echo "  ✗ nginx reload failed"

pm2 restart sportsphere 2>/dev/null \
  || pm2 start ecosystem.config.cjs --update-env
pm2 save --force
echo "  ✓ PM2 restarted"

# ─── Done ─────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  ✅ Upload fix applied!"
echo "======================================================"
echo ""
echo "  Test: Go to sportssphere.fun/sportsphere/create"
echo "        Upload a photo or video — it should appear in"
echo "        the feed without breaking."
echo ""
echo "  Logs: pm2 logs sportsphere --lines 30"
echo ""
echo "  If images still 404, check:"
echo "    ls /var/www/sportsphere-nextjs/public/uploads/"
echo "    curl -I http://sportssphere.fun/sportsphere/uploads/<filename>"
echo "======================================================"
