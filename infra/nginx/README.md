# nginx + TLS для biliardo.kz

## Первый запуск (выпуск сертификата)

1. DNS: A-запись `biliardo.kz` и `www.biliardo.kz` → IP сервера.
2. На сервере: каталог `/etc/letsencrypt` должен существовать (его монтирует nginx).
3. Поднять стэк **без TLS** (временно закомментировать listen 443 / certificate директивы), либо использовать certbot standalone:

```sh
# webroot-режим (после первого запуска nginx с HTTP-only):
docker compose -f docker-compose.prod.yml run --rm certbot \
  certbot certonly --webroot -w /var/www/certbot \
    -d biliardo.kz -d www.biliardo.kz \
    --email YOUR_EMAIL --agree-tos --no-eff-email
```

4. Раскомментировать TLS-строки в `biliardo.conf`, `docker compose -f docker-compose.prod.yml up -d nginx`.

## Автопродление

Сервис `certbot` в `docker-compose.prod.yml` уже стоит в режиме `renew` каждые 12 часов.
nginx читает сертификаты read-only и сам перечитывает их по `nginx -s reload` (можно
добавить hook в certbot, либо просто полагаться на graceful — TLS-сессии новые подхватятся).

## JWT ключи

Сгенерировать пару RS256:

```sh
openssl genpkey -algorithm RSA -out jwt_private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem
```

Залить в `.env.prod`:
```
JWT_PRIVATE_KEY="$(cat jwt_private.pem)"
JWT_PUBLIC_KEY="$(cat jwt_public.pem)"
```

## INTERNAL_SECRET

```sh
openssl rand -hex 32
```

## Запуск

```sh
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
