# Multi-stage build for production-ready container

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY server/ ./

# Stage 3: Production image
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    sqlite-dev \
    python3 \
    make \
    g++ \
    chromium \
    chromium-chromedriver

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S skillmatch -u 1001

# Set working directory
WORKDIR /app

# Copy backend from builder stage
COPY --from=backend-builder --chown=skillmatch:nodejs /app ./

# Copy frontend build to serve static files
COPY --from=frontend-builder --chown=skillmatch:nodejs /app/dist ./public

# Create necessary directories
RUN mkdir -p data logs uploads && \
    chown -R skillmatch:nodejs data logs uploads

# Switch to non-root user
USER skillmatch

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start application
CMD ["node", "index.js"]
