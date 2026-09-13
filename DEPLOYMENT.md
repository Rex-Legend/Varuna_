# Varuna (वरुण) — Production Deployment Guide

This guide details instructions for deploying the **Varuna National Weather Big Data Analytics Platform** across various environments (Docker, Bare-Metal / Linux VM, Cloud VPS, or Local Environments).

---

## 🏛️ System Overview

Varuna is composed of three primary tiers:
1. **Frontend Dashboard (`client/`)**: React 18 + Vite SPA, served via Nginx or Node static server.
2. **Backend API & Ingestion Engine (`server/`)**: Express TypeScript REST + SSE streaming service with cron collectors.
3. **Database Tier (`ingest/` & Exasol)**: Exasol In-Memory Columnar Database (or embedded high-performance memory abstraction).

---

## 📋 Prerequisites

- **Node.js**: `v18.x` or `v20.x` LTS
- **Package Manager**: `npm` (v9+)
- **Docker & Docker Compose** (Optional, recommended for production containerization)
- **Python 3.9+** (Optional, for running batch data loading scripts in `ingest/`)

---

## 🐳 Method 1: Docker Deployment (Recommended)

### 1. Build and Run Backend
Navigate to the `server/` directory:
```bash
cd server
npm install
npm run build
```
You can containerize the server using a lightweight Node container:
```dockerfile
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/index.js"]
```
Build and run:
```bash
docker build -t varuna-server .
docker run -d -p 3001:3001 --name varuna-backend varuna-server
```

### 2. Build and Serve Frontend (Nginx)
Navigate to the `client/` directory:
```bash
cd ../client
npm install
npm run build
```
Using the provided `client/Dockerfile`:
```bash
docker build -t varuna-client .
docker run -d -p 80:80 -p 5173:80 --name varuna-frontend varuna-client
```

### 3. Run with Exasol In-Memory Database (Production Database)
```bash
# Start Exasol Docker DB instance
docker run --name exasol-db \
  -p 8563:8563 -p 2580:2580 \
  --privileged -d exasol/docker-db:latest

# Initialize Exasol Schema & Ingest Datasets
cd ../ingest
pip install -r requirements.txt
python load_cities.py
python load_weather.py
```

---

## 🖥️ Method 2: Bare-Metal / Linux VM Deployment (PM2 + Nginx)

### Step 1: Clone and Install
```bash
git clone https://github.com/Vpystudent/varuna-weather-platform.git
cd varuna-weather-platform

# Install server dependencies
cd server
npm install
npm run build

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
npm run build
```

### Step 2: Manage Backend with PM2
Install PM2 globally to ensure automatic restarts and monitoring:
```bash
npm install -g pm2

# From the server directory:
pm2 start dist/index.js --name "varuna-backend"
pm2 save
pm2 startup
```

### Step 3: Configure Reverse Proxy (Nginx)
Configure Nginx (`/etc/nginx/sites-available/varuna`) to proxy API calls and serve the compiled static frontend:

```nginx
server {
    listen 80;
    server_name weather.yourdomain.com; # Or your server IP

    # Frontend Single Page Application
    location / {
        root /var/www/varuna/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Server-Sent Events (SSE) Stream Configuration
    location /api/stream {
        proxy_pass http://127.0.0.1:3001/api/stream;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/varuna /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Automated Testing Verification

Before putting any build into production, verify that all test suites pass:

```bash
# Backend test suite (11 unit/integration tests)
cd server
npm test

# Frontend test suite (6 unit/component tests)
cd ../client
npm test
```

Expected output:
- **Backend**: `11 passed, 11 total` (validates endpoints, data retention, and meteorological fact-checker)
- **Frontend**: `6 passed, 6 total` (validates freshness tagging, 48-hour cutoffs, and component badges)

---

## 🔒 Security & Performance Tuning

1. **Strict 48-Hour Freshness**: The system automatically filters out records older than 48 hours to prevent stale meteorological data from surfacing.
2. **Fact-Checking Gatekeeper**: All ingested social posts are validated via `validateMeteorologicalFactCheck()` to prevent misinformation (e.g. impossible snowfall in plains or coastal cyclones in inland cities).
3. **SSE Connection Limits**: Ensure reverse proxies disable buffering on `/api/stream` (`proxy_buffering off;`) to allow continuous telemetry streaming.
