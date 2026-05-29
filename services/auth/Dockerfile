FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Корневой package.json + workspaces — копируем минимум для install
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/auth ./services/auth

# OpenSSL для prisma engine
RUN apk add --no-cache openssl

RUN npm ci --workspaces --include-workspace-root --include=dev

# Prisma generate
RUN npm --workspace @billiard/auth run generate

# Запуск через tsx (без сборки в JS — экономит время)
EXPOSE 3001
CMD ["npm", "--workspace", "@billiard/auth", "run", "start"]
