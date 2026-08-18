#!/usr/bin/env bash
set -euo pipefail
cd /var/www/sportsphere-nextjs/WebApp
set -a
[ -f .env.local ] && . ./.env.local
[ -f .env ] && . ./.env
set +a
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in WebApp/.env.local"
  exit 1
fi
echo "Building with $NEXT_PUBLIC_SUPABASE_URL"
npm run build
pm2 restart sportsphere
echo "OK — hard refresh https://sportssphere.fun/sportsphere"
