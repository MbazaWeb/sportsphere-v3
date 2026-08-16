#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SportSphere — Backup Automation Setup
# ─────────────────────────────────────────────────────────────────────────────
#
# Sets up a daily cron job to run scripts/backup-sportsphere.sh
# and ensures the backup directory exists with correct permissions.
# ─────────────────────────────────────────────────────────────────────────────

set -e

BACKUP_DIR="/var/www/sportsphere-nextjs/backups"
APP_DIR="/var/www/sportsphere-nextjs"
SCRIPT_PATH="$APP_DIR/scripts/backup-sportsphere.sh"

echo "━━━ Setting up Database Backups ━━━"

# 1. Create backup directory
if [ ! -d "$BACKUP_DIR" ]; then
  echo "[1/3] Creating backup directory at $BACKUP_DIR..."
  sudo mkdir -p "$BACKUP_DIR"
  sudo chown $USER:$USER "$BACKUP_DIR"
  sudo chmod 700 "$BACKUP_DIR"
fi

# 2. Ensure script is executable
if [ -f "$SCRIPT_PATH" ]; then
  echo "[2/3] Making backup script executable..."
  chmod +x "$SCRIPT_PATH"
else
  echo "ERROR: Backup script not found at $SCRIPT_PATH"
  exit 1
fi

# 3. Add to crontab (Run daily at 02:00 AM)
echo "[3/3] Scheduling daily cron job (02:00 AM)..."
# (crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "0 2 * * * /bin/bash $SCRIPT_PATH >> /var/log/sportsphere-backup.log 2>&1") | crontab -
# Using a safer approach to avoid duplicates
CRON_JOB="0 2 * * * /bin/bash $SCRIPT_PATH >> /var/log/sportsphere-backup.log 2>&1"
(crontab -l | grep -Fv "$SCRIPT_PATH" ; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ Backup automation setup complete!"
echo "Backups will be stored in: $BACKUP_DIR"
echo "Logs will be written to:   /var/log/sportsphere-backup.log"
echo "Daily run scheduled for 02:00 AM server time."
