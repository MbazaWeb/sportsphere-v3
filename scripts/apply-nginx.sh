#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/var/www/sportsphere-nextjs}"
SRC="$ROOT/nginx.conf"
DEST="/etc/nginx/sites-available/sportsphere"
LINK="/etc/nginx/sites-enabled/sportsphere"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC"
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Re-run with sudo: sudo bash $0"
  exit 1
fi

cp -a "$DEST" "${DEST}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
cp "$SRC" "$DEST"
ln -sfn "$DEST" "$LINK"

# Drop default site so / is not a 404 from another vhost
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# Keep websocket process up
if command -v pm2 >/dev/null 2>&1; then
  su - deploy -c "cd $ROOT && pm2 startOrReload $ROOT/ecosystem.config.cjs --only sportsphere-ws" 2>/dev/null \
    || pm2 startOrReload "$ROOT/ecosystem.config.cjs" --only sportsphere-ws \
    || true
fi

echo "OK"
echo "  https://sportssphere.fun/            -> /sportsphere"
echo "  https://sportssphere.fun/sportsphere"
echo "  https://sportssphere.fun/sportsphere-admin/login"
echo "  /socket.io -> 127.0.0.1:3004"
