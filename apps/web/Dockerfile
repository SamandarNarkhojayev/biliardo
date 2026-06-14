# Multi-stage build: vite build → nginx
#
# Зачем nginx, а не node-сервер: фронт это статика (Vite SPA).
# Раздавать её должен веб-сервер: меньше памяти, gzip/brotli, кэш-заголовки из коробки.
# Раздельный контейнер от backend: разные circles of release, разное масштабирование.

# ---- Stage 1: build ----
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_CLUB_WS_URL=wss://biliardo.kz/club-ws
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLUB_WS_URL=$VITE_CLUB_WS_URL

# Puppeteer — devDep, нужен только для локального `build:ssg`.
# В docker не тянем Chromium (~170MB), production использует static prerender.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm ci --workspaces --include-workspace-root --include=dev
RUN npm --workspace @billiard/web run build

# ---- Stage 2: nginx ----
FROM nginx:1.27-alpine AS runner

# Кастомный nginx-конфиг для контейнера web (внутренний, не хостовый).
# Хостовый nginx (TLS-терминатор) проксирует сюда.
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# wget — для healthcheck'а из docker-compose.
RUN apk add --no-cache wget

EXPOSE 80

# nginx стандартно с stdin=foreground.
CMD ["nginx", "-g", "daemon off;"]
