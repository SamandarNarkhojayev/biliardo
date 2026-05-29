# Backend — гайд по запуску

## npm run services:down

## Структура репозитория

```
/
├── apps/
│   └── web/             ← React + Vite фронтенд (порт 5173)
├── packages/
│   └── shared/          ← @billiard/shared — типы, zod-схемы, бракет-алгоритмы
├── services/
│   ├── auth/            ← :3001  bcrypt + RS256 JWT + refresh tokens
│   ├── gateway/         ← :3000  Fastify proxy + JWT verify + rate limit
│   ├── tournament/      ← :3002  скелет (полная реализация — следующий тур)
│   └── payment/         ← :3003  Kaspi Pay (stub/live режимы)
├── infra/
│   └── postgres/init.sql ← создание схем auth/tournament/payment
├── scripts/
│   └── verify-brackets.ts ← smoke-test всех 6 форматов сетки
└── docker-compose.yml
```

## Архитектура

```
┌─────────────┐
│  apps/web   │  React + Vite (порт 5173)
└──────┬──────┘
       │ HTTP/cookies
       ▼
┌─────────────┐
│   gateway   │  :3000  Fastify + JWT verify + Rate limit
│             │         Прокидывает x-user-id/role/name downstream
└──┬──┬──┬────┘
   │  │  │
   ▼  ▼  ▼
┌──────┐  ┌────────────┐  ┌─────────┐
│ auth │  │ tournament │  │ payment │
│ :3001│  │   :3002    │  │  :3003  │──→ Kaspi Pay API
└──┬───┘  └─────┬──────┘  └────┬────┘    (или stub в dev)
   │            │              │
   └────────────┴──────────────┘
                │
        ┌───────▼────────┐
        │   Postgres     │  schemas: auth, tournament, payment
        └────────────────┘
        ┌────────────────┐
        │     Redis      │  rate-limit, кэш, WS pub/sub (позже)
        └────────────────┘
```

## Ключевые решения

- **Один Postgres, схемы per-service** — упрощает infra на старте, но логически каждый сервис пишет ТОЛЬКО в свою схему. У каждого сервиса свой `Prisma client` (генерится в `services/<name>/src/_prisma/`), без shared client'а.
- **JWT RS256** — auth-сервис подписывает приватным ключом, gateway/остальные верифицируют публичным (получают через `/auth/public-key` с кэшем 1 час).
- **Refresh-токены** — random 384-bit, в БД хранится только sha256-хэш, ротация при каждом refresh, защита от replay-атак (отзываем все токены пользователя если использован revoked).
- **Gateway = единственный JWT-валидатор**. Downstream-сервисы доверяют заголовкам `x-user-*` (network boundary).
- **Прямое HTTP между сервисами** (не NATS) — пока все взаимодействия синхронные.
- **Kaspi-абстракция** — `KaspiClient` имеет два режима: `stub` (default в dev) генерирует фейковые order id и имитирует оплату через локальный эндпоинт; `live` зовёт реальный Kaspi API. Webhook'и проверяются через HMAC-SHA256.

## Запуск (локально)

### 1. Postgres + Redis в Docker

```bash
docker compose up -d postgres redis
```

### 2. Установка зависимостей и Prisma-клиенты

```bash
npm install
# Сгенерировать Prisma client'ов под каждый сервис
npm --workspace @billiard/auth run generate
npm --workspace @billiard/payment run generate
```

### 3. Миграции

```bash
# auth
DATABASE_URL="postgresql://billiard:billiard@localhost:5433/billiard?schema=auth" \
  npm --workspace @billiard/auth run migrate:dev

# payment
DATABASE_URL="postgresql://billiard:billiard@localhost:5433/billiard?schema=payment" \
  npm --workspace @billiard/payment run migrate:dev
```

### 4. Локальные .env-файлы

Каждый сервис читает `services/<name>/.env` (через `tsx --env-file .env`):

```bash
cp services/auth/.env.example     services/auth/.env       2>/dev/null || true
cp services/payment/.env.example  services/payment/.env
```

### 5. Запуск всех бэкенд-сервисов

```bash
npm run back:dev
# параллельно поднимет: auth :3001, payment :3003, tournament :3002, gateway :3000
```

или по одному: `npm run auth:dev`, `npm run payment:dev`, `npm run gateway:dev`.

### 6. Frontend

```bash
npm run dev
# → http://localhost:5173
# По умолчанию использует VITE_API_URL=http://localhost:3000/api
```

### Всё в Docker

```bash
docker compose up -d           # postgres + redis + auth + payment + gateway
docker compose --profile full up  # + tournament скелет
```

## API

### Auth (через gateway: `/api/auth/*`)

| Метод  | Путь               | Описание                                                                                  |
| ------ | ------------------ | ----------------------------------------------------------------------------------------- |
| POST   | `/auth/register`   | Регистрация. Body:`{name, phone, password}`. 201 → `{user, accessToken}` + refresh-cookie |
| POST   | `/auth/login`      | Логин. Body:`{phone, password}`. 200 → то же                                              |
| POST   | `/auth/refresh`    | Обновление по cookie. 200 →`{accessToken, user}`                                          |
| DELETE | `/auth/logout`     | Logout текущей сессии                                                                     |
| DELETE | `/auth/sessions`   | Logout со всех устройств (требует Bearer)                                                 |
| GET    | `/auth/me`         | Текущий пользователь (требует Bearer)                                                     |
| PATCH  | `/auth/me`         | Обновить имя/аватар                                                                       |
| GET    | `/auth/public-key` | RS256 публичный ключ для других сервисов                                                  |

### Payment (через gateway)

| Метод | Путь                              | Auth       | Описание                                                                              |
| ----- | --------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| GET   | `/api/plans`                      | public     | Каталог тарифов                                                                       |
| POST  | `/api/payments`                   | required   | Создать платёж. Body:`{planCode, tournamentId?}`. 201 → `{payment, stubCompleteUrl?}` |
| GET   | `/api/payments/:id`               | required   | Статус платежа (для polling-а с фронта)                                               |
| GET   | `/api/payments/me/history`        | required   | История платежей пользователя                                                         |
| GET   | `/api/subscriptions/me`           | required   | Активная подписка                                                                     |
| POST  | `/api/payments/webhook/kaspi`     | **public** | Webhook от Kaspi. Тело подписано HMAC-SHA256 (`x-kaspi-signature`)                    |
| POST  | `/api/payments/:id/stub-complete` | required   | **dev-only** (KASPI_MODE=stub). Имитация успешной оплаты.                             |

### Health-checks

- `GET /api/health` (через gateway)
- `GET http://localhost:3001/health` (auth)
- `GET http://localhost:3002/health` (tournament — skeleton)
- `GET http://localhost:3003/health` (payment, поле `kaspiMode` отображает текущий режим)

## Kaspi-интеграция: stub vs live

**Dev по умолчанию (`KASPI_MODE=stub`):**

1. Frontend → POST `/api/payments` с `{planCode, tournamentId?}`
2. Backend создаёт Payment в `PENDING`, возвращает `paymentUrl=http://localhost:5173/payment/stub?...` и `stubCompleteUrl=/payments/<id>/stub-complete`
3. Фронт перенаправляет на свою страницу `PaymentCheckout` — там кнопка «Оплатить (имитация)»
4. По клику — POST `/api/payments/<id>/stub-complete` → платёж переходит в `COMPLETED`, для `monthly`-тарифов создаётся `Subscription` на 30 дней
5. Фронт редиректит на `/payment/return?paymentId=<id>` → polling `/api/payments/<id>` → показывает успех

**Production (`KASPI_MODE=live`):**

1. Те же шаги 1–2, но `paymentUrl` — реальный URL Kaspi (или QR-payload для отображения)
2. Пользователь оплачивает в Kaspi
3. Kaspi POST'ит webhook на `/api/payments/webhook/kaspi`. Подпись HMAC-SHA256 по сырому body, секрет — `KASPI_WEBHOOK_SECRET`
4. Backend в одной транзакции: помечает Payment `COMPLETED`, для подписки — создаёт/продлевает `Subscription`, идемпотентно
5. Фронт после редиректа из Kaspi на `/payment/return` поллит статус и показывает результат

Точные пути Kaspi API заполняются в [services/payment/src/kaspi-client.ts](services/payment/src/kaspi-client.ts) после онбординга мерчанта (Kaspi выдаёт спеку).

## Production: что обязательно

1. **Сгенерировать постоянную RS256 пару** для JWT и положить в env:
   ```bash
   openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
   openssl rsa -pubout -in private.pem -out public.pem
   # Положить в env как JWT_PRIVATE_KEY и JWT_PUBLIC_KEY
   ```
2. **COOKIE_SECURE=true** + HTTPS обязательно
3. **Отдельные DB-пользователи под каждый сервис** (в `init.sql` сейчас один общий)
4. **Rate-limit пожёстче** для `/auth/login` и `/auth/register` (anti-bruteforce)
5. **Pino → ELK / Datadog**, structured logs
6. **`KASPI_MODE=live`** + заполнить Kaspi credentials. Webhook URL передать в Kaspi: `https://<api>/api/payments/webhook/kaspi`
7. **Kaspi webhook должен быть строго HTTPS** — без HTTPS подпись бесполезна

## Что готово / в работе

- [x] auth — полная реализация
- [x] gateway — proxy + JWT verify + rate limit
- [x] payment — Plan/Payment/Subscription, Kaspi stub/live режимы, webhook с HMAC, idempotent
- [ ] tournament — skeleton (CRUD + bracket-логика — следующий тур)
- [ ] эмиссия события `payment.completed` → tournament-сервис разблокирует турнир (после tournament)
- [ ] WebSocket — после tournament
