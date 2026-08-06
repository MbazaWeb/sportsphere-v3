#!/bin/bash

BACKUP_DIR="/var/www/sportsphere-nextjs/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sportsphere_$TIMESTAMP.sql.gz"
RETENTION_DAYS=7

ENV_FILE="/var/www/sportsphere-nextjs/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v "^#" "$ENV_FILE" | xargs)
fi

echo "[$(date)] Starting SportSphere PostgreSQL backup..."

if [ -n "$DATABASE_URL" ]; then
  pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
else
  pg_dump -U postgres sportsphere | gzip > "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup successfully created: $BACKUP_FILE"
else
  echo "[$(date)] ERROR: Backup failed!" >&2
  exit 1
fi

echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "sportsphere_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "[$(date)] Backup process complete."
