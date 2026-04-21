# Multi-stage build: Dependencies stage
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Multi-stage build: Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for dev/build tools)
RUN npm ci && npm cache clean --force

# Copy server source code and data
COPY . .

# Multi-stage build: Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files and source from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/auth.js ./
COPY --from=builder /app/database.js ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/init-data.js ./
COPY --from=builder /app/seed-data.js ./
COPY --from=builder /app/init-seed.js ./

# Create necessary directories
RUN mkdir -p /app/uploads /app/data

# Ensure proper permissions
RUN chown -R nodejs:nodejs /app && \
    mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose server port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/cases', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the server
CMD ["node", "server.js"]