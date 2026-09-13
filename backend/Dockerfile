# ==============================================================================
# BeautyBid Backend Production Multi-Stage Dockerfile
# Optimized for performance, security, and minimal container attack surface.
# ==============================================================================

# --- Stage 1: Build & Dependencies ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

# Copy package manifests
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for TypeScript build)
RUN npm install --legacy-peer-deps

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and compile TypeScript to dist/
COPY src ./src
RUN npm run build

# Prune devDependencies to keep production runtime footprint small
RUN npm prune --production

# --- Stage 2: Production Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install runtime OpenSSL needed by Prisma engine & curl for healthcheck
RUN apk add --no-cache openssl curl

# Create unprivileged security user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy pruned production node_modules from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy compiled application code and Prisma artifacts
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose standard backend port
EXPOSE 5000

# Health check to allow container orchestrators (Docker Swarm, Kubernetes, Render, ECS) to monitor container state
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Default command to run the production server
CMD ["node", "dist/index.js"]
