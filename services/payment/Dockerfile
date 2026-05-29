FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/payment ./services/payment

RUN apk add --no-cache openssl

RUN npm ci --workspaces --include-workspace-root --include=dev

# Сгенерировать Prisma client (в src/_prisma согласно schema.prisma).
RUN npm --workspace @billiard/payment run generate

EXPOSE 3003
CMD ["npm", "--workspace", "@billiard/payment", "run", "start"]
