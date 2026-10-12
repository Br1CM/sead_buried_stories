FROM node:22-slim AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
RUN npm run lint
RUN npm run typecheck
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9050

RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --home-dir /nonexistent --shell /usr/sbin/nologin --no-create-home nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9050
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 9050) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
