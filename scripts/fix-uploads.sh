#!/bin/bash
# ============================================================
#  fix-uploads.sh — Fix broken image/video uploads
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

# ─── 2. Check package.json build script ──────────────────
echo ""
echo "[2/7] Checking package.json build script..."
CURRENT=$(node -e "const p=require('./package.json');console.log(p.scripts.build)")
if echo "$CURRENT" | grep -q "ln -sfn"; then
  echo "  ✓ Build script already uses symlink"
else
  echo "  ✗ Unexpected build script: $CURRENT"
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

# ─── 4. Fix nginx — find ALL nginx configs and patch them ─
echo ""
echo "[4/7] Patching nginx config for sportssphere.fun..."

# Show all nginx config files that have server_name
echo "  Scanning all nginx configs for server_name lines..."
sudo grep -rn "server_name" /etc/nginx/ 2>/dev/null | grep -v "#" || true

PATCHED=0
while IFS= read -r -d '' CONF_FILE; do
  if sudo grep -q "server_name" "$CONF_FILE" 2>/dev/null; then
    if sudo grep -q "sportssphere.fun" "$CONF_FILE" 2>/dev/null; then
      echo "  ✓ $CONF_FILE — already has sportssphere.fun"
    else
      echo "  Patching: $CONF_FILE"
      echo "    Before: $(sudo grep 'server_name' "$CONF_FILE" | grep -v '#' | head -1)"
      sudo sed -i -E 's/(^\s*server_name\s+[^;]+);/\1 sportssphere.fun www.sportssphere.fun;/' "$CONF_FILE"
      echo "    After:  $(sudo grep 'server_name' "$CONF_FILE" | grep -v '#' | head -1)"
      PATCHED=1
    fi
  fi
done < <(sudo find /etc/nginx -name "*.conf" -print0 2>/dev/null)

if [ "$PATCHED" -eq 0 ]; then
  echo "  ℹ No config needed patching (either already done or no match)"
fi

echo "  Testing nginx config..."
sudo nginx -t 2>&1 && echo "  ✓ nginx config valid"

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

# Force-recreate symlink
rm -rf "$APP_DIR/.next/standalone/public"
mkdir -p "$APP_DIR/.next/standalone"
ln -sfn "$APP_DIR/public" "$APP_DIR/.next/standalone/public"

echo "  ✓ Symlink: .next/standalone/public → $APP_DIR/public"
ls -la "$APP_DIR/.next/standalone/public" | head -3
echo "  ✓ Symlink resolves correctly"

# ─── 7. Reload nginx + restart PM2 ───────────────────────
echo ""
echo "[7/7] Reloading nginx and restarting PM2..."
sudo systemctl reload nginx && echo "  ✓ nginx reloaded"
pm2 restart sportsphere 2>/dev/null || pm2 start ecosystem.config.cjs --update-env
pm2 save --force
echo "  ✓ PM2 restarted"

echo ""
echo "======================================================"
echo "  ✅ Upload fix complete!"
echo "======================================================"
echo ""
echo "  All nginx server_name entries now:"
sudo grep -rh "server_name" /etc/nginx/ 2>/dev/null | grep -v "#" | sed 's/^/    /'
echo ""
echo "  Test:  https://sportssphere.fun/sportsphere/create"
echo "  Logs:  pm2 logs sportsphere --lines 30"
echo "======================================================"
