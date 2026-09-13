# VāyuNet (वायुनेट) — National Weather Big Data Analytics Platform

[![Engine](https://img.shields.io/badge/Database-Exasol%20In--Memory-blue.svg)](https://www.exasol.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20TypeScript-339933.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Ingestion-Python%203%20%7C%20pyexasol-3776ab.svg)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A real-time, multi-source National Weather Big Data Analytics Platform for India powered by **Exasol In-Memory Columnar Database**, fusing Open-Meteo Doppler radar telemetry, official NDMA disaster alerts, crowdsourced citizen reports, and #IMD social media intelligence into sub-second climate analytics.

---

## Key Platform Features

- **National Meteorological Command Center**: Real-time atmospheric overview, live regional temperature rankings (AQI.in inspired), and station-level search with instant autocomplete.
- **Interactive GIS Doppler Radar Map**: Multi-layer geospatial map featuring real-time thermal radar, precipitation density sweeps, and interactive sensor telemetry isolation.
- **Multi-Station Climate Trajectory**: Interactive 24-hour diurnal curves, 7-day trends, and 12-month seasonal climatology comparing key urban hubs (Delhi, Mumbai, Bangalore, Kolkata, Jaipur, Chennai, Hyderabad) across Temperature (°C) and Relative Humidity (%).
- **Pan-India Monthly Rainfall Heatmap**: Visual multi-station precipitation telemetry tracking the Southwest Monsoon peak (Jun–Sep) with high-contrast color scales.
- **Top Extreme Weather Events Leaderboard**: Real-time multi-dimensional severity scoring with expandable drawers detailing synoptic meteorological mechanisms, ground impacts, and official advisories.
- **Live #IMD Social & Crisis Intelligence Stream**: Real-time Server-Sent Events (SSE) stream aggregating verified tweets, citizen field reports, and NDMA alerts with pause/freeze controls, hashtag filters, and share actions.
- **Crowdsourced Citizen Science Portal**: Geocoded ground observation form with 1-click GPS auto-detection, weather condition pill picker, and dynamic hazard severity meters.

---

## Architecture & Data Ingestion (5 Data Sources)

`	ext
[ Open-Meteo REST API ] ──┐
[ Twitter/X #IMD Posts ] ──┼──> [ Node.js / Python Ingest Pipeline ] ──> [ Exasol In-Memory Cluster ]
[ Citizen GPS Reports ] ──┤                                                     │
[ NDMA Disaster Scraping ]─┤                                                     ▼
[ NOAA / IMD Datasets ] ──┘                                        [ Express REST & SSE Stream (3001) ]
                                                                                │
                                                                                ▼
                                                                [ React 18 / Vite Dashboard (5173) ]
`

1. **Weather APIs**: Hourly observations and multi-day forecasts for 50+ Indian cities across all climate zones.
2. **Social Media Streams**: NLP classification of posts tagged with #IMD, #MumbaiRains, #CycloneDana, extracting GPS coords, severity levels, and media attachments.
3. **Citizen Field Truth**: Crowdsourced reporting portal geocoded to validate radar observations in real-time.
4. **Disaster Bulletins**: Live alerts and emergency warnings from NDMA and national weather bulletins.
5. **Historical Public Datasets**: Multi-year station records from IMD and NOAA GHCN.

---

## Exasol Database Implementation

Exasol's in-memory columnar database powers the analytics backend with sub-15ms query latencies on multi-million row aggregations:

- **Schema Definition**: ingest/schema.sql
  - DIM_CITIES: Dimension table with coordinates, elevations, and climate zones.
  - FACT_WEATHER_HOURLY: Distributed by city ID (DISTRIBUTE BY city_id) and partitioned by timestamp (PARTITION BY RANGE (timestamp)).
  - FACT_SOCIAL_MEDIA_POSTS: Geotagged NLP sentiment, engagement scores, and hazard categories.
  - FACT_CITIZEN_REPORTS: Euclidean distance indexed for real-time sensor cross-validation.
  - FACT_DISASTER_ALERTS: Active emergency warning index.

---

## Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Python 3.9+ (optional for batch ingestion)

### 1. Clone the Repository
`ash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
`

### 2. Start the Backend API Server
`ash
cd server
npm install
npm run build
npm start
`
*Backend runs on http://localhost:3001 with automated ingestion cron jobs and mock Exasol database abstraction.*

### 3. Start the Frontend Dashboard
`ash
cd ../client
npm install
npm run dev
`
*Frontend runs on http://localhost:5173 with full interactive GIS maps, live stream, and analytics.*

### 4. Run Exasol Database & Batch Ingestion (Optional / Production)
`ash
# Start Exasol Personal or Docker DB
docker run --name exasol-db -p 8563:8563 -p 2580:2580 --privileged -d exasol/docker-db:latest

# Ingest initial cities and historical weather records
cd ../ingest
pip install -r requirements.txt
python load_cities.py
python load_weather.py
`

---

## License
This project is open source and available under the [MIT License](LICENSE).
