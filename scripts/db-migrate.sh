#!/usr/bin/env bash
# Применяет Prisma-миграции и регенерирует клиенты для всех сервисов с БД.
# Аналог `db:migrate` из проектов с одним shared-клиентом, но у нас 5 разных схем.
#
# Использование:
#   npm run db:migrate                 — для dev (читает .env.dev)
#   ENV_FILE=.env.prod npm run db:migrate  — для другого env
#
# Поведение:
#   1) Сначала пробуем штатный `prisma migrate deploy` для каждого сервиса.
#   2) Если Prisma падает с "Invariant violation: migration persistence is not initialized"
#      (известный баг 6.x в multi-schema при первой инициализации схемы локально),
#      применяем .sql миграции напрямую через psql и пишем в _prisma_migrations руками —
#      идемпотентно, по migration_name. На проде у нас контейнерный migrate в compose, а
#      на dev этот fallback решает проблему. Не trustworthy для шейпа БД — только как
#      bootstrap; нормальный prisma migrate dev обратно работает после initialize.

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.dev}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
PG_CONTAINER="${PG_CONTAINER:-billiard-postgres}"
SERVICES=(auth payment club tournament admin)

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Не найден $ENV_FILE. Создай его (см. .env.example) или укажи через ENV_FILE=..." >&2
  exit 1
fi

# awk-парсер вместо source — иначе строки `VAR=value with spaces`/кириллицей ломают bash.
read_env() {
  awk -F= -v key="$1" '$1 == key { sub(/^[^=]+=/, ""); print; exit }' "$ENV_FILE"
}
strip_quotes() {
  local v="$1"
  v="${v#\"}"; v="${v%\"}"
  v="${v#\'}"; v="${v%\'}"
  printf '%s' "$v"
}

POSTGRES_USER="$(strip_quotes "$(read_env POSTGRES_USER)")"
POSTGRES_PASSWORD="$(strip_quotes "$(read_env POSTGRES_PASSWORD)")"
POSTGRES_DB="$(strip_quotes "$(read_env POSTGRES_DB)")"

: "${POSTGRES_USER:?POSTGRES_USER не задан в $ENV_FILE}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD не задан в $ENV_FILE}"
: "${POSTGRES_DB:?POSTGRES_DB не задан в $ENV_FILE}"

DB_BASE="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${POSTGRES_DB}"

echo "▸ База: ${DB_BASE//${POSTGRES_PASSWORD}/****}"
echo "▸ Сервисы: ${SERVICES[*]}"
echo ""

# psql, который идёт к контейнеру (если он есть) или к локальному postgres.
psql_exec() {
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${PG_CONTAINER}$"; then
    docker exec -i "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"
  else
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"
  fi
}

# Создаёт схему и _prisma_migrations таблицу, если их ещё нет.
ensure_schema() {
  local schema="$1"
  psql_exec >/dev/null <<EOF
CREATE SCHEMA IF NOT EXISTS "${schema}";
CREATE TABLE IF NOT EXISTS "${schema}"._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
EOF
}

# Применяет одну миграцию через psql + регистрирует в _prisma_migrations.
apply_migration_manually() {
  local svc="$1" mig_name="$2" mig_dir="$3"
  local sql_file="${mig_dir}/migration.sql"
  local cksum
  cksum=$(shasum -a 256 "$sql_file" | cut -d' ' -f1)

  # Уже применена?
  local already
  already=$(psql_exec -tA <<EOF
SELECT 1 FROM "${svc}"._prisma_migrations WHERE migration_name = '${mig_name}' AND finished_at IS NOT NULL LIMIT 1;
EOF
)
  if [ "$already" = "1" ]; then
    echo "    ↳ ${mig_name}: уже применена, пропускаю"
    return 0
  fi

  echo "    ↳ ${mig_name}: применяю через psql"
  psql_exec >/dev/null <<EOF
SET search_path TO "${svc}";
BEGIN;
$(cat "$sql_file")
COMMIT;
EOF
  psql_exec >/dev/null <<EOF
INSERT INTO "${svc}"._prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
VALUES (gen_random_uuid()::text, '${cksum}', '${mig_name}', NOW(), NOW(), 1);
EOF
}

# Fallback: ручное применение всех миграций сервиса (по datestamp-сортировке имён).
manual_migrate_service() {
  local svc="$1"
  local mig_root="services/${svc}/prisma/migrations"
  ensure_schema "$svc"
  for dir in "${mig_root}"/*/; do
    [ -d "$dir" ] || continue
    local name
    name=$(basename "$dir")
    [ "$name" = "migration_lock.toml" ] && continue
    apply_migration_manually "$svc" "$name" "$dir"
  done
}

# 1) Сначала штатный migrate (для read-out diff с файлами). Затем — manual fallback,
#    который идемпотентно догонит то, что Prisma не увидела (известный multi-schema баг 6.x,
#    из-за которого Prisma может сказать "up to date" даже когда часть миграций отсутствует в БД).
for svc in "${SERVICES[@]}"; do
  echo "── migrate: @billiard/${svc} ──"
  DATABASE_URL="${DB_BASE}?schema=${svc}" \
    npm --workspace "@billiard/${svc}" run migrate 2>&1 | tee /tmp/prisma-migrate-${svc}.log | tail -10 || true
  # Догоняем всё что Prisma пропустила.
  manual_migrate_service "$svc"
done

echo ""

# 2) generate — обновляем Prisma-клиенты под актуальную схему
for svc in "${SERVICES[@]}"; do
  echo "── generate: @billiard/${svc} ──"
  npm --workspace "@billiard/${svc}" run generate
done

echo ""
echo "✅ Готово: миграции применены, клиенты сгенерированы."
