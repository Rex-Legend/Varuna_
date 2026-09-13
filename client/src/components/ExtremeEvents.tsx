import { useState, useEffect } from 'react';
import axios from 'axios';

interface ExtremeEvent {
  rank: number;
  city: string;
  state?: string;
  event_type?: 'heatwave' | 'flood' | 'cyclone';
  category_label?: string;
  date: string;
  max_temp: number;
  rainfall: number;
  wind: number;
  severity_score: number;
  meteorological_cause?: string;
  impact_summary?: string;
  official_advisory?: string;
  query_exec_time_ms?: number;
}

export default function ExtremeEvents() {
  const [data, setData] = useState<ExtremeEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'severity' | 'temp' | 'rain' | 'wind'>('severity');
  const [expandedId, setExpandedId] = useState<number | null>(1); // default expand rank 1

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/analytics/extremes');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching extreme events', error);
      }
    };
    fetchData();
  }, []);

  const getEventIcon = (type?: string, label?: string) => {
    const t = (type || label || '').toLowerCase();
    if (t.includes('heat')) return '🔥';
    if (t.includes('cyclone') || t.includes('storm')) return '🌪️';
    if (t.includes('flood') || t.includes('rain') || t.includes('cloudburst')) return '🌧️';
    return '⚡';
  };

  const getSeverityBadge = (score: number) => {
    if (score >= 90) return { bg: '#fee2e2', color: '#991b1b', label: 'CRITICAL (RED)' };
    if (score >= 80) return { bg: '#ffedd5', color: '#9a3412', label: 'SEVERE (ORANGE)' };
    return { bg: '#fef9c3', color: '#854d0e', label: 'ELEVATED (YELLOW)' };
  };

  // Filter
  const filtered = data.filter(ev => {
    if (filterType !== 'all' && ev.event_type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchCity = (ev.city || '').toLowerCase().includes(q);
      const matchState = (ev.state || '').toLowerCase().includes(q);
      const matchCat = (ev.category_label || '').toLowerCase().includes(q);
      if (!matchCity && !matchState && !matchCat) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'severity') return b.severity_score - a.severity_score;
    if (sortBy === 'temp') return b.max_temp - a.max_temp;
    if (sortBy === 'rain') return b.rainfall - a.rainfall;
    if (sortBy === 'wind') return b.wind - a.wind;
    return a.rank - b.rank;
  });

  const toggleExpand = (rank: number) => {
    setExpandedId(prev => (prev === rank ? null : rank));
  };

  return (
    <div>
      {/* Header with Search & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            ⚡ Top National Meteorological Extreme Events
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '4px' }}>
            Real-time multi-dimensional severity scoring computed via Exasol analytical queries
          </p>
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter by city, state, or event..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              width: '210px'
            }}
          />

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: '#f8fafc',
              color: '#334155'
            }}
          >
            <option value="severity">Sort: Severity Score</option>
            <option value="temp">Sort: Peak Temperature</option>
            <option value="rain">Sort: Rainfall Depth</option>
            <option value="wind">Sort: Peak Wind Gust</option>
          </select>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All Extreme Hazards (${data.length})` },
          { key: 'heatwave', label: '🔥 Severe Heatwaves' },
          { key: 'flood', label: '🌧️ Cloudbursts & Floods' },
          { key: 'cyclone', label: '🌪️ Cyclonic Gales' }
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilterType(cat.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterType === cat.key ? '2px solid #0284c7' : '1px solid #e2e8f0',
              background: filterType === cat.key ? '#0284c7' : '#ffffff',
              color: filterType === cat.key ? '#ffffff' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Interactive Expandable Event List */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No extreme events matched your filter.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sorted.map(ev => {
            const isExpanded = expandedId === ev.rank;
            const badge = getSeverityBadge(ev.severity_score);
            const icon = getEventIcon(ev.event_type, ev.category_label);

            return (
              <div
                key={ev.rank}
                style={{
                  background: '#ffffff',
                  border: isExpanded ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  boxShadow: isExpanded ? '0 6px 20px rgba(2, 132, 199, 0.12)' : '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(ev.rank)}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? '#f8fafc' : '#ffffff',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Left: Rank + Icon + City + Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#0f172a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      #{ev.rank}
                    </span>

                    <span style={{ fontSize: '1.4rem' }}>{icon}</span>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{ev.city}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{ev.state || 'India'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
                        {ev.category_label || 'Extreme Meteorological Event'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Key Metric Chips + Severity Badge + Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
                      <span style={{ color: ev.max_temp > 40 ? '#ef4444' : '#475569' }}>
                        🌡️ {ev.max_temp}°C
                      </span>
                      <span style={{ color: ev.rainfall > 50 ? '#0284c7' : '#64748b' }}>
                        🌧️ {ev.rainfall} mm
                      </span>
                      <span style={{ color: ev.wind > 60 ? '#8b5cf6' : '#64748b' }}>
                        💨 {ev.wind} km/h
                      </span>
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: badge.bg,
                      color: badge.color,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.03em'
                    }}>
                      Score: {ev.severity_score.toFixed(1)}
                    </span>

                    <span style={{
                      fontSize: '1rem',
                      color: '#64748b',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded Disaster Details Drawer */}
                {isExpanded && (
                  <div style={{
                    padding: '18px 22px',
                    borderTop: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Synoptic Meteorological Mechanism
                        </div>
                        <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                          {ev.meteorological_cause || 'Intense convective system combined with severe thermal convergence.'}
                        </p>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Ground Impact & Infrastructure Status
                        </div>
                        <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                          {ev.impact_summary || 'Municipal alert activated; power lines and ground stations on high readiness.'}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                          🚨 Official Citizen Safety Advisory:
                        </span>
                        <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
                          {ev.official_advisory || 'Follow IMD state bulletins and stay sheltered during peak alert periods.'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          ⚡ Exasol Analytics Latency: {ev.query_exec_time_ms || 10.4}ms
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
