import subprocess

# Nginx config - port 3002 for main app
config_hex = (
    "server {\n"
    "    listen 80 default_server;\n"
    "    listen [::]:80 default_server;\n"
    "    server_name sportssphere.fun www.sportssphere.fun 104.152.50.173 _;\n"
    "    return 301 https://$host$request_uri;\n"
    "}\n"
    "\n"
    "server {\n"
    "    listen 443 ssl http2 default_server;\n"
    "    listen [::]:443 ssl http2 default_server;\n"
    "    server_name sportssphere.fun www.sportssphere.fun 104.152.50.173 _;\n"
    "\n"
    "    ssl_certificate /etc/letsencrypt/live/sportssphere.fun/fullchain.pem;\n"
    "    ssl_certificate_key /etc/letsencrypt/live/sportssphere.fun/privkey.pem;\n"
    "\n"
    "    client_max_body_size 110M;\n"
    "\n"
    "    location /downloads/ {\n"
    "        alias /var/www/sportsphere-nextjs/public/downloads/;\n"
    "        default_type application/vnd.android.package-archive;\n"
    "        add_header Content-Disposition \"attachment\";\n"
    "        add_header Cache-Control \"public, max-age=3600\";\n"
    "        add_header X-Content-Type-Options \"nosniff\" always;\n"
    "        try_files $uri =404;\n"
    "    }\n"
    "\n"
    "    location /sportsphere/uploads/ {\n"
    "        alias /var/www/sportsphere-nextjs/public/uploads/;\n"
    "        expires 7d;\n"
    "        add_header Cache-Control \"public, immutable\";\n"
    "        add_header X-Content-Type-Options \"nosniff\" always;\n"
    "    }\n"
    "\n"
    "    location /sportsphere-admin/ {\n"
    "        proxy_pass http://127.0.0.1:3003/sportsphere-admin/;\n"
    "        proxy_http_version 1.1;\n"
    "        proxy_set_header Upgrade $http_upgrade;\n"
    "        proxy_set_header Connection \"upgrade\";\n"
    "        proxy_set_header Host $host;\n"
    "        proxy_set_header X-Real-IP $remote_addr;\n"
    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
    "        proxy_set_header X-Forwarded-Proto $scheme;\n"
    "        proxy_cache_bypass $http_upgrade;\n"
    "    }\n"
    "\n"
    "    location /api/admin/ {\n"
    "        proxy_pass http://127.0.0.1:3003/sportsphere-admin/api/admin/;\n"
    "        proxy_http_version 1.1;\n"
    "        proxy_set_header Upgrade $http_upgrade;\n"
    "        proxy_set_header Connection \"upgrade\";\n"
    "        proxy_set_header Host $host;\n"
    "        proxy_set_header X-Real-IP $remote_addr;\n"
    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
    "        proxy_set_header X-Forwarded-Proto $scheme;\n"
    "        proxy_cache_bypass $http_upgrade;\n"
    "    }\n"
    "\n"
    "    location /api/auth/ {\n"
    "        proxy_pass http://127.0.0.1:3003/sportsphere-admin/api/auth/;\n"
    "        proxy_http_version 1.1;\n"
    "        proxy_set_header Upgrade $http_upgrade;\n"
    "        proxy_set_header Connection \"upgrade\";\n"
    "        proxy_set_header Host $host;\n"
    "        proxy_set_header X-Real-IP $remote_addr;\n"
    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
    "        proxy_set_header X-Forwarded-Proto $scheme;\n"
    "        proxy_cache_bypass $http_upgrade;\n"
    "    }\n"
    "\n"
    "    location / {\n"
    "        proxy_pass http://127.0.0.1:3002;\n"
    "        proxy_http_version 1.1;\n"
    "        proxy_set_header Upgrade $http_upgrade;\n"
    "        proxy_set_header Connection \"upgrade\";\n"
    "        proxy_set_header Host $host;\n"
    "        proxy_set_header X-Real-IP $remote_addr;\n"
    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
    "        proxy_set_header X-Forwarded-Proto $scheme;\n"
    "        proxy_cache_bypass $http_upgrade;\n"
    "    }\n"
    "}\n"
).encode().hex()

# Step 1: Write config file using heredoc+tee approach
cmd1 = f"echo '{config_hex}' | xxd -r -p > /tmp/multi-app-new && echo 'Rehema@1234!' | sudo -S cp /tmp/multi-app-new /etc/nginx/sites-enabled/multi-app"

r1 = subprocess.run(['python3', '/home/z/my-project/scripts/ssh-cmd.py', cmd1, '300'],
                     capture_output=True, text=True, timeout=30)
print("Step 1:", r1.stdout.strip(), r1.stderr.strip())

# Step 2: Verify
cmd2 = "echo 'Rehema@1234!' | sudo -S grep proxy_pass /etc/nginx/sites-enabled/multi-app 2>&1"
r2 = subprocess.run(['python3', '/home/z/my-project/scripts/ssh-cmd.py', cmd2, '300'],
                     capture_output=True, text=True, timeout=30)
print("Step 2 verify:", r2.stdout.strip(), r2.stderr.strip())

# Step 3: Test + reload
cmd3 = "echo 'Rehema@1234!' | sudo -S nginx -t 2>&1 && echo 'Rehema@1234!' | sudo -S systemctl reload nginx 2>&1 && echo RELOADED_OK"
r3 = subprocess.run(['python3', '/home/z/my-project/scripts/ssh-cmd.py', cmd3, '300'],
                     capture_output=True, text=True, timeout=30)
print("Step 3:", r3.stdout.strip(), r3.stderr.strip())
