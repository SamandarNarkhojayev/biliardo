FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY services/bot ./services/bot

RUN npm ci --workspaces --include-workspace-root --include=dev

EXPOSE 3005
CMD ["npm", "--workspace", "@billiard/bot", "run", "start"]
