#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sportsphere — Let's Encrypt renewal deploy hook
# ─────────────────────────────────────────────────────────────────────────────
# Called automatically by certbot after a successful certificate renewal.
# Reloads nginx so the new certificate is picked up without dropping
# in-flight connections.
#
# Install (run once on the VPS):
#   sudo cp scripts/https/renewal-hook.sh /etc/letsencrypt/renewal-hooks/deploy/sportsphere.sh
#   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/sportsphere.sh
#
# Test:
#   sudo certbot renew --dry-run
#   # Should log "Sportsphere: nginx reloaded after cert renewal"
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "[$(date -Iseconds)] Sportsphere: nginx reloaded after cert renewal"
systemctl reload nginx

# Optional: notify a monitoring endpoint
# curl -fsS -X POST https://monitor.example.com/webhook/cert-renewed -d "host=$(hostname)" || true

exit 0
