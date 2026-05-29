FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/admin ./services/admin

RUN apk add --no-cache openssl

RUN npm ci --workspaces --include-workspace-root

# Сгенерировать Prisma client (в src/_prisma согласно schema.prisma).
RUN npm --workspace @billiard/admin run generate

EXPOSE 3006
CMD ["npm", "--workspace", "@billiard/admin", "run", "start"]
