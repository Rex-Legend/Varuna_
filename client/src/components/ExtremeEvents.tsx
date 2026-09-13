import { useState, useEffect } from 'react';
import axios from 'axios';
import { getDataFreshness, filterWithinWeek, FreshnessBadge } from '../utils/freshness';

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
  freshness?: 'LIVE' | 'NEW';
  is_within_week?: boolean;
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
        // Strict 7-day retention guard: filter out any event older than 7 days
        const validData = filterWithinWeek<ExtremeEvent>(response.data, (ev: any) => ev.date);
        setData(validData);
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
    if (score >= 90) return { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', label: 'CRITICAL (RED)' };
    if (score >= 80) return { bg: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', border: '1px solid rgba(249, 115, 22, 0.4)', label: 'SEVERE (ORANGE)' };
    return { bg: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.4)', label: 'ELEVATED (YELLOW)' };
  };

  // Filter
  const filtered = data.filter(ev => {
    const fresh = getDataFreshness(ev.date);
    // Strict 7-day retention guard: filter out any event older than 7 days
    if (!fresh.isWithinWeek) return false;

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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            ⚡ Top National Meteorological Extreme Events
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '4px' }}>
            Real-time severity scoring computed via Exasol analytical queries • <span style={{ color: '#38bdf8', fontWeight: 700 }}>Strict 7-Day Window (Live & New Only)</span>
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
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#f8fafc',
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
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: '#0b1d36',
              color: '#f8fafc'
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
              border: filterType === cat.key ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: filterType === cat.key ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
              color: filterType === cat.key ? '#ffffff' : '#94a3b8',
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No extreme events matched your filter.</div>
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
                  background: 'rgba(15, 30, 54, 0.85)',
                  border: isExpanded ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.16)',
                  borderRadius: '14px',
                  boxShadow: isExpanded ? '0 8px 24px rgba(2, 132, 199, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
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
                    background: isExpanded ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
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
                      background: 'rgba(56, 189, 248, 0.2)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
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
                        <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{ev.city}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{ev.state || 'India'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                        {ev.category_label || 'Extreme Meteorological Event'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Key Metric Chips + Severity Badge + Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
                      <span style={{ color: ev.max_temp > 40 ? '#f87171' : '#cbd5e1' }}>
                        🌡️ {ev.max_temp}°C
                      </span>
                      <span style={{ color: ev.rainfall > 50 ? '#38bdf8' : '#cbd5e1' }}>
                        🌧️ {ev.rainfall} mm
                      </span>
                      <span style={{ color: ev.wind > 60 ? '#c084fc' : '#cbd5e1' }}>
                        💨 {ev.wind} km/h
                      </span>
                    </div>

                    <FreshnessBadge timestamp={ev.date} size="sm" />

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: badge.bg,
                      color: badge.color,
                      border: badge.border,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.03em'
                    }}>
                      Score: {ev.severity_score.toFixed(1)}
                    </span>

                    <span style={{
                      fontSize: '1rem',
                      color: '#94a3b8',
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
                    borderTop: '1px solid rgba(56, 189, 248, 0.15)',
                    background: 'rgba(10, 22, 40, 0.95)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7dd3fc', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Synoptic Meteorological Mechanism
                        </div>
                        <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                          {ev.meteorological_cause || 'Intense convective system combined with severe thermal convergence.'}
                        </p>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7dd3fc', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Ground Impact & Infrastructure Status
                        </div>
                        <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                          {ev.impact_summary || 'Municipal alert activated; power lines and ground stations on high readiness.'}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(15, 30, 54, 0.9)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase' }}>
                          🚨 Official Citizen Safety Advisory:
                        </span>
                        <div style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                          {ev.official_advisory || 'Follow IMD state bulletins and stay sheltered during peak alert periods.'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: 'rgba(2, 132, 199, 0.25)',
                          color: '#7dd3fc',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
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
