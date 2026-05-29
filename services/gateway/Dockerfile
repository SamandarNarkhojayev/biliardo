FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY services/gateway ./services/gateway

RUN npm ci --workspaces --include-workspace-root

EXPOSE 3000
CMD ["npm", "--workspace", "@billiard/gateway", "run", "start"]
