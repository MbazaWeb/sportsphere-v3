import subprocess, sys

# The nginx config with port 3002 (not 3000)
nginx_conf = r"""server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name sportssphere.fun www.sportssphere.fun 104.152.50.173 _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name sportssphere.fun www.sportssphere.fun 104.152.50.173 _;

    ssl_certificate /etc/letsencrypt/live/sportssphere.fun/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sportssphere.fun/privkey.pem;

    client_max_body_size 110M;

    # APK / static downloads
    location /downloads/ {
        alias /var/www/sportsphere-nextjs/public/downloads/;
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition "attachment";
        add_header Cache-Control "public, max-age=3600";
        add_header X-Content-Type-Options "nosniff" always;
        try_files $uri =404;
    }

    # Uploads
    location /sportsphere/uploads/ {
        alias /var/www/sportsphere-nextjs/public/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
    }

    # 1. ADMIN DASHBOARD APP
    location /sportsphere-admin/ {
        proxy_pass http://127.0.0.1:3003/sportsphere-admin/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. ADMIN API ROUTES
    location /api/admin/ {
        proxy_pass http://127.0.0.1:3003/sportsphere-admin/api/admin/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. AUTH API ROUTES
    location /api/auth/ {
        proxy_pass http://127.0.0.1:3003/sportsphere-admin/api/auth/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 4. MAIN FAN APP (port 3002)
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
"""

# Convert to hex for safe transfer
hex_data = nginx_conf.encode().hex()

# SSH commands to execute
commands = f"""
echo '{hex_data}' | xxd -r -p | echo 'Rehema@1234!' | sudo -S tee /etc/nginx/sites-enabled/multi-app > /dev/null 2>&1
echo 'Rehema@1234!' | sudo -S nginx -t 2>&1
echo 'Rehema@1234!' | sudo -S systemctl reload nginx 2>&1
echo "NGINX_RELOAD_DONE"
"""

result = subprocess.run(
    ['python3', '/home/z/my-project/scripts/ssh-cmd.py', commands, '300'],
    capture_output=True, text=True, timeout=30
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
