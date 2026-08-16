#!/usr/bin/env python3
"""Fix duplicate div in Top Accounts widget."""
import paramiko

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'
FILE = '/var/www/sportsphere-nextjs/src/components/home/SportlightsTab.tsx'

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

# Remove duplicate <div className="flex flex-col gap-2">
old = """        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 5)"""

new = """        <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 5)"""

if old not in content:
    print("Pattern not found — checking current state")
    # Show lines around the issue
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'TOP ACCOUNTS' in line or (i > 0 and 'flex flex-col gap-2' in line and 474 <= i+1 <= 520):
            print(f"L{i+1}: {line}")
    exit(1)

content = content.replace(old, new)

escaped = content.replace("'", "'\\''")
out, err = ssh_cmd(f"printf '%s' '{escaped}' > {FILE}")
if err:
    print(f"Error: {err}")
    exit(1)

print("✅ Fixed duplicate div")
