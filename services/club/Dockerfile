FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/club ./services/club

RUN apk add --no-cache openssl

RUN npm ci --workspaces --include-workspace-root --include=dev

RUN npm --workspace @billiard/club run generate

EXPOSE 3004
CMD ["npm", "--workspace", "@billiard/club", "run", "start"]
