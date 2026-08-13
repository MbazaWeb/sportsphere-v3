#!/usr/bin/env python3
"""Fix nginx config for admin panel proxy."""
import paramiko

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'
FILE = '/etc/nginx/sites-enabled/multi-app'

def ssh_cmd(cmd, timeout=30):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=timeout)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    client.close()
    return out, err

out, err = ssh_cmd(f'cat {FILE}')
if err:
    print(f"Error: {err}")
    exit(1)

content = out

# Fix admin proxy — must include /sportsphere-admin in proxy_pass target
old_admin = """    # Admin dashboard
    location /sportsphere-admin {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;"""

new_admin = """    # Admin dashboard
    location /sportsphere-admin/ {
        proxy_pass http://127.0.0.1:3003/sportsphere-admin/;
        proxy_http_version 1.1;"""

if old_admin not in content:
    print("ERROR: Could not find admin proxy block!")
    exit(1)

content = content.replace(old_admin, new_admin)

# Also fix the catch-all block — it currently sends /sportsphere-admin to port 3002 (main app)
# We need to add a more specific block OR make sure the admin location catches first
# Actually, nginx processes locations in order of specificity, so /sportsphere-admin/ should match first.
# But the catch-all `location /` sends everything else to port 3002. Let's verify admin is properly isolated.

# Write the new config
escaped = content.replace("'", "'\\''")
out, err = ssh_cmd(f"printf '%s' '{escaped}' > {FILE}")
if err:
    print(f"Error writing: {err}")
    exit(1)

# Test nginx config
out, err = ssh_cmd("nginx -t 2>&1")
print(out)
if err:
    print(f"stderr: {err}")

if "successful" in out or "test is successful" in out:
    # Reload nginx
    out2, err2 = ssh_cmd("nginx -s reload 2>&1")
    print(out2 if out2 else "Nginx reloaded successfully")
    print("✅ Nginx config fixed and reloaded")
else:
    print("❌ Nginx config test failed — NOT reloading")
