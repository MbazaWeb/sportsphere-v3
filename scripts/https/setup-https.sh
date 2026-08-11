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
#   - DNS A record for sportssphere.fun → your VPS IP (104.152.50.173)
#   - DNS A record for www.sportssphere.fun → same IP (optional but recommended)
#   - Ports 80 + 443 open in your VPS firewall (ufw allow 80,443/tcp)
#   - Next.js PM2 process running on 127.0.0.1:3002 (verify: curl http://localhost:3002/sportsphere/api/health)
#
# USAGE:
#   sudo bash scripts/https/setup-https.sh sportssphere.fun
#   sudo bash scripts/https/setup-https.sh sportssphere.fun www.sportssphere.fun
#
# After successful run, verify:
#   curl -I https://sportssphere.fun/sportsphere/api/health
#   curl -I https://sportssphere.fun/privacy     # → 301 → /sportsphere/privacy
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
  echo "Example: sudo bash $0 sportssphere.fun www.sportssphere.fun"
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

# Check DNS resolution + verify each domain points at THIS VPS
# (Let's Encrypt's HTTP-01 challenge will silently fail if DNS routes traffic
#  elsewhere — e.g. through AWS Global Accelerator or Cloudflare proxy)
#
# We detect BOTH IPv4 and IPv6 of the VPS separately, because:
#  - DNS records are usually A (IPv4) — comparing them against the VPS's IPv6
#    (which curl prefers when the VPS has v6 connectivity) would always mismatch
#  - A records hold IPv4; AAAA records hold IPv6; mixing them is invalid
# We then compare each domain's resolved IPs (both v4 and v6 from getent)
# against EITHER detected VPS IP — a match on either is OK.
VPS_PUBLIC_IPV4="${VPS_PUBLIC_IPV4:-${VPS_PUBLIC_IP:-}}"
VPS_PUBLIC_IPV6="${VPS_PUBLIC_IPV6:-}"

# Auto-detect IPv4 (force -4 so we don't get back IPv6 from providers that
# return whatever the request came from)
if [[ -z "$VPS_PUBLIC_IPV4" ]]; then
  for url in https://api.ipify.org https://ifconfig.me https://ipv4.icanhazip.com; do
    VPS_PUBLIC_IPV4=$(curl -4 -fsS --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]') || true
    [[ -n "$VPS_PUBLIC_IPV4" ]] && break
  done
fi

# Auto-detect IPv6 (force -6; non-fatal if VPS has no v6 connectivity)
if [[ -z "$VPS_PUBLIC_IPV6" ]]; then
  for url in https://api64.ipify.org https://ifconfig.me https://ipv6.icanhazip.com; do
    VPS_PUBLIC_IPV6=$(curl -6 -fsS --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]') || true
    # Discard obviously-non-v6 results (some endpoints fall back to v4 even with -6)
    if [[ -n "$VPS_PUBLIC_IPV6" && "$VPS_PUBLIC_IPV6" != *":"* ]]; then
      VPS_PUBLIC_IPV6=""
    fi
    [[ -n "$VPS_PUBLIC_IPV6" ]] && break
  done
fi

# Build a display string + accept-either list
VPS_IPS_DISPLAY=""
VPS_IPS_ARGS=()
if [[ -n "$VPS_PUBLIC_IPV4" ]]; then
  VPS_IPS_DISPLAY+="$VPS_PUBLIC_IPV4"
  VPS_IPS_ARGS+=("$VPS_PUBLIC_IPV4")
fi
if [[ -n "$VPS_PUBLIC_IPV6" ]]; then
  [[ -n "$VPS_IPS_DISPLAY" ]] && VPS_IPS_DISPLAY+=" / "
  VPS_IPS_DISPLAY+="$VPS_PUBLIC_IPV6"
  VPS_IPS_ARGS+=("$VPS_PUBLIC_IPV6")
fi

if [[ ${#VPS_IPS_ARGS[@]} -eq 0 ]]; then
  warn "Could not auto-detect VPS public IP (neither v4 nor v6) — skipping DNS-target sanity check."
  warn "If Let's Encrypt verification fails, set VPS_PUBLIC_IPV4 manually:"
  warn "  sudo VPS_PUBLIC_IPV4=104.152.50.173 bash $0 $*"
else
  log "VPS public IPs detected: $VPS_IPS_DISPLAY"
fi

# Helper: does the resolved IP list contain any VPS IP?
ip_matches_any() {
  local needle="$1"; shift
  for hay in "$@"; do
    [[ "$needle" == "$hay" ]] && return 0
  done
  return 1
}

DNS_MISMATCH=0
for d in "${DOMAINS[@]}"; do
  if ! getent hosts "$d" >/dev/null; then
    err "DNS for $d does not resolve. Add an A record pointing to this VPS first."
    exit 1
  fi
  # getent hosts returns multiple lines: "<ip> <fqdn> <aliases>" — collect all IPs
  mapfile -t RESOLVED_IPS < <(getent hosts "$d" | awk '{print $1}')
  log "DNS $d → ${RESOLVED_IPS[*]}"
  if [[ ${#VPS_IPS_ARGS[@]} -gt 0 ]]; then
    MATCHED=0
    for rip in "${RESOLVED_IPS[@]}"; do
      if ip_matches_any "$rip" "${VPS_IPS_ARGS[@]}"; then
        MATCHED=1
        break
      fi
    done
    if [[ $MATCHED -eq 0 ]]; then
      warn "  ↳ $d resolves to ${RESOLVED_IPS[*]}, NONE of which match this VPS ($VPS_IPS_DISPLAY)"
      warn "  ↳ Let's Encrypt verification will FAIL because the challenge request"
      warn "  ↳ will be routed elsewhere (e.g. AWS Global Accelerator, Cloudflare proxy, CDN)."
      if [[ -n "$VPS_PUBLIC_IPV4" ]]; then
        warn "  ↳ Fix: at your DNS provider, set an A record (IPv4) for $d → $VPS_PUBLIC_IPV4"
      fi
      if [[ -n "$VPS_PUBLIC_IPV6" ]]; then
        warn "  ↳   or: set an AAAA record (IPv6) for $d → $VPS_PUBLIC_IPV6"
      fi
      warn "  ↳       (not a CNAME, not a CDN/proxy — must be a plain A/AAAA record to the VPS IP)"
      warn "  ↳ Then wait for DNS propagation (5–15 min typically) and re-run this script."
      DNS_MISMATCH=1
    fi
  fi
done
if [[ $DNS_MISMATCH -ne 0 ]]; then
  err "Aborting: DNS does not point at this VPS. Fix the A/AAAA records and retry."
  err "To override (NOT recommended — Let's Encrypt will still fail):"
  err "  sudo SKIP_DNS_CHECK=1 bash $0 $*"
  if [[ "${SKIP_DNS_CHECK:-0}" != "1" ]]; then
    exit 1
  fi
  warn "SKIP_DNS_CHECK=1 set — proceeding anyway (will likely fail at certbot step)"
fi

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
  # NOTE: --stapling-ocsp was removed — only available in certbot >= 1.24.
  # Ubuntu 22.04 ships certbot 1.21.0. OCSP stapling is already configured
  # directly in nginx/sportsphere.conf via ssl_stapling on; ssl_stapling_verify on;
  # so we don't need certbot to enable it.
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
  1. Update mobile/eas.json production env URL (already points to https://sportssphere.fun/sportsphere)
  2. Run mobile/scripts/credentials-check.sh to verify the production URL is HTTPS
  3. Update mobile/app.json iOS NSAppTransportSecurity — you can now REMOVE the
     NSExceptionDomains entry for 104.152.50.173 (no longer needed once HTTPS works)
  4. Submit to App Store / Play Store per mobile/store/SUBMISSION_GUIDE.md

EOF
