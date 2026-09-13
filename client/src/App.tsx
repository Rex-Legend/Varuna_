import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import WeatherMap from './components/WeatherMap';
import LiveFeed from './components/LiveFeed';
import TemperatureChart from './components/TemperatureChart';
import RainfallHeatmap from './components/RainfallHeatmap';
import CitizenReportForm from './components/CitizenReportForm';
import AlertTicker from './components/AlertTicker';
import SourceBreakdown from './components/SourceBreakdown';
import ExtremeEvents from './components/ExtremeEvents';

type Tab = 'overview' | 'map' | 'analytics' | 'feed' | 'report' | 'alerts';

interface CityWeather {
  city_id: number;
  name: string;
  state: string;
  temperature: number;
  apparent_temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rainfall: number;
  weather_condition: string;
  climate_zone?: string;
  latitude?: number;
  longitude?: number;
}

const getTempBg = (temp: number) => {
  if (temp < 22) return '#0284c7'; // Blue
  if (temp < 28) return '#10b981'; // Green
  if (temp < 33) return '#eab308'; // Amber
  if (temp < 38) return '#ea580c'; // Orange
  return '#dc2626'; // Red
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [search, setSearch] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<CityWeather | null>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get('/api/cities').then(res => setCities(res.data)).catch(() => {});
    axios.get('/api/analytics/kpis').then(res => setKpis(res.data)).catch(() => {});
  }, []);

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = cities.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.state || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.climate_zone || '').toLowerCase().includes(search.toLowerCase())
  );

  const nationalAvg = cities.length > 0
    ? (cities.reduce((acc, c) => acc + c.temperature, 0) / cities.length).toFixed(1)
    : '28.4';

  const hottest = cities.reduce((max, c) => c.temperature > (max?.temperature || 0) ? c : max, cities[0]);
  const coolest = cities.reduce((min, c) => c.temperature < (min?.temperature || 999) ? c : min, cities[0]);

  return (
    <div>
      {/* 0. Top Micro Utility Bar */}
      <div className="top-utility-bar">
        <div className="utility-inner">
          <div className="utility-left">
            <span className="utility-gov-tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
              INDIAN METEOROLOGICAL TELEMETRY GRID • EXASOL CLUSTER MESH
            </span>
          </div>

          <div className="utility-right">
            <div className="utility-metric-chip">
              <span className="pulse-green-dot"></span>
              <span>50/50 Ground Stations Active</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <div className="utility-metric-chip">
              <span>⚡ Exasol Analytics Latency: <strong>11.4ms</strong></span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <div className="utility-metric-chip" style={{ color: '#7dd3fc', fontWeight: 700 }}>
              <span>🕒 {currentTime || 'LIVE IST'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Atmospheric Sky Header */}
      <header className="weather-header">
        <div className="header-inner">
          {/* Professional Brand Insignia */}
          <a href="#" className="weather-brand" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
            <div className="brand-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 3a9 9 0 0 1 9 9"></path>
                <circle cx="12" cy="12" r="5"></circle>
                <circle cx="12" cy="12" r="1.5" fill="#38bdf8"></circle>
                <line x1="12" y1="12" x2="18.5" y2="5.5" stroke="#38bdf8" strokeWidth="2"></line>
              </svg>
            </div>
            <div className="brand-title">
              <h1>VARUNA <span className="highlight">PLATFORM</span></h1>
              <span className="sub">National Weather Big Data Telemetry & Disaster Intelligence</span>
            </div>
          </a>

          {/* Working Central Search Pill with Autocomplete Dropdown */}
          <div className="search-wrapper-rel" ref={searchContainerRef}>
            <div className="search-pill-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search station, city, or state (e.g. Mumbai, Delhi, Assam)..." 
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
              />
              <span className="kbd-badge">Ctrl K</span>
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSearchOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0 4px',
                    lineHeight: 1
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Floating Autocomplete Dropdown Menu */}
            {searchOpen && (
              <div className="search-dropdown-menu">
                {search.trim() === '' ? (
                  <div>
                    <div className="search-dropdown-header">
                      <span>🔥 Popular Indian Stations</span>
                      <span style={{ cursor: 'pointer', fontSize: '0.72rem' }} onClick={() => setSearchOpen(false)}>Close ✕</span>
                    </div>
                    <div className="search-trending-chips">
                      {['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Jaipur', 'Hyderabad', 'Cherrapunji'].map(name => (
                        <button
                          key={name}
                          className="search-chip-btn"
                          onClick={() => {
                            setSearch(name);
                            const found = cities.find(c => c.name.toLowerCase() === name.toLowerCase());
                            if (found) {
                              setSelectedStation(found);
                              setSearchOpen(false);
                            }
                          }}
                        >
                          📍 {name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="search-dropdown-header">
                      <span>Found {filteredCities.length} Stations for "{search}"</span>
                      <span style={{ cursor: 'pointer', fontSize: '0.72rem' }} onClick={() => setSearchOpen(false)}>Close ✕</span>
                    </div>
                    {filteredCities.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>
                        No observation station matched "<strong>{search}</strong>". Try Mumbai, Delhi, or Assam.
                      </div>
                    ) : (
                      filteredCities.slice(0, 8).map(c => (
                        <div
                          key={c.city_id}
                          className="search-result-row"
                          onClick={() => {
                            setSelectedStation(c);
                            setSearchOpen(false);
                          }}
                        >
                          <div>
                            <div className="city-name">{c.name}</div>
                            <div className="city-meta">
                              {c.state} • {c.weather_condition} • {c.climate_zone || 'Tropical'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                background: getTempBg(c.temperature),
                                color: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.85rem'
                              }}
                            >
                              {c.temperature}°C
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700 }}>
                              Inspect →
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Action Items */}
          <div className="header-right-actions">
            <div className="header-db-pill" title="In-Memory Multi-Threaded Columnar Database">
              <span className="pulse-green-dot"></span>
              <div>
                <span className="db-title">Exasol Engine</span>
                <span className="db-latency"> • In-Memory</span>
              </div>
            </div>

            <button 
              className="header-alert-chip"
              onClick={() => setActiveTab('alerts')}
              title="View Active Disaster Bulletins"
            >
              <span>🚨</span>
              <span>{kpis?.active_alerts || 5} Bulletins</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Meteorological Navigation Tabs */}
      <nav className="weather-nav">
        <div className="weather-nav-inner">
          <button 
            className={`weather-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Overview</span>
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="12"></line>
              <line x1="12" y1="12" x2="19" y2="19"></line>
            </svg>
            <span>GIS Radar Doppler</span>
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span>Climate Trends</span>
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
              <circle cx="12" cy="12" r="2"></circle>
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
              <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
            </svg>
            <span>Live Crisis Stream</span>
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Citizen Observations</span>
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Emergency Bulletins</span>
            <span className="tab-badge">{kpis?.active_alerts || 5}</span>
          </button>
        </div>
      </nav>

      {/* 3. Main Dashboard Body */}
      <main className="dashboard-content">
        {/* National Climate Hero Widget */}
        <div className="weather-hero-card">
          <div className="hero-dial-wrap">
            <span className="badge normal" style={{ width: 'fit-content' }}>National Atmosphere</span>
            <div className="dial-display">
              <div className="temp-sun-dial">
                <span className="val">{nationalAvg}</span>
                <span className="unit">°C</span>
              </div>
              <div className="dial-text">
                <h3>Live Mean Temp</h3>
                <p>Mesh telemetry from 50 observation stations</p>
              </div>
            </div>
          </div>

          <div className="weather-stats-4grid">
            <div className="weather-stat-tile" style={{ cursor: 'pointer' }} onClick={() => hottest && setSelectedStation(hottest)}>
              <div className="stat-tile-label">Warmest Station Today</div>
              <div className="stat-tile-val" style={{ color: '#ef4444' }}>
                {hottest ? `${hottest.name} ${hottest.temperature}°C` : 'Delhi 35.9°C'}
              </div>
              <div className="stat-tile-tag" style={{ color: '#ef4444' }}>Peak Daytime Heat (Click to view)</div>
            </div>

            <div className="weather-stat-tile" style={{ cursor: 'pointer' }} onClick={() => coolest && setSelectedStation(coolest)}>
              <div className="stat-tile-label">Coolest Station Today</div>
              <div className="stat-tile-val" style={{ color: '#0284c7' }}>
                {coolest ? `${coolest.name} ${coolest.temperature}°C` : 'Bangalore 28.9°C'}
              </div>
              <div className="stat-tile-tag" style={{ color: '#0284c7' }}>Mild Regional Climate (Click to view)</div>
            </div>

            <div className="weather-stat-tile">
              <div className="stat-tile-label">Exasol In-Memory Records</div>
              <div className="stat-tile-val" style={{ color: '#0f172a' }}>
                {kpis?.total_records?.toLocaleString() || '5,540'}
              </div>
              <div className="stat-tile-tag" style={{ color: '#10b981' }}>⚡ Sub-second SQL Aggregation</div>
            </div>

            <div className="weather-stat-tile">
              <div className="stat-tile-label">#IMD Posts Tracked</div>
              <div className="stat-tile-val" style={{ color: '#7e22ce' }}>
                {kpis?.total_social_posts || '45'}
              </div>
              <div className="stat-tile-tag" style={{ color: '#7e22ce' }}>NLP Sentiment & Media</div>
            </div>
          </div>
        </div>

        {/* Tab View Switcher */}
        {activeTab === 'overview' && (
          <div>
            {/* Live City Temperature Chips (Clickable to inspect station) */}
            <div className="weather-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    🌤️ Real-Time Regional Temperature Ranking
                  </h2>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Click any station to inspect live sensor telemetry and Exasol records
                  </span>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700 }}>
                  Showing {filteredCities.length} stations
                </span>
              </div>

              <div className="city-grid-scroll">
                {filteredCities.map(c => (
                  <div
                    key={c.city_id}
                    className="city-pill-card"
                    onClick={() => setSelectedStation(c)}
                    title="Click to view full station telemetry"
                  >
                    <div>
                      <div className="name">{c.name}</div>
                      <div className="sub">{c.state} • {c.weather_condition}</div>
                    </div>
                    <div className="badge-temp" style={{ background: getTempBg(c.temperature) }}>
                      {c.temperature}°C
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dedicated GIS Doppler Radar Launchpad Banner */}
            <div className="weather-card" style={{
              background: 'linear-gradient(135deg, #0b1d3a 0%, #102a45 100%)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '26px 30px',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}>
                    GEOSPATIAL RADAR TELEMETRY
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#7dd3fc', fontWeight: 600 }}>
                    ● 50 Observation Stations Mesh
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  🛰️ Pan-India Live Weather Radar & GIS Map
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '6px', maxWidth: '640px', lineHeight: 1.5 }}>
                  Explore dynamic thermal heatmaps, IMD Doppler precipitation sweeps, cloud cover overlays, and extreme weather hazard zones with sub-second Exasol geospatial queries.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('map')}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 26px',
                  borderRadius: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>Launch Interactive GIS Radar</span>
                <span style={{ fontSize: '1.2rem' }}>→</span>
              </button>
            </div>

            {/* Interactive Climate Trends + Source Donut */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '24px', marginBottom: '24px' }}>
              <div className="weather-card">
                <TemperatureChart />
              </div>
              <div className="weather-card">
                <SourceBreakdown />
              </div>
            </div>

            {/* Interactive Extreme Events Leaderboard */}
            <div className="weather-card">
              <ExtremeEvents />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="weather-card" style={{ padding: '22px' }}>
            <WeatherMap />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '24px', marginBottom: '24px' }}>
              <div className="weather-card">
                <TemperatureChart />
              </div>
              <div className="weather-card">
                <SourceBreakdown />
              </div>
            </div>
            <div className="weather-card">
              <RainfallHeatmap />
            </div>
            <div className="weather-card" style={{ marginTop: '24px' }}>
              <ExtremeEvents />
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="weather-card">
            <LiveFeed />
          </div>
        )}

        {activeTab === 'report' && (
          <div className="weather-card">
            <CitizenReportForm />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="weather-card">
            <AlertTicker />
          </div>
        )}
      </main>

      {/* 4. Interactive Weather Station Telemetry Modal Dialog */}
      {selectedStation && (
        <div className="station-modal-overlay" onClick={() => setSelectedStation(null)}>
          <div className="station-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, #0b192e 0%, #102a45 100%)',
              padding: '20px 24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    Station ID: #{selectedStation.city_id}
                  </span>
                  <span style={{ color: '#7dd3fc', fontSize: '0.78rem', fontWeight: 600 }}>
                    Exasol Spatial Mesh
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0', color: '#ffffff' }}>
                  {selectedStation.name}, {selectedStation.state}
                </h2>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Temperature dial & condition */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '16px 20px',
                background: 'rgba(15, 30, 54, 0.9)',
                borderRadius: '16px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: getTempBg(selectedStation.temperature),
                  color: '#ffffff',
                  width: '72px',
                  height: '72px',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                }}>
                  {selectedStation.temperature}°
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {selectedStation.weather_condition || 'Clear Sky'}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                    Climate Zone: <strong style={{ color: '#cbd5e1' }}>{selectedStation.climate_zone || 'Tropical'}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
                    Coordinates: {selectedStation.latitude?.toFixed(4) || '28.61'}, {selectedStation.longitude?.toFixed(4) || '77.20'}
                  </div>
                </div>
              </div>

              {/* 4-grid metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Feels Like (Apparent)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                    {selectedStation.apparent_temperature || selectedStation.temperature}°C
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Relative Humidity</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    {selectedStation.humidity || 70}%
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Surface Wind Speed</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                    {selectedStation.wind_speed || 12} km/h
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Observed Rainfall</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    {selectedStation.rainfall || 0} mm
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setActiveTab('map');
                    setSelectedStation(null);
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  🛰️ Inspect on GIS Radar Map
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setSelectedStation(null);
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📊 Multi-Station Trends
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;