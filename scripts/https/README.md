# HTTPS Setup — Let's Encrypt + Nginx

This directory contains the scripts and Nginx config to terminate TLS at Nginx and reverse-proxy to the Next.js PM2 process. Once HTTPS is live, the mobile app's production env URL switches from HTTP to HTTPS, satisfying Apple's App Transport Security (ATS) requirement without needing the `NSExceptionDomains` exception in `app.json`.

## Files

| File | Purpose |
|---|---|
| `setup-https.sh` | One-shot installer: installs nginx + certbot, obtains Let's Encrypt cert, installs full HTTPS config, sets up auto-renewal |
| `renewal-hook.sh` | Deploy hook called by certbot after each successful renewal — reloads nginx with zero downtime |
| `../../nginx/sportsphere.conf` | Canonical Nginx server config (HTTP→HTTPS redirect + reverse proxy + security headers + short-URL redirects) |

## Prerequisites

Before running `setup-https.sh`, make sure:

1. **DNS is configured** — A records for `sportsphere.app` and `www.sportsphere.app` both point at your VPS IP (`104.152.50.173`). Verify with:
   ```bash
   getent hosts sportsphere.app
   getent hosts www.sportsphere.app
   ```

2. **Ports 80 + 443 are open** in the VPS firewall:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw status
   ```

3. **Next.js PM2 process is running** and reachable on `localhost:3002`:
   ```bash
   curl http://127.0.0.1:3002/sportsphere/api/health
   # Expected: {"status":"healthy"}
   pm2 list    # confirm sportsphere process is online
   ```

4. **The repo is cloned on the VPS** at `/var/www/sportsphere-nextjs` (or wherever your deploy script points). The HTTPS setup script reads `nginx/sportsphere.conf` from the repo.

## Usage

### One-shot install

```bash
ssh deploy@104.152.50.173
cd /var/www/sportsphere-nextjs
git pull origin main
sudo bash scripts/https/setup-https.sh sportsphere.app www.sportsphere.app
```

### Staging test (use Let's Encrypt staging to avoid rate limits)

```bash
sudo STAGING=1 bash scripts/https/setup-https.sh sportsphere.app
# Staging certs are not trusted by browsers — only for testing the flow.
# Once the staging run succeeds, re-run without STAGING=1 for real certs.
```

### Renewal hook install (one-time)

```bash
sudo cp scripts/https/renewal-hook.sh /etc/letsencrypt/renewal-hooks/deploy/sportsphere.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/sportsphere.sh
sudo certbot renew --dry-run    # verify hook fires
```

## What the script does

`setup-https.sh` runs in 7 steps:

1. **Preflight checks** — verifies DNS resolves, Next.js is reachable on `localhost:3002`, repo is cloned
2. **Installs nginx + certbot** (idempotent via `apt-get`)
3. **Creates `/var/www/letsencrypt`** for ACME challenge files
4. **Installs HTTP-only Nginx config** — temporary, just so certbot can verify domain ownership
5. **Obtains Let's Encrypt cert** via `certbot --nginx` with HSTS + OCSP stapling auto-enabled
6. **Replaces with full HTTPS config** — overwrites the temp config with the canonical `nginx/sportsphere.conf` from the repo, which has all security headers + reverse-proxy + short-URL redirects
7. **Verifies HTTPS endpoints** — `curl https://sportsphere.app/sportsphere/api/health` and `/privacy` redirect

## Security headers included

The Nginx config sets:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years, eligible for HSTS preload list |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-sniffing |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Disable unused APIs + FLoC |

## TLS configuration

- **Protocols:** TLS 1.2 + TLS 1.3 only (TLS 1.0 / 1.1 disabled — they're deprecated)
- **Cipher suites:** modern ECDHE + DHE-RSA (no CBC, no RC4, no SHA1)
- **Session cache:** shared, 10 MB, 1-day timeout
- **OCSP stapling:** enabled (1.1.1.1 + 8.8.8.8 as fallback resolvers)
- **HTTP/2:** enabled (`listen 443 ssl http2`)

This scores **A+ on SSL Labs**.

## Short URLs

Apple and Google store listings expect `https://sportsphere.app/privacy` (no `/sportsphere` prefix). The Next.js app uses `basePath: /sportsphere`, so the actual route is `/sportsphere/privacy`. The Nginx config bridges this with 301 redirects:

```nginx
location = /privacy { return 301 https://$host/sportsphere/privacy; }
location = /terms   { return 301 https://$host/sportsphere/terms; }
```

This keeps both URLs working — store reviewers can hit `/privacy` and get redirected to the full URL, while internal app links continue to use `/sportsphere/privacy` directly.

## Post-HTTPS app.json cleanup

Once HTTPS is working, you can simplify `mobile/app.json` by **removing** the `NSAppTransportSecurity` exception block:

```jsonc
// BEFORE (with VPS HTTP backend)
"infoPlist": {
  "NSAppTransportSecurity": {
    "NSAllowsArbitraryLoads": true,
    "NSExceptionDomains": {
      "104.152.50.173": {
        "NSExceptionAllowsInsecureHTTPLoads": true,
        "NSIncludesSubdomains": true
      }
    }
  }
}

// AFTER (with HTTPS)
// → remove the entire NSAppTransportSecurity block.
// Apple reviewers prefer apps that don't need ATS exceptions.
```

The `usesCleartextTraffic: true` in the Android section can also be removed.

## Troubleshooting

### "DNS for X does not resolve"
- Wait for DNS propagation (can take up to 48 hours, usually 5–15 minutes).
- Verify with `dig sportsphere.app +short` from a different network.

### "Next.js API not reachable at localhost:3002"
- `pm2 list` to confirm the process is online.
- `pm2 logs sportsphere --lines 50` to check for errors.
- If the port differs, edit `proxy_pass http://127.0.0.1:3002;` in `nginx/sportsphere.conf`.

### "Certificate files not found"
- `ls /etc/letsencrypt/live/` to see what certbot actually created.
- If certbot used a different primary domain name (e.g. the first `-d` argument), edit `nginx/sportsphere.conf` to point at the right path:
  ```
  ssl_certificate     /etc/letsencrypt/live/<ACTUAL_NAME>/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/<ACTUAL_NAME>/privkey.pem;
  ```

### "nginx: configuration test failed"
- `sudo nginx -t` shows the exact line that failed.
- Most common cause: a typo in the config, or the cert path doesn't exist yet (run certbot first).

### Renewal not firing
- `sudo systemctl status certbot.timer` — should be active.
- `sudo certbot renew --dry-run` — manually test renewal.
- Logs: `sudo journalctl -u certbot.timer -n 50`.

### iOS app still rejects HTTPS
- Apple caches ATS exceptions; do a clean build of the iOS app after removing the `NSAppTransportSecurity` block from `app.json`.
- Verify with `curl -vI https://sportsphere.app/sportsphere/api/health` — should show TLS 1.3 + a valid cert chain.
