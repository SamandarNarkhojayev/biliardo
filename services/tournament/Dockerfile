FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/tournament ./services/tournament

RUN apk add --no-cache openssl

RUN npm ci --workspaces --include-workspace-root --include=dev

RUN npm --workspace @billiard/tournament run generate

EXPOSE 3002
CMD ["sh", "-c", "npm --workspace @billiard/tournament run migrate && npm --workspace @billiard/tournament run start"]
