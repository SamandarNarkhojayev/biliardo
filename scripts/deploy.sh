#!/usr/bin/env bash
# Деплой biliardo.kz на сервере: тянем заранее собранные образы из registry и
# поднимаем стек. Запускается CI по SSH, но годится и для ручного прогона на сервере.
#
# Использование (на сервере, из каталога репозитория):
#   REGISTRY=ghcr.io/<owner>/<repo> IMAGE_TAG=<sha|latest> ./scripts/deploy.sh
#
# Что делает:
#   1. (опц.) логинится в registry, если заданы REGISTRY_USER/REGISTRY_TOKEN;
#   2. подтягивает свежие образы для всех сервисов;
#   3. поднимает стек (миграции БД накатываются самими контейнерами на старте);
#   4. ждёт, пока gateway/web станут healthy;
#   5. чистит старые образы, чтобы не забить диск.

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

if [[ -z "${REGISTRY:-}" ]]; then
  echo "❌ REGISTRY не задан (например ghcr.io/owner/repo)" >&2
  exit 1
fi
if [[ -z "${IMAGE_TAG:-}" ]]; then
  echo "❌ IMAGE_TAG не задан (например git sha или latest)" >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Файл $ENV_FILE не найден — создайте его из .env.example с прод-значениями" >&2
  exit 1
fi

export REGISTRY IMAGE_TAG

dc() { docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

echo "▶ Деплой $REGISTRY @ $IMAGE_TAG"

# 1. Логин в registry (если переданы креды). Для публичных образов не нужен.
if [[ -n "${REGISTRY_TOKEN:-}" && -n "${REGISTRY_USER:-}" ]]; then
  REGISTRY_HOST="${REGISTRY%%/*}"
  echo "▶ docker login $REGISTRY_HOST"
  echo "$REGISTRY_TOKEN" | docker login "$REGISTRY_HOST" -u "$REGISTRY_USER" --password-stdin
fi

# 2. Тянем образы приложений (postgres/redis/nginx — публичные, тоже подтянутся).
echo "▶ Pull образов"
dc pull

# 3. Поднимаем стек. Миграции Prisma накатываются в CMD контейнеров на старте.
echo "▶ Up -d"
dc up -d --remove-orphans

# 4. Короткое ожидание готовности ключевых сервисов.
echo "▶ Ждём gateway/web…"
for svc in gateway web; do
  for i in $(seq 1 30); do
    state="$(dc ps --format '{{.Service}} {{.Health}}' 2>/dev/null | awk -v s="$svc" '$1==s {print $2}')"
    if [[ "$state" == "healthy" ]]; then echo "  ✓ $svc healthy"; break; fi
    if [[ "$i" == "30" ]]; then
      echo "  ⚠ $svc не стал healthy за ~60с — смотри логи: docker compose -f $COMPOSE_FILE logs $svc" >&2
    fi
    sleep 2
  done
done

# 5. Чистим висящие образы.
echo "▶ Prune старых образов"
docker image prune -f >/dev/null || true

echo "✅ Деплой завершён: $IMAGE_TAG"
dc ps
