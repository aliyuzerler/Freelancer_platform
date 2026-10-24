# syntax=docker/dockerfile:1
# Multi-stage build producing a minimal Next.js standalone image.

FROM node:20-alpine AS base
# libc6-compat is needed by some native deps (e.g. Prisma engines) on Alpine.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci
# Record the exact Prisma CLI version resolved by the lockfile so the runner
# stage installs the SAME version (FZ-28: no hardcoded drift like prisma@6.19.3
# silently diverging from package.json).
RUN node -p "require('prisma/package.json').version" > /app/.prisma-version

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client must be generated before the Next build.
RUN npx prisma generate
RUN npm run build

# --- Runner ---
FROM base AS runner
ENV NODE_ENV=production
# Next telemetry off by default for self-hosters' privacy.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The standalone server doesn't bundle the Prisma CLI, but we run
# `prisma migrate deploy` on boot (see docker-compose command). Install the
# exact version resolved in the deps stage so startup needs no network and
# never version-mismatches the generated client (FZ-28).
COPY --from=deps /app/.prisma-version /tmp/.prisma-version
RUN npm install -g "prisma@$(cat /tmp/.prisma-version)"

# Standalone output + static assets + prisma schema (for migrate deploy).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
