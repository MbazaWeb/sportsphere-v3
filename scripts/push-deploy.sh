#!/bin/bash
# ============================================================
#  Sportsphere — Local → VPS Deploy Trigger
#  Run this from your local machine:
#    chmod +x scripts/push-deploy.sh
#    ./scripts/push-deploy.sh
#
#  What it does:
#    1. Optionally pushes your current branch to GitHub
#    2. SSHes into the VPS and runs deploy-production.sh
# ============================================================
set -euo pipefail

VPS_IP="104.152.50.173"
VPS_USER="deploy"
APP_DIR="/var/www/sportsphere-nextjs"
DEPLOY_SCRIPT="$APP_DIR/scripts/deploy-production.sh"

# ─── Colours ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo -e "${BOLD}"
echo "======================================"
echo "  Sportsphere — Push & Deploy"
echo "  Target: $VPS_USER@$VPS_IP"
echo "======================================"
echo -e "${NC}"

# ─── Step 1: Push to GitHub (optional) ──────────────────────
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  log "Current branch: $BRANCH"

  if [[ -n "$(git status --porcelain)" ]]; then
    warn "You have uncommitted changes. Push will use last commit."
  fi

  read -rp "$(echo -e "${YELLOW}Push $BRANCH to GitHub before deploying? [Y/n]:${NC} ")" PUSH_CHOICE
  PUSH_CHOICE="${PUSH_CHOICE:-Y}"
  if [[ "$PUSH_CHOICE" =~ ^[Yy]$ ]]; then
    log "Pushing to origin/$BRANCH..."
    git push origin "$BRANCH"
    ok "Pushed to GitHub"
  else
    warn "Skipping GitHub push — VPS will pull whatever is on origin/main"
  fi
else
  warn "Not a git repo — skipping push step"
fi

# ─── Step 2: SSH into VPS and deploy ────────────────────────
log "Connecting to VPS and running deploy..."
echo ""

# sshpass allows non-interactive password auth.
# If you have SSH key auth set up, remove the sshpass line and use plain ssh.
if command -v sshpass &> /dev/null; then
  SSH_CMD="sshpass -e ssh"
  export SSHPASS="${VPS_PASSWORD:-}"
  if [[ -z "$SSHPASS" ]]; then
    read -rsp "$(echo -e "${YELLOW}VPS password for $VPS_USER@$VPS_IP:${NC} ")" SSHPASS
    echo ""
    export SSHPASS
  fi
else
  warn "sshpass not found — falling back to plain ssh (will prompt for password)"
  SSH_CMD="ssh"
fi

$SSH_CMD -o StrictHostKeyChecking=no -o ConnectTimeout=15 \
  "$VPS_USER@$VPS_IP" bash << 'REMOTE'
set -euo pipefail

APP_DIR="/var/www/sportsphere-nextjs"
DEPLOY_SCRIPT="$APP_DIR/scripts/deploy-production.sh"

echo ""
echo "=== Connected to $(hostname) as $(whoami) ==="
echo ""

# Ensure the deploy script is executable
if [ -f "$DEPLOY_SCRIPT" ]; then
  chmod +x "$DEPLOY_SCRIPT"
  bash "$DEPLOY_SCRIPT"
else
  echo "[!] deploy-production.sh not found at $DEPLOY_SCRIPT"
  echo "[!] Attempting manual git pull + pm2 restart instead..."
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
  git clean -fd
  npm install --legacy-peer-deps
  npx prisma generate
  npx prisma migrate deploy
  npm run build
  cd Admin && npm install --legacy-peer-deps && npm run build && cd ..
  pm2 restart ecosystem.config.cjs --update-env
  pm2 save
  echo "Done."
fi
REMOTE

echo ""
ok "Deploy complete!"
echo ""
echo -e "${BOLD}  Fan App:  https://sportssphere.fun/sportsphere${NC}"
echo -e "${BOLD}  Admin:    https://sportssphere.fun/sportsphere-admin${NC}"
echo ""
echo "  To tail logs:"
echo "    ssh $VPS_USER@$VPS_IP 'pm2 logs --lines 50'"
echo ""
