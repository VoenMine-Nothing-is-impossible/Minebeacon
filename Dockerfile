# syntax=docker/dockerfile:1
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json* ./
# prisma нужен на build, ставим всё
COPY prisma ./prisma
RUN npm install --no-audit --no-fund
# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# npm run build уже включает `prisma generate` (см. package.json)
RUN npm run build
RUN npm prune --omit=dev
# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8096
COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/next.config.js ./next.config.js
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/scripts ./scripts
COPY --chown=app:app entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && mkdir -p public/uploads && chown app:app public/uploads
USER app
EXPOSE 8096
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-8096}/api/health || exit 1
CMD ["./entrypoint.sh"]
