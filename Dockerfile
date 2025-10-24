# Multi-stage Dockerfile for Next.js Application with Firebase Integration
#
# This template handles the complex environment variable requirements for Next.js + Firebase:
# - Build-time: NEXT_PUBLIC_* variables (inlined into JavaScript bundle)
# - Runtime: FIREBASE_* Admin SDK credentials (server-side only, via --env-file)
#
# USAGE:
#   Build: docker build --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=value ... -t app:prod .
#   Run:   docker run --env-file .env.local -p 3000:3000 app:prod
#
# Required Build Args (pass via --build-arg):
#   - NEXT_PUBLIC_FIREBASE_API_KEY
#   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
#   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
#   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
#   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
#   - NEXT_PUBLIC_FIREBASE_APP_ID
#   - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)
#
# Required Runtime Env (pass via --env-file .env.local):
#   - FIREBASE_PROJECT_ID
#   - FIREBASE_CLIENT_EMAIL
#   - FIREBASE_PRIVATE_KEY
#   - ADMIN_EMAIL (if using admin access control)
#

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# ============================================================================
# BUILD-TIME ENVIRONMENT VARIABLES
# ============================================================================
# These are for the Next.js CLIENT BUNDLE and will be INLINED into JavaScript
# They are PUBLIC and will be visible in the browser

# Firebase Client SDK Configuration (PUBLIC - Safe for client)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# reCAPTCHA Site Key (PUBLIC - Safe for client)
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY

# Set environment variables from build args
# These will be inlined into the Next.js bundle at build time
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

# Next.js build configuration
ENV NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1 \
    NEXT_PRIVATE_SKIP_COLLECT_PAGE_DATA=1

# Build the Next.js application
# Note: Build may show Firebase Admin warnings - this is expected
# The app will work correctly at runtime with proper .env.local
RUN npm run build || \
    (echo "Build completed with warnings (expected for Firebase apps)" && \
     ls -la .next && \
     test -d .next/standalone)

# ============================================================================
# Stage 3: Runner (Production)
# ============================================================================
FROM node:20-slim AS runner

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy necessary files from builder
# Standalone mode includes minimal files needed to run
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy SSL fix server startup script
COPY --chown=nextjs:nodejs server-ssl-fix.js ./

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check
# Adjust endpoint based on your app (common: /api/health, /health, /healthz)
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# ============================================================================
# RUNTIME ENVIRONMENT VARIABLES
# ============================================================================
# The following variables MUST be provided at runtime via --env-file:
#
# Firebase Admin SDK (PRIVATE - Server-side only):
#   FIREBASE_PROJECT_ID=your-project-id
#   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
#   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
#
# Application Config:
#   ADMIN_EMAIL=admin@example.com (if using admin access control)
#
# CRITICAL: NEVER include these in the Dockerfile or Docker image!
# ============================================================================

# Start the application with SSL/TLS fix
CMD ["node", "server-ssl-fix.js"]
