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

1. **DNS is configured** — **plain A records** (not CNAME, not a CDN proxy) for `sportssphere.fun` and `www.sportssphere.fun` both pointing directly at your VPS IP (`104.152.50.173`). Verify with:
   ```bash
   getent hosts sportssphere.fun
   getent hosts www.sportssphere.fun
   # Expected: both lines should show 104.152.50.173
   ```
   **If the resolved IP is anything else** (e.g. `13.248.x.x` or `76.223.x.x` — AWS Global Accelerator IPs, which appear if the domain is set up as an AWS-managed endpoint), Let's Encrypt's HTTP-01 challenge will be routed to AWS instead of your VPS and verification will fail. The setup script auto-detects this and aborts before calling certbot.

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
sudo bash scripts/https/setup-https.sh sportssphere.fun www.sportssphere.fun
```

### Staging test (use Let's Encrypt staging to avoid rate limits)

```bash
sudo STAGING=1 bash scripts/https/setup-https.sh sportssphere.fun
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
7. **Verifies HTTPS endpoints** — `curl https://sportssphere.fun/sportsphere/api/health` and `/privacy` redirect

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

Apple and Google store listings expect `https://sportssphere.fun/privacy` (no `/sportsphere` prefix). The Next.js app uses `basePath: /sportsphere`, so the actual route is `/sportsphere/privacy`. The Nginx config bridges this with 301 redirects:

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
- Verify with `dig sportssphere.fun +short` from a different network.

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

### "certbot: error: unrecognized arguments: --stapling-ocsp"
This happens on older certbot (< 1.24, e.g. Ubuntu 22.04 ships certbot 1.21.0). The `--stapling-ocsp` flag was removed from `setup-https.sh` in this case — OCSP stapling is now enabled directly in `nginx/sportsphere.conf` via `ssl_stapling on; ssl_stapling_verify on;`, so certbot doesn't need to set it up. If you see this error, pull the latest version of the script:
```bash
cd /var/www/sportsphere-nextjs
git pull origin main
sudo bash scripts/https/setup-https.sh sportssphere.fun www.sportssphere.fun
```

### "Aborting: DNS does not point at this VPS"
The script's preflight check resolved your domain and found that none of its IPs match this VPS's public IPs. Let's Encrypt verification would silently fail in this case, so the script aborts before calling certbot. To fix:
1. Log into your DNS provider (Route 53, Cloudflare, Namecheap, etc.)
2. Find the existing record for the domain shown in the warning — likely either:
   - An **A record** (IPv4) pointing at an AWS IP like `13.248.243.5` (Global Accelerator), or
   - A **CNAME / ALIAS** pointing at an AWS-managed DNS name (e.g. `*.cloudfront.net`)
3. **Delete it** and create a **plain A record** (IPv4) → the VPS's IPv4 (shown in the warning as `VPS public IPs detected: <ipv4> / <ipv6>`)
4. If your VPS also has IPv6 connectivity, you can additionally create an **AAAA record** (IPv6) → the VPS's IPv6. Optional but recommended for v6-capable clients.
5. **Important:** if the record is currently a CNAME pointing at an AWS endpoint, **do not just edit the value — delete the CNAME and create a plain A record**. Let's Encrypt's HTTP-01 challenge cannot traverse through AWS Global Accelerator or Cloudflare's orange-cloud proxy
6. If using Cloudflare, set proxy status to **DNS only** (grey cloud, not orange cloud)
7. Wait for DNS propagation (typically 5–15 min — verify with `dig +short sportssphere.fun @1.1.1.1` from a different network)
8. Re-run the script. If you want to proceed anyway despite the mismatch (NOT recommended — Let's EncLocal certs will still fail):
   ```bash
   sudo SKIP_DNS_CHECK=1 bash scripts/https/setup-https.sh sportssphere.fun www.sportssphere.fun
   ```

If you want to override the auto-detected VPS IP (e.g. the auto-detection picked IPv6 but you want to verify against IPv4):
```bash
sudo VPS_PUBLIC_IPV4=104.152.50.173 bash scripts/https/setup-https.sh sportssphere.fun www.sportssphere.fun
# Or both:
sudo VPS_PUBLIC_IPV4=104.152.50.173 VPS_PUBLIC_IPV6=2602:fc16:6:4::bd8c bash scripts/https/setup-https.sh sportssphere.fun www.sportssphere.fun
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
- Verify with `curl -vI https://sportssphere.fun/sportsphere/api/health` — should show TLS 1.3 + a valid cert chain.
