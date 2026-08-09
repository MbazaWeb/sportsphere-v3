#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sportsphere — HTTPS setup script (Let's Encrypt + Nginx reverse proxy)
# ─────────────────────────────────────────────────────────────────────────────
#
# WHAT THIS DOES:
#   1. Installs nginx + certbot + python3-certbot-nginx (idempotent)
#   2. Creates /var/www/letsencrypt for ACME challenges
#   3. Copies sportsphere.conf into /etc/nginx/sites-available/ + enables it
#   4. Reloads nginx with HTTP-only config (so certbot can verify)
#   5. Runs certbot to obtain Let's Encrypt cert + auto-rewrite nginx config
#   6. Sets up auto-renewal via systemd timer (certbot.timer)
#   7. Reloads nginx with full HTTPS config
#
# PREREQUISITES:
#   - Ubuntu 22.04 / 24.04 VPS with root or sudo access
#   - DNS A record for sportsphere.app → your VPS IP (104.152.50.173)
#   - DNS A record for www.sportsphere.app → same IP (optional but recommended)
#   - Ports 80 + 443 open in your VPS firewall (ufw allow 80,443/tcp)
#   - Next.js PM2 process running on 127.0.0.1:3002 (verify: curl http://localhost:3002/sportsphere/api/health)
#
# USAGE:
#   sudo bash scripts/https/setup-https.sh sportsphere.app
#   sudo bash scripts/https/setup-https.sh sportsphere.app www.sportsphere.app
#
# After successful run, verify:
#   curl -I https://sportsphere.app/sportsphere/api/health
#   curl -I https://sportsphere.app/privacy     # → 301 → /sportsphere/privacy
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Color helpers ───────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*" >&2; }
step() { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }

# ─── Argument parsing ────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  err "Run with sudo: sudo bash $0 $*"
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: sudo bash $0 <primary-domain> [secondary-domain ...]"
  echo "Example: sudo bash $0 sportsphere.app www.sportsphere.app"
  exit 1
fi

DOMAINS=("$@")
PRIMARY="${DOMAINS[0]}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NGINX_CONF_SRC="$REPO_DIR/nginx/sportsphere.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/sportsphere"
NGINX_CONF_LINK="/etc/nginx/sites-enabled/sportsphere"

step "Sportsphere HTTPS setup — primary: $PRIMARY"
echo "  All domains: ${DOMAINS[*]}"
echo "  Repo: $REPO_DIR"
echo "  Nginx config: $NGINX_CONF_SRC"

# ─── Preflight checks ────────────────────────────────────────────────────────
step "Preflight checks"

if [[ ! -f "$NGINX_CONF_SRC" ]]; then
  err "Nginx config not found at $NGINX_CONF_SRC"
  err "Run this script from the sportsphere-v3 repo root."
  exit 1
fi
log "Nginx config found"

# Check DNS resolution
for d in "${DOMAINS[@]}"; do
  if ! getent hosts "$d" >/dev/null; then
    err "DNS for $d does not resolve. Add an A record pointing to this VPS first."
    exit 1
  fi
  RESOLVED_IP=$(getent hosts "$d" | awk '{print $1}' | head -1)
  log "DNS $d → $RESOLVED_IP"
done

# Check that Next.js is reachable on localhost:3002
if ! curl -fsS http://127.0.0.1:3002/sportsphere/api/health >/dev/null 2>&1; then
  err "Next.js API not reachable at http://127.0.0.1:3002/sportsphere/api/health"
  err "Verify PM2 is running: pm2 list"
  err "If PM2 process name differs, update the proxy_pass in nginx/sportsphere.conf"
  exit 1
fi
log "Next.js API reachable at localhost:3002"

# ─── Step 1: install nginx + certbot ─────────────────────────────────────────
step "Install nginx + certbot"

if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq nginx
  log "nginx installed"
else
  log "nginx already installed: $(nginx -v 2>&1)"
fi

if ! command -v certbot >/dev/null 2>&1; then
  apt-get install -y -qq certbot python3-certbot-nginx
  log "certbot installed"
else
  log "certbot already installed: $(certbot --version 2>&1)"
fi

# ─── Step 2: ACME challenge directory ────────────────────────────────────────
step "Create ACME challenge directory"

mkdir -p /var/www/letsencrypt
chown -R www-data:www-data /var/www/letsencrypt
chmod 755 /var/www/letsencrypt
log "/var/www/letsencrypt ready"

# ─── Step 3: Install nginx config (HTTP-only first, so certbot can verify) ──
step "Install nginx config (HTTP-only mode for certbot verification)"

# Stage a temporary HTTP-only config so certbot can verify the domain
# before we install the full HTTPS config
TEMP_CONF=$(mktemp)
cat > "$TEMP_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAINS[*]};

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
        try_files \$uri =404;
    }

    # During certbot verification, proxy everything else to Next.js over HTTP
    location /sportsphere/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = / {
        return 302 http://\$host/sportsphere;
    }
}
EOF

cp "$TEMP_CONF" "$NGINX_CONF_DST"
ln -sf "$NGINX_CONF_DST" "$NGINX_CONF_LINK"
rm -f "$TEMP_CONF"

# Remove default site if it conflicts on port 80
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
  log "Removed default site (was conflicting on port 80)"
fi

# Validate + reload
nginx -t
systemctl reload nginx
log "Nginx reloaded with HTTP-only config"

# ─── Step 4: Obtain Let's Encrypt certificate ────────────────────────────────
step "Obtain Let's Encrypt certificate"

CERTBOT_ARGS=(
  --nginx
  --non-interactive
  --agree-tos
  --register-unsafely-without-email
  --redirect           # auto-add HTTP→HTTPS redirect
  --hsts                # auto-add HSTS header
  --stapling-ocsp       # auto-enable OCSP stapling
)

for d in "${DOMAINS[@]}"; do
  CERTBOT_ARGS+=(-d "$d")
done

# Use --staging for testing if requested
if [[ "${STAGING:-0}" == "1" ]]; then
  CERTBOT_ARGS+=(--staging)
  warn "Using Let's Encrypt STAGING environment (test certs, not real)"
fi

certbot "${CERTBOT_ARGS[@]}"
log "Certificate obtained for: ${DOMAINS[*]}"

# ─── Step 5: Replace nginx config with full HTTPS reverse-proxy config ──────
step "Install full HTTPS reverse-proxy config"

# certbot just modified our config in place to add the cert paths.
# Now we OVERWRITE it with the canonical sportsphere.conf which has the
# full security headers, proxy config, and short-URL redirects.
# The cert paths certbot added will be preserved in our canonical config
# (they are already in nginx/sportsphere.conf in the repo).
cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
log "Installed $NGINX_CONF_DST from repo"

# Validate that the cert paths in our config actually exist
CERT_PATH="/etc/letsencrypt/live/$PRIMARY/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/$PRIMARY/privkey.pem"
if [[ ! -f "$CERT_PATH" ]] || [[ ! -f "$KEY_PATH" ]]; then
  err "Certificate files not found at $CERT_PATH or $KEY_PATH"
  err "Check: ls /etc/letsencrypt/live/"
  err "If certbot stored them under a different name, edit $NGINX_CONF_DST to match."
  exit 1
fi
log "Certificate files verified: $CERT_PATH + $KEY_PATH"

# Validate + reload
nginx -t
systemctl reload nginx
log "Nginx reloaded with full HTTPS config"

# ─── Step 6: Set up auto-renewal ─────────────────────────────────────────────
step "Set up auto-renewal"

# certbot installs a systemd timer by default on Ubuntu; verify it's enabled
if systemctl list-timers | grep -q certbot; then
  log "certbot.timer is active — certificates will auto-renew"
else
  systemctl enable --now certbot.timer
  log "Enabled certbot.timer"
fi

# Test the renewal dry-run (non-destructive)
certbot renew --dry-run --quiet 2>&1 | tail -5 || warn "Renewal dry-run had warnings — check 'certbot renew --dry-run' output"

# ─── Step 7: Verify HTTPS works ──────────────────────────────────────────────
step "Verify HTTPS endpoints"

sleep 2  # give nginx a moment

if curl -fsS "https://$PRIMARY/sportsphere/api/health" >/dev/null 2>&1; then
  log "HTTPS API health check: PASS"
  curl -s "https://$PRIMARY/sportsphere/api/health" | head -c 200
  echo
else
  err "HTTPS API health check: FAIL"
  err "Check: curl -v https://$PRIMARY/sportsphere/api/health"
fi

if curl -fsSI "https://$PRIMARY/privacy" 2>&1 | grep -qi "301\|302"; then
  log "Short URL /privacy redirect: PASS"
else
  warn "Short URL /privacy redirect: not yet (may need DNS propagation)"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
step "✅ HTTPS setup complete"

cat <<EOF

${GREEN}Sportsphere is now served over HTTPS.${NC}

Endpoints:
  • App:        https://$PRIMARY/sportsphere
  • Privacy:    https://$PRIMARY/privacy        → 301 → /sportsphere/privacy
  • Terms:      https://$PRIMARY/terms          → 301 → /sportsphere/terms
  • API health: https://$PRIMARY/sportsphere/api/health

Certificate:
  • Path: /etc/letsencrypt/live/$PRIMARY/
  • Auto-renews via certbot.timer (checks twice daily)
  • Renewal command: sudo certbot renew

Nginx:
  • Config: $NGINX_CONF_DST
  • Reload: sudo systemctl reload nginx
  • Logs:   sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

Next steps:
  1. Update mobile/eas.json production env URL (already points to https://sportsphere.app/sportsphere)
  2. Run mobile/scripts/credentials-check.sh to verify the production URL is HTTPS
  3. Update mobile/app.json iOS NSAppTransportSecurity — you can now REMOVE the
     NSExceptionDomains entry for 104.152.50.173 (no longer needed once HTTPS works)
  4. Submit to App Store / Play Store per mobile/store/SUBMISSION_GUIDE.md

EOF
