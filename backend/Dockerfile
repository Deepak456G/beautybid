# ==============================================================================
# BeautyBid Backend Production Multi-Stage Dockerfile
# ==============================================================================

# --- Stage 1: Build & Dependencies ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package manifests
COPY package*.json ./
COPY tsconfig.json ./

# IMPORTANT:
# Prevent Prisma postinstall from running before schema is copied
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client AFTER schema is available
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# --- Stage 2: Production Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Runtime dependencies
RUN apk add --no-cache openssl curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy compiled application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy Prisma files
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy package files
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "dist/index.js"]
