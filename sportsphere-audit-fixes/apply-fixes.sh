#!/usr/bin/env bash
# Apply SportSphere v3 audit fixes (P0/P1)
# Usage:
#   1. Place this folder next to your sportsphere-v3 repo OR run from inside the repo after extracting
#   2. cd into your sportsphere-v3 repo root
#   3. bash /path/to/apply-fixes.sh   OR   unzip -o sportsphere-audit-fixes.zip && bash apply-fixes.sh
set -euo pipefail

REPO_ROOT="$(pwd)"

echo "=== SportSphere Audit Fixes ==="
echo "Repo root: $REPO_ROOT"
echo

# Detect if we are already inside the extracted folder or need to find files relative to script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

copy_file() {
  local src="$1"
  local dest="$2"
  if [[ ! -f "$src" ]]; then
    echo "ERROR: Missing source file: $src"
    exit 1
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo "  ✓ $dest"
}

echo "Applying fixed files..."

copy_file "$SCRIPT_DIR/Admin/src/proxy.ts"                          "$REPO_ROOT/Admin/src/proxy.ts"
copy_file "$SCRIPT_DIR/scripts/ws-server.mjs"                       "$REPO_ROOT/scripts/ws-server.mjs"
copy_file "$SCRIPT_DIR/WebApp/next.config.ts"                       "$REPO_ROOT/WebApp/next.config.ts"
copy_file "$SCRIPT_DIR/WebApp/src/app/api/profile-data/route.ts"    "$REPO_ROOT/WebApp/src/app/api/profile-data/route.ts"

if [[ -f "$SCRIPT_DIR/AUDIT_FIXES_APPLIED.md" ]]; then
  cp "$SCRIPT_DIR/AUDIT_FIXES_APPLIED.md" "$REPO_ROOT/AUDIT_FIXES_APPLIED.md"
  echo "  ✓ AUDIT_FIXES_APPLIED.md"
fi

echo
echo "=== Done ==="
echo
echo "Next steps:"
echo "  1. Review the changes:  git diff"
echo "  2. Commit:              git add Admin/src/proxy.ts scripts/ws-server.mjs WebApp/next.config.ts WebApp/src/app/api/profile-data/route.ts AUDIT_FIXES_APPLIED.md"
echo "                          git commit -m \"fix: close P0/P1 audit issues (proxy role, WS auth, CORS, live profile-data)\""
echo "  3. Push:                git push origin main"
echo "  4. On VPS after pull, set env vars and restart:"
echo "       export WS_AUTH_SECRET=\$(openssl rand -base64 48)"
echo "       export WS_ALLOWED_ORIGINS=\"https://sportsphere.app,https://www.sportsphere.app\""
echo "       export CORS_ORIGIN=\"https://sportsphere.app\""
echo "       pm2 restart all   # or your process manager"
echo
