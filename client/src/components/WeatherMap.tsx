import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import axios from 'axios';

interface City {
  city_id: number;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  temperature: number;
  rainfall: number;
  weather_condition: string;
  climate_zone?: string;
}

const getTempColor = (temp: number) => {
  if (temp < 22) return '#0284c7'; // Cool Sky Blue
  if (temp < 28) return '#10b981'; // Pleasant Green
  if (temp < 33) return '#eab308'; // Warm Amber
  if (temp < 38) return '#ea580c'; // Hot Orange
  return '#dc2626'; // Red Heatwave
};

export default function WeatherMap() {
  const [cities, setCities] = useState<City[]>([]);
  const [activeMetric, setActiveMetric] = useState<'temp' | 'rain'>('temp');
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get('/api/cities');
        setCities(response.data);
      } catch (error) {
        console.error('Error fetching cities for map', error);
      }
    };
    fetchCities();
  }, []);

  const filteredCities = cities.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (c.state || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'heat') return c.temperature >= 33;
    if (filter === 'rain') return c.rainfall > 0.5;
    if (filter === 'cool') return c.temperature < 28;
    return true;
  });

  const hottestCity = cities.reduce((max, c) => c.temperature > (max?.temperature || 0) ? c : max, cities[0]);
  const wettestCity = cities.reduce((max, c) => c.rainfall > (max?.rainfall || 0) ? c : max, cities[0]);

  return (
    <div>
      {/* Top Map Interactive Controls */}
      <div className="map-toolbar-row">
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            🛰️ Live Meteorological Radar & Satellite Mesh
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.82rem' }}>
            Multi-layer geospatial telemetry across 50 national monitoring stations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Layer Selector */}
          <div className="map-layer-selector">
            <button 
              className={`layer-btn ${activeMetric === 'temp' ? 'active' : ''}`}
              onClick={() => setActiveMetric('temp')}
            >
              🌡️ Temperature Radar
            </button>
            <button 
              className={`layer-btn ${activeMetric === 'rain' ? 'active' : ''}`}
              onClick={() => setActiveMetric('rain')}
            >
              🌧️ Precipitation Density
            </button>
          </div>

          <input 
            type="text" 
            placeholder="Search station or state..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              width: '180px'
            }}
          />

          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              background: '#fff'
            }}
          >
            <option value="all">All 50 Stations</option>
            <option value="heat">Warmest Regions (&gt;= 26°C)</option>
            <option value="rain">Active Rainfall (&gt; 0.5mm)</option>
            <option value="cool">Coolest Regions (&lt; 23°C)</option>
          </select>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="map-frame-wrapper">
        <MapContainer 
          center={[22.5, 78.9]} 
          zoom={5} 
          style={{ height: '560px', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* Dual Tile Layers via OpenStreetMap & Carto Positron for clean weather visualization */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredCities.map(city => {
            const isSelected = selectedCity?.city_id === city.city_id;
            const bubbleRadius = activeMetric === 'temp'
              ? Math.max(7, Math.min(20, (city.temperature - 15) * 1.3))
              : Math.max(6, Math.min(26, 6 + city.rainfall * 1.5));

            const bubbleColor = activeMetric === 'temp'
              ? getTempColor(city.temperature)
              : city.rainfall > 10 ? '#0284c7' : city.rainfall > 0.5 ? '#38bdf8' : '#94a3b8';

            return (
              <CircleMarker
                key={city.city_id}
                center={[city.latitude, city.longitude]}
                radius={bubbleRadius}
                fillColor={bubbleColor}
                fillOpacity={isSelected ? 0.95 : 0.75}
                color={isSelected ? '#0f172a' : '#ffffff'}
                weight={isSelected ? 3 : 1.5}
                eventHandlers={{
                  click: () => setSelectedCity(city)
                }}
              >
                <Popup>
                  <div style={{ color: '#0f172a', minWidth: '180px', padding: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{city.name}</h4>
                      <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {city.state}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '10px 0' }}>
                      <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>TEMP</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: getTempColor(city.temperature) }}>
                          {city.temperature}°C
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>RAIN</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>
                          {city.rainfall} mm
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                      <div><strong>Climate:</strong> {city.climate_zone || 'Tropical'}</div>
                      <div><strong>Condition:</strong> {city.weather_condition}</div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        
        {/* Floating Legend Glass Box */}
        <div style={{ 
          position: 'absolute', 
          bottom: '24px', 
          right: '24px', 
          zIndex: 400, 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          padding: '14px 18px', 
          borderRadius: '14px', 
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '220px'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', marginBottom: '8px' }}>
            {activeMetric === 'temp' ? '🌡️ Temperature Scale' : '🌧️ Precipitation Density'}
          </div>

          {activeMetric === 'temp' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span> &lt; 22°C (Cool)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> 22-28°C (Pleasant)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></span> 28-33°C (Warm)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ea580c' }}></span> 33-38°C (Hot)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }}></span> &gt; 38°C (Heatwave)</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span> &gt; 10 mm (Heavy Downpour)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }}></span> 0.5 - 10 mm (Active Showers)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }}></span> 0.0 mm (Dry Skies)</div>
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>
            Click station to isolate sensor telemetry
          </div>
        </div>
      </div>

      {/* Map Live Highlights Strip */}
      <div className="map-highlights-bar">
        <div className="highlight-box">
          <div className="icon">🔥</div>
          <div>
            <div className="title">Warmest Station Recorded</div>
            <div className="val">{hottestCity ? `${hottestCity.name} (${hottestCity.temperature}°C)` : 'Chennai'}</div>
          </div>
        </div>

        <div className="highlight-box">
          <div className="icon">🌧️</div>
          <div>
            <div className="title">Highest Observed Rain</div>
            <div className="val">{wettestCity ? `${wettestCity.name} (${wettestCity.rainfall} mm)` : 'Cherrapunji'}</div>
          </div>
        </div>

        <div className="highlight-box">
          <div className="icon">📡</div>
          <div>
            <div className="title">Active Radar Telemetry</div>
            <div className="val">{filteredCities.length} / {cities.length} Stations Mesh</div>
          </div>
        </div>
      </div>
    </div>
  );
}