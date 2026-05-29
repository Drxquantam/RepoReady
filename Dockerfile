FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10.24.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server ./server
EXPOSE 4000
CMD ["node", "server/index.js"]
