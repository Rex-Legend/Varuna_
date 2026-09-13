# Varuna (वरुण) — National Weather Big Data Analytics Platform

[![Engine](https://img.shields.io/badge/Database-Exasol%20In--Memory-blue.svg)](https://www.exasol.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20TypeScript-339933.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Named after **Varuna (वरुण)**, the Vedic deity of celestial waters, rain, and the cosmic order. **Varuna** is a real-time, multi-source National Weather Big Data Analytics Platform for India powered by the **Exasol In-Memory Columnar Database**, fusing Open-Meteo Doppler radar telemetry, official NDMA disaster alerts, crowdsourced citizen observations, and verified #IMD social media intelligence into sub-second climate analytics.

---

## 🌟 Key Platform Features

- **🏛️ National Meteorological Command Center**: Real-time atmospheric overview, live regional temperature rankings, and station-level search with instant autocomplete (`Ctrl+K`).
- **🛰️ Interactive GIS Doppler Radar Map**: Multi-layer geospatial map featuring real-time thermal radar, precipitation density sweeps, and interactive sensor telemetry isolation.
- **📈 Multi-Station Climate Trajectory**: Interactive 24-hour diurnal curves, 48-hour outlooks, and multi-month seasonal climatology comparing key urban hubs (Delhi, Mumbai, Bangalore, Kolkata, Jaipur, Chennai, Hyderabad) across Temperature (°C) and Relative Humidity (%).
- **🌧️ Pan-India Monthly Rainfall Heatmap**: Visual multi-station precipitation telemetry tracking the Southwest Monsoon peak (Jun–Sep) with high-contrast color scales.
- **⚡ Top Extreme Weather Events Leaderboard**: Real-time multi-dimensional severity scoring with expandable drawers detailing synoptic meteorological mechanisms, ground impacts, and official advisories.
- **📱 Live #IMD Social & Crisis Intelligence Stream**: Real-time Server-Sent Events (SSE) stream aggregating verified tweets, citizen field reports, and NDMA alerts with pause/freeze controls, hashtag filters, and share actions.
- **📍 Crowdsourced Citizen Science Portal**: Geocoded ground observation form with 1-click GPS auto-detection, weather condition pill picker, and dynamic hazard severity meters.
- **🛡️ Strict 48-Hour Freshness & Fact-Checking**: Strict 2-day retention policy (`MAX_DATA_AGE_MS = 48h`) and meteorological geographic gatekeeper rejecting climatologically impossible events (e.g. snowfall in tropical plains or coastal cyclones in inland cities).

---

## 🏗️ Architecture & 5 Data Sources

```text
[ Open-Meteo REST API ] ──┐
[ Twitter/X #IMD Posts ] ──┼──> [ Node.js / Python Ingest Pipeline ] ──> [ Exasol In-Memory Cluster ]
[ Citizen GPS Reports ] ──┤     (Fact-Check & Freshness Gatekeeper)                │
[ NDMA Disaster Scraping ]─┤                                                        ▼
[ NOAA / IMD Datasets ] ──┘                                           [ Express REST & SSE Stream (3001) ]
                                                                                    │
                                                                                    ▼
                                                                    [ React 18 / Vite Dashboard (5173) ]
```

1. **Weather APIs**: Hourly observations and multi-day forecasts for 50+ Indian cities across all climate zones.
2. **Social Media Streams**: NLP classification of verified posts tagged with `#IMD`, extracting GPS coordinates, severity levels, and media attachments.
3. **Citizen Field Truth**: Crowdsourced reporting portal geocoded to validate radar observations in real time.
4. **Disaster Bulletins**: Live emergency alerts and evacuation advisories from NDMA and national weather bulletins.
5. **Historical Public Datasets**: Multi-year station records from IMD and NOAA GHCN.

---

## ⚡ Exasol Database Implementation

Exasol's in-memory columnar database powers the analytics backend with sub-15ms query latencies on multi-million row aggregations:

- **Schema Definition**: [`ingest/schema.sql`](ingest/schema.sql)
  - `DIM_CITIES`: Dimension table with coordinates, elevations, and climate zones.
  - `FACT_WEATHER_HOURLY`: Distributed by city ID (`DISTRIBUTE BY city_id`) and partitioned by timestamp (`PARTITION BY RANGE (observation_time)`).
  - `FACT_SOCIAL_MEDIA_POSTS`: Geotagged NLP sentiment, engagement scores, and hazard categories.
  - `FACT_CITIZEN_REPORTS`: Euclidean distance indexed for real-time sensor cross-validation.
  - `FACT_DISASTER_ALERTS`: Active emergency warning index.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (`v18+` or `v20+` LTS recommended)
- `npm` or `yarn`
- Python 3.9+ (optional for batch ingestion)

### 1. Clone the Repository
```bash
git clone https://github.com/Vpystudent/varuna-weather-platform.git
cd varuna-weather-platform
```

### 2. Setup & Start the Backend API Server
```bash
cd server
npm install
npm run build
npm start
```
*Backend runs on `http://localhost:3001` with automated ingestion cron jobs and Exasol in-memory abstraction.*

### 3. Setup & Start the Frontend Dashboard
Open a new terminal:
```bash
cd client
npm install --legacy-peer-deps
npm run dev
```
*Frontend runs on `http://localhost:5173` with full interactive GIS maps, live stream, and analytics.*

---

## 🧪 Automated Testing

Both backend and frontend come equipped with comprehensive automated test suites:

```bash
# 1. Run Backend Tests (Jest + Supertest)
cd server
npm test

# 2. Run Frontend Tests (Vitest + React Testing Library)
cd ../client
npm test
```

### Test Coverage Highlights
- **Backend**: Validates all REST endpoints (`/api/cities`, `/api/analytics/kpis`, `/api/analytics/source-breakdown`, `/api/alerts`, `/api/citizen-report`) and verifies the **Meteorological & Geographic Fact-Checking Gatekeeper** (guarantees rejection of invalid events like snowfall in plains or coastal cyclones in inland cities).
- **Frontend**: Tests the **Data Freshness Engine** (`LIVE`, `NEW`, and strict 48-hour expiration purge) and component badges.

---

## 📖 Usage Instructions

1. **National Command Center**: Browse real-time temperatures across 52 Indian cities. Press `Ctrl + K` (or `Cmd + K`) anywhere to trigger the quick station search.
2. **GIS Doppler Radar**: Switch to the *GIS Doppler Radar* tab to inspect thermal heat signatures and precipitation sweeps across India with interactive zoom and sensor isolation.
3. **Climate Trajectory**: Compare urban hubs (Delhi, Mumbai, Bangalore, etc.) across 24-hour diurnal temperature and relative humidity trajectories.
4. **Live #IMD Intelligence Stream**: Monitor incoming real-time weather tweets, citizen observations, and NDMA bulletins. Use the pause/freeze control to read bulletins without displacement, or filter by hashtag (e.g. `#MumbaiRains`).
5. **Submit Citizen Field Truth**: Submit ground-truth weather reports using the *Citizen Science* tab. Click **Auto-Detect GPS** to immediately resolve your coordinates and submit observations to the Exasol database.

---

## 📦 Production Deployment

For detailed production instructions using **Nginx**, **PM2**, and Linux system services, please consult the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

---

## 📜 License
This project is open source and available under the [MIT License](LICENSE).
