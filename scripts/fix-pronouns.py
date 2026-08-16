#!/usr/bin/env python3
"""Clean up pronouns comment from EditProfileModal."""
import paramiko

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'
FILE = '/var/www/sportsphere-nextjs/src/components/profile/edit/EditProfileModal.tsx'

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
content = out

# Remove the pronouns comment
old = """      {/* Bio + pronouns on the same row */}
      <Field label="Bio" hint="160 characters shown on your profile card">"""
new = """      <Field label="Bio" hint="160 characters shown on your profile card">"""

if old in content:
    content = content.replace(old, new)
    escaped = content.replace("'", "'\\''")
    ssh_cmd(f"printf '%s' '{escaped}' > {FILE}")
    print("✅ Removed pronouns comment from EditProfileModal")
else:
    print("ℹ️ Comment already removed or not found")
