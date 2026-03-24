FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:all

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4040
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/server.js ./
COPY --from=builder /app/logger.js ./
COPY --from=builder /app/passport.js ./
COPY --from=builder /app/db.js ./
COPY --from=builder /app/sw.js ./
COPY --from=builder /app/offline.html ./
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/models ./models
COPY --from=builder /app/services ./services
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/www ./www
COPY --from=builder /app/config ./config
COPY --from=builder /app/*.html ./
COPY --from=builder /app/*.json ./
COPY --from=builder /app/*.webp ./
COPY --from=builder /app/*.png ./
COPY --from=builder /app/*.ico ./
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 4040
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:4040/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1
CMD ["node", "server.js"]
