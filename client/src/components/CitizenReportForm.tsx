import { useState, useEffect } from 'react';
import axios from 'axios';
import { getDataFreshness, filterWithinWeek, FreshnessBadge } from '../utils/freshness';

interface Report {
  id?: number;
  reporter_name: string;
  reporter_location: string;
  weather_condition: string;
  severity_rating: number;
  description: string;
  city_name?: string;
  timestamp?: string;
  freshness?: 'LIVE' | 'NEW';
}

export default function CitizenReportForm() {
  const [formData, setFormData] = useState({
    reporter_name: '',
    latitude: 28.6139,
    longitude: 77.2090,
    reporter_location: '',
    weather_condition: 'sunny',
    temperature_feel: 'warm',
    rain_intensity: 'none',
    wind_intensity: 'calm',
    visibility_level: 'clear',
    severity_rating: 2,
    description: '',
    photo_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/citizen-report');
      // Strict 7-day retention guard: filter out any report older than 7 days
      const validReports = filterWithinWeek<Report>(response.data, (r: any) => r.timestamp);
      setRecentReports(validReports);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? parseFloat(value) : value
    }));
  };

  const handleConditionSelect = (condition: string) => {
    setFormData(prev => ({ ...prev, weather_condition: condition }));
  };

  const handleRainSelect = (intensity: string) => {
    setFormData(prev => ({ ...prev, rain_intensity: intensity }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: Math.round(pos.coords.latitude * 10000) / 10000,
          longitude: Math.round(pos.coords.longitude * 10000) / 10000,
          reporter_location: prev.reporter_location || 'Current GPS Location'
        }));
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed', err);
        setLocating(false);
        alert('Could not retrieve GPS location. Please enter manually.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post('/api/citizen-report', formData);
      setMessage({ 
        text: `Observation successfully recorded! Geotagged to nearest observation station: ${response.data.matched_city || 'Regional Hub'}.`, 
        type: 'success' 
      });
      setFormData(prev => ({ ...prev, description: '', photo_url: '' }));
      fetchReports();
    } catch (err) {
      setMessage({ text: 'Error submitting observation. Please check inputs and try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const conditions = [
    { key: 'sunny', label: 'Sunny / Clear', icon: '☀️' },
    { key: 'cloudy', label: 'Partly Cloudy', icon: '⛅' },
    { key: 'rainy', label: 'Rain / Drizzle', icon: '🌧️' },
    { key: 'stormy', label: 'Thunderstorm', icon: '⛈️' },
    { key: 'foggy', label: 'Dense Fog', icon: '🌫️' },
    { key: 'cyclonic', label: 'Gale / Storm', icon: '🌪️' }
  ];

  const rainLevels = [
    { key: 'none', label: 'None' },
    { key: 'light', label: 'Drizzle' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'heavy', label: 'Heavy' },
    { key: 'torrential', label: 'Torrential' }
  ];

  const getSeverityBadge = (rating: number) => {
    if (rating >= 4) return { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', label: `Level ${rating} - Hazard` };
    if (rating === 3) return { bg: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.4)', label: `Level ${rating} - Moderate` };
    return { bg: 'rgba(34, 197, 94, 0.2)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.4)', label: `Level ${rating} - Normal` };
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(15, 30, 54, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#7dd3fc', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Exasol Crowdsource Ingestion
          </span>
          <span style={{ fontSize: '0.8rem', color: '#bae6fd' }}>● Real-time Telemetry Verification</span>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
          📍 Citizen Ground Weather & Disaster Observation Hub
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '6px', maxWidth: '750px', lineHeight: 1.5 }}>
          Contribute real-time ground truth observations to validate automated radar algorithms and trigger community safety advisories.
        </p>
      </div>

      {message && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: message.type === 'success' ? '#86efac' : '#fca5a5',
          border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontWeight: 700,
          fontSize: '0.92rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Form + Live Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px' }}>
        {/* Form Column */}
        <div style={{
          background: 'rgba(15, 30, 54, 0.85)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.16)',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '18px' }}>
            📝 Submit Real-Time Observation
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Name and Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Reporter / Organization *
                </label>
                <input
                  type="text"
                  name="reporter_name"
                  value={formData.reporter_name}
                  onChange={handleChange}
                  placeholder="e.g. Anand V., Community Volunteer"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Locality / Landmark *
                </label>
                <input
                  type="text"
                  name="reporter_location"
                  value={formData.reporter_location}
                  onChange={handleChange}
                  placeholder="e.g. Bandra West, Mumbai"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* GPS Coordinates with Auto-detect */}
            <div style={{
              background: 'rgba(10, 22, 40, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7dd3fc' }}>
                  🛰️ Geospatial Coordinates (Exasol Spatial Ingest)
                </span>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  style={{
                    background: 'rgba(2, 132, 199, 0.25)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {locating ? 'Detecting...' : '📍 Auto-Detect GPS'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      fontSize: '0.88rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#f8fafc'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      fontSize: '0.88rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#f8fafc'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Condition Pill Picker */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Current Weather Phenomenon *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {conditions.map(c => {
                  const isSelected = formData.weather_condition === c.key;
                  return (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => handleConditionSelect(c.key)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSelected ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#38bdf8' : '#cbd5e1',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Precipitation & Thermal Feel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Rain Intensity
                </label>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '4px', borderRadius: '10px' }}>
                  {rainLevels.map(r => (
                    <button
                      type="button"
                      key={r.key}
                      onClick={() => handleRainSelect(r.key)}
                      style={{
                        flex: 1,
                        padding: '6px 2px',
                        borderRadius: '8px',
                        border: 'none',
                        background: formData.rain_intensity === r.key ? '#0284c7' : 'transparent',
                        color: formData.rain_intensity === r.key ? '#ffffff' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Thermal Perception
                </label>
                <select
                  name="temperature_feel"
                  value={formData.temperature_feel}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '0.85rem',
                    background: '#0b1d36',
                    fontWeight: 600,
                    color: '#f8fafc'
                  }}
                >
                  <option value="freezing">❄️ Freezing Cold (&lt;10°C)</option>
                  <option value="cool">🌬️ Cool / Pleasant (15-24°C)</option>
                  <option value="warm">🌤️ Warm & Humid (25-34°C)</option>
                  <option value="hot">🔥 Scorching Heatwave (35°C+)</option>
                </select>
              </div>
            </div>

            {/* Severity Rating Slider */}
            <div style={{
              background: 'rgba(10, 22, 40, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Hazard / Severity Index
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: getSeverityBadge(formData.severity_rating).bg,
                  color: getSeverityBadge(formData.severity_rating).color,
                  border: getSeverityBadge(formData.severity_rating).border,
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  {getSeverityBadge(formData.severity_rating).label}
                </span>
              </div>
              <input
                type="range"
                name="severity_rating"
                min="1"
                max="5"
                step="1"
                value={formData.severity_rating}
                onChange={handleChange}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                <span>1 (Calm / Normal)</span>
                <span>3 (Moderate Disruption)</span>
                <span>5 (Emergency Hazard)</span>
              </div>
            </div>

            {/* Description Textarea */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Ground Observations & Road Impact *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe waterlogging depth, tree branches fallen, visibility distance, or traffic gridlock..."
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                transition: 'transform 0.15s'
              }}
            >
              {loading ? 'Ingesting to Exasol...' : '🚀 Submit Ground Truth Observation'}
            </button>
          </form>
        </div>

        {/* Live Submissions Feed Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Telemetry Info Card */}
          <div style={{
            background: 'rgba(15, 30, 54, 0.85)',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.16)',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Exasol Geospatial Cross-Validation
              </h4>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
              Submitted observations are matched to nearest observation stations via Euclidean distance indexing in Exasol, validating official radar telemetry in real-time.
            </p>
          </div>

          {/* Submissions List */}
          <div style={{
            background: 'rgba(15, 30, 54, 0.85)',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.16)',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            flex: 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                📡 Live Citizen Reports ({recentReports.length})
              </h4>
              <button
                onClick={fetchReports}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {/* 7-Day Freshness Guard Policy Tag */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: '#7dd3fc',
              fontWeight: 700
            }}>
              <span>🛡️ 7-Day Ground Truth Filter</span>
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>Older reports purged</span>
            </div>

            {recentReports.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No active citizen reports logged within the last 7 days. Submit the first observation!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
                {recentReports.slice(-6).reverse().map((r, i) => {
                  const badge = getSeverityBadge(r.severity_rating);
                  return (
                    <div
                      key={r.id || i}
                      style={{
                        padding: '14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderLeft: `4px solid ${badge.color}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc' }}>
                            {r.reporter_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            📍 {r.reporter_location || r.city_name || 'Observation Point'}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border
                        }}>
                          Severity {r.severity_rating}/5
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {r.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.72rem', color: '#94a3b8' }}>
                        <span>Condition: <strong style={{ color: '#7dd3fc' }}>{r.weather_condition || 'Normal'}</strong></span>
                        <FreshnessBadge timestamp={r.timestamp} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}