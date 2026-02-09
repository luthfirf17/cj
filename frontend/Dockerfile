# Frontend Dockerfile - Multi-stage build
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
# Use npm install instead of npm ci to handle lock file version mismatches
RUN npm install

# Copy source code
COPY . .

# Set environment variable for build
# Empty VITE_API_URL = same origin (nginx will proxy /api to backend)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
