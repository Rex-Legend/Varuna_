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
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('/api/cities').then(res => setCities(res.data)).catch(() => {});
    axios.get('/api/analytics/kpis').then(res => setKpis(res.data)).catch(() => {});
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
      {/* 1. Atmospheric Sky Header */}
      <header className="weather-header">
        <div className="header-inner">
          <a href="#" className="weather-brand" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
            <div className="brand-weather-badge">IMD 🌦️</div>
            <div className="brand-title">
              <h1>India National Weather Big Data Platform</h1>
              <span>Real-Time Meteorological Telemetry & Multi-Source Intelligence</span>
            </div>
          </a>

          {/* Working Central Search Pill with Autocomplete Dropdown */}
          <div className="search-wrapper-rel" ref={searchContainerRef}>
            <div className="search-pill-box">
              <span style={{ fontSize: '1rem' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search station, city, or state across India..." 
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
              />
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

          <div className="header-engine-pill">
            <span>⚡ Engine:</span>
            <strong>Exasol In-Memory Columnar</strong>
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
            🇮🇳 India Overview
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            🛰️ Geospatial Radar Map
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Big Data Climate Trends
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            📱 Live #IMD Feed
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            ✍️ Citizen Weather Report
          </button>
          <button 
            className={`weather-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🚨 Emergency Bulletins ({kpis?.active_alerts || 5})
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
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
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
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                }}>
                  {selectedStation.temperature}°
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedStation.weather_condition || 'Clear Sky'}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    Climate Zone: <strong>{selectedStation.climate_zone || 'Tropical'}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                    Coordinates: {selectedStation.latitude?.toFixed(4) || '28.61'}, {selectedStation.longitude?.toFixed(4) || '77.20'}
                  </div>
                </div>
              </div>

              {/* 4-grid metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Feels Like (Apparent)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {selectedStation.apparent_temperature || selectedStation.temperature}°C
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Relative Humidity</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                    {selectedStation.humidity || 70}%
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Surface Wind Speed</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {selectedStation.wind_speed || 12} km/h
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Observed Rainfall</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
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
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
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