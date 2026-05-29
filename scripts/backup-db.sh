#!/usr/bin/env bash
# Postgres → S3 (ps.kz) backup. Запускать раз в сутки (cron / systemd-timer / docker).
#
# Env vars (required):
#   POSTGRES_HOST            postgres host (default: localhost)
#   POSTGRES_PORT            postgres port (default: 5432)
#   POSTGRES_USER            postgres user
#   POSTGRES_PASSWORD        postgres password
#   POSTGRES_DB              postgres database name
#   S3_ENDPOINT              https://s3.ps.kz (или ваш endpoint)
#   S3_REGION                kz-1 (или регион ps.kz)
#   S3_ACCESS_KEY_ID         access key
#   S3_SECRET_ACCESS_KEY     secret key
#   S3_BUCKET_BACKUPS        biliardo-backups
#
# Env vars (optional):
#   BACKUP_RETENTION_DAYS    сколько дней хранить (default: 30)
#   BACKUP_PREFIX            префикс ключей в бакете (default: postgres/)

set -euo pipefail

: "${POSTGRES_HOST:=localhost}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_USER:?POSTGRES_USER required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}"
: "${POSTGRES_DB:?POSTGRES_DB required}"
: "${S3_ENDPOINT:?S3_ENDPOINT required}"
: "${S3_REGION:=kz-1}"
: "${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID required}"
: "${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY required}"
: "${S3_BUCKET_BACKUPS:?S3_BUCKET_BACKUPS required}"
: "${BACKUP_RETENTION_DAYS:=30}"
: "${BACKUP_PREFIX:=postgres/}"

TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

DUMP="$TMP/${POSTGRES_DB}-${TS}.sql.gz"
KEY="${BACKUP_PREFIX}${POSTGRES_DB}-${TS}.sql.gz"

echo "[backup] dumping ${POSTGRES_DB} from ${POSTGRES_HOST}:${POSTGRES_PORT}"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean --if-exists \
  | gzip -9 > "$DUMP"

SIZE=$(stat -c %s "$DUMP" 2>/dev/null || stat -f %z "$DUMP")
echo "[backup] dump size: $((SIZE / 1024)) KB → s3://${S3_BUCKET_BACKUPS}/${KEY}"

# Конфигурируем AWS CLI через env (поддерживает любой S3-compat).
export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="$S3_REGION"

aws --endpoint-url "$S3_ENDPOINT" s3 cp "$DUMP" "s3://${S3_BUCKET_BACKUPS}/${KEY}" \
  --no-progress \
  --storage-class STANDARD

# Retention: удаляем файлы старше BACKUP_RETENTION_DAYS дней.
echo "[backup] cleaning up files older than ${BACKUP_RETENTION_DAYS} days"
CUTOFF_EPOCH=$(($(date +%s) - BACKUP_RETENTION_DAYS * 86400))
aws --endpoint-url "$S3_ENDPOINT" s3api list-objects-v2 \
  --bucket "$S3_BUCKET_BACKUPS" \
  --prefix "$BACKUP_PREFIX" \
  --query 'Contents[].{Key:Key,LastModified:LastModified}' \
  --output json 2>/dev/null \
| python3 -c "
import sys, json
from datetime import datetime, timezone
cutoff = int(sys.argv[1])
data = json.load(sys.stdin) or []
for item in data:
  lm = datetime.fromisoformat(item['LastModified'].replace('Z','+00:00')).timestamp()
  if lm < cutoff:
    print(item['Key'])
" "$CUTOFF_EPOCH" \
| while read -r old_key; do
    [ -z "$old_key" ] && continue
    echo "[backup]  delete s3://${S3_BUCKET_BACKUPS}/${old_key}"
    aws --endpoint-url "$S3_ENDPOINT" s3 rm "s3://${S3_BUCKET_BACKUPS}/${old_key}"
  done

echo "[backup] done"
