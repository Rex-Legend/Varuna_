# Varuna (वरुण) — Production Deployment Guide

This guide details instructions for deploying the **Varuna National Weather Big Data Analytics Platform** on production servers, Linux VMs, or Cloud VPS environments (e.g., Ubuntu/Debian/CentOS, AWS EC2, GCP Compute Engine, DigitalOcean).

---

## 🏛️ System Overview

Varuna is composed of three primary tiers:
1. **Frontend Dashboard (`client/`)**: High-performance React 18 + Vite SPA, served via an optimized Nginx web server.
2. **Backend API & Ingestion Engine (`server/`)**: Express TypeScript REST + SSE streaming service with automated background collectors.
3. **Database Tier (`ingest/` & Exasol)**: Exasol In-Memory Columnar Database (or high-performance memory-mapped abstraction).

---

## 📋 Prerequisites

- **Node.js**: `v18.x` or `v20.x` LTS
- **Package Manager**: `npm` (v9+)
- **Process Manager**: `PM2` (for persistent background process monitoring)
- **Web Server / Reverse Proxy**: `Nginx`
- **Python 3.9+** (Optional, for batch dataset ingestion)

---

## 🚀 Step-by-Step Production Deployment (PM2 + Nginx)

### Step 1: Clone Repository
```bash
git clone https://github.com/Vpystudent/varuna-weather-platform.git
cd varuna-weather-platform
```

---

### Step 2: Build and Configure Backend
Navigate to the `server` directory, install production dependencies, and compile TypeScript:

```bash
cd server
npm install
npm run build
```

To run the backend persistently in the background across system reboots, use **PM2**:
```bash
# Install PM2 globally
npm install -g pm2

# Start the compiled backend server
pm2 start dist/index.js --name "varuna-backend"

# Save process list and enable boot startup
pm2 save
pm2 startup
```
*Backend API service runs on `http://127.0.0.1:3001`.*

---

### Step 3: Build the Frontend Static Assets
Navigate to the `client` directory and build the production bundle:

```bash
cd ../client
npm install --legacy-peer-deps
npm run build
```
This produces an optimized, minified bundle in `client/dist/`.

---

### Step 4: Configure Nginx as Reverse Proxy
Create or update an Nginx configuration file (e.g. `/etc/nginx/sites-available/varuna`):

```nginx
server {
    listen 80;
    server_name weather.yourdomain.com; # Replace with your domain or server IP

    # 1. Serve Frontend Single Page Application
    location / {
        root /var/www/varuna/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. Proxy REST API Requests to Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. Dedicated Configuration for Server-Sent Events (SSE) Live Stream
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

Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/varuna /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 5: (Optional) Ingest Historical Meteorological Datasets
To load historical station records:
```bash
cd ../ingest
pip install -r requirements.txt
python load_cities.py
python load_weather.py
```

---

## 🧪 Automated Testing Verification

Before opening traffic to users, verify that all test suites pass:

```bash
# Run Backend Test Suite (11 tests)
cd server
npm test

# Run Frontend Test Suite (6 tests)
cd ../client
npm test
```

**Expected Results**:
- **Backend**: `11 passed, 11 total` (validates REST endpoints, data retention, and meteorological fact-checking).
- **Frontend**: `6 passed, 6 total` (validates freshness indicators and 48-hour expiration purge).

---

## 🔒 Production Security & Performance Best Practices

1. **SSE Telemetry Buffering**: Ensure `proxy_buffering off;` is configured in Nginx for `/api/stream` to prevent delays in live weather alerts.
2. **Automated Process Resiliency**: PM2 automatically restarts the backend service if an unhandled exception or memory spike occurs.
3. **Data Integrity & Fact-Checking**: Ingested social media feeds are filtered through `validateMeteorologicalFactCheck()` to guarantee that climatologically impossible reports are blocked.
