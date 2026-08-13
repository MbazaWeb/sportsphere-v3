#!/usr/bin/env python3
"""SSH remote command executor for SportSphere deployment."""
import paramiko
import sys

def run(host, user, password, cmd, timeout=30):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=timeout)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    client.close()
    if out: print(out, end='')
    if err: print(err, end='', file=sys.stderr)
    return out, err

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: ssh-cmd.py <command>", file=sys.stderr)
        sys.exit(1)
    cmd = sys.argv[1]
    timeout_sec = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    run('104.152.50.173', 'deploy', 'Rehema@1234!', cmd, timeout=timeout_sec)
