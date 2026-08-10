#!/bin/bash
# ============================================================
#  fix-db.sh — Fix missing database tables (e.g. "players")
#
#  Run on the VPS:
#    cd /var/www/sportsphere-nextjs
#    bash scripts/fix-db.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/sportsphere-nextjs"
cd "$APP_DIR"

echo ""
echo "======================================================"
echo "  SportSphere — Database Fix Script"
echo "======================================================"
echo ""

# ─── 1. Show current migration status ────────────────────
echo "[1/5] Checking migration status..."
npx prisma migrate status 2>&1 | tail -20
echo ""

# ─── 2. Apply all pending migrations ─────────────────────
echo "[2/5] Applying pending migrations..."
npx prisma migrate deploy 2>&1
echo "  ✓ Migrations applied"

# ─── 3. Verify players table now exists ──────────────────
echo ""
echo "[3/5] Verifying tables exist..."
DB_URL=$(grep DATABASE_URL .env | cut -d= -f2-)
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const tables = await prisma.\$queryRaw\`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    \`;
    console.log('  Tables in DB:');
    tables.forEach(t => console.log('   ✓', t.tablename));
    const hasPlayers = tables.some(t => t.tablename === 'players');
    if (hasPlayers) {
      console.log('');
      console.log('  ✓ players table exists');
    } else {
      console.log('');
      console.log('  ✗ players table STILL missing — check schema');
      process.exit(1);
    }
  } finally {
    await prisma.\$disconnect();
  }
}
check().catch(e => { console.error(e.message); process.exit(1); });
" 2>&1

# ─── 4. Run seeds if needed ──────────────────────────────
echo ""
echo "[4/5] Running role + KPI seeds (safe to re-run)..."
npx tsx prisma/seed-roles.ts 2>&1 | tail -3 || echo "  (seed-roles already seeded)"
npx tsx prisma/seed-kpi-config.ts 2>&1 | tail -3 || echo "  (seed-kpi-config already seeded)"

# ─── 5. Restart PM2 ──────────────────────────────────────
echo ""
echo "[5/5] Restarting PM2..."
pm2 restart sportsphere
pm2 logs sportsphere --lines 10 --nostream
echo "  ✓ Done"

echo ""
echo "======================================================"
echo "  ✅ Database fix complete!"
echo "======================================================"
echo ""
echo "  Verify: pm2 logs sportsphere --lines 30"
echo "======================================================"
