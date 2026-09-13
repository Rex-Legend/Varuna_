import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  alert_id?: number;
  alert_type: string;
  severity: string;
  title?: string;
  alert_title?: string;
  description: string;
  affected_states: string;
  issued_at: string;
}

export default function AlertTicker() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'EXTREME' | 'SEVERE' | 'MODERATE'>('ALL');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('/api/alerts');
        setAlerts(response.data);
      } catch (error) {
        console.error('Error fetching alerts', error);
      }
    };
    fetchAlerts();
  }, []);

  const getSeverityMeta = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'extreme' || s === 'high') {
      return {
        level: 'EXTREME',
        label: 'RED ALERT',
        borderColor: '#dc2626',
        badgeBg: '#fee2e2',
        badgeColor: '#991b1b',
        icon: '🚨'
      };
    }
    if (s === 'severe') {
      return {
        level: 'SEVERE',
        label: 'ORANGE WARNING',
        borderColor: '#ea580c',
        badgeBg: '#ffedd5',
        badgeColor: '#9a3412',
        icon: '⚠️'
      };
    }
    return {
      level: 'MODERATE',
      label: 'YELLOW ADVISORY',
      borderColor: '#eab308',
      badgeBg: '#fef9c3',
      badgeColor: '#854d0e',
      icon: 'ℹ️'
    };
  };

  const getDisasterIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('cyclone')) return '🌀';
    if (t.includes('flood')) return '🌊';
    if (t.includes('heat')) return '🌡️';
    if (t.includes('fog')) return '🌫️';
    if (t.includes('rain')) return '🌧️';
    return '⚡';
  };

  const getTitle = (a: Alert) => a.title || a.alert_title || a.alert_type || 'Disaster Bulletin';

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    const meta = getSeverityMeta(a.severity);
    return meta.level === filter;
  });

  const redCount = alerts.filter(a => ['extreme', 'high'].includes((a.severity || '').toLowerCase())).length;
  const orangeCount = alerts.filter(a => (a.severity || '').toLowerCase() === 'severe').length;
  const yellowCount = alerts.filter(a => !['extreme', 'high', 'severe'].includes((a.severity || '').toLowerCase())).length;

  return (
    <div style={{ width: '100%' }}>
      {/* Official Warning Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: '#dc2626',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                OFFICIAL NDMA / IMD BULLETINS
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                ● Real-Time Big Data Early Warning Mesh
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              🚨 National Emergency & Disaster Alert Center
            </h2>
          </div>

          {/* Alert Status Counts */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid #dc2626',
              padding: '8px 14px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f87171' }}>{redCount}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>Red Alerts</div>
            </div>
            <div style={{
              background: 'rgba(234, 88, 12, 0.2)',
              border: '1px solid #ea580c',
              padding: '8px 14px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fb923c' }}>{orangeCount}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fed7aa', textTransform: 'uppercase' }}>Orange Warnings</div>
            </div>
            <div style={{
              background: 'rgba(234, 179, 8, 0.2)',
              border: '1px solid #eab308',
              padding: '8px 14px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fde047' }}>{yellowCount}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase' }}>Yellow Advisories</div>
            </div>
          </div>
        </div>

        {/* Live Ticker Strip */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.85rem'
        }}>
          <span style={{
            background: '#dc2626',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 800,
            whiteSpace: 'nowrap'
          }}>
            BROADCAST
          </span>
          <div style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {alerts.slice(0, 3).map(a => `${getTitle(a)}: ${a.affected_states} — ${a.description}`).join('  |  ')}
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All Bulletins (${alerts.length})` },
          { key: 'EXTREME', label: `🔴 Red Alerts (${redCount})` },
          { key: 'SEVERE', label: `🟠 Orange Warnings (${orangeCount})` },
          { key: 'MODERATE', label: `🟡 Advisories (${yellowCount})` }
        ].map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key as any)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: filter === chip.key ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: filter === chip.key ? '#0284c7' : '#ffffff',
              color: filter === chip.key ? '#ffffff' : '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Alert Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredAlerts.map((alert, idx) => {
          const meta = getSeverityMeta(alert.severity);
          const icon = getDisasterIcon(alert.alert_type);
          return (
            <div
              key={alert.alert_id || idx}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                borderTop: `6px solid ${meta.borderColor}`,
                padding: '22px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
            >
              <div>
                {/* Card Header: Icon + Category + Severity Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                      {alert.alert_type}
                    </span>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: meta.badgeBg,
                    color: meta.badgeColor,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}>
                    {meta.label}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', lineHeight: 1.3 }}>
                  {getTitle(alert)}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                  {alert.description}
                </p>

                {/* Affected Regions */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Targeted States & Territories:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {alert.affected_states.split(',').map((st, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#1e293b'
                        }}
                      >
                        📍 {st.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer: Timestamps & Authority */}
              <div style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: '#64748b'
              }}>
                <span>
                  Issued: <strong>{formatDistanceToNow(new Date(alert.issued_at), { addSuffix: true })}</strong>
                </span>
                <span style={{
                  background: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  color: '#475569'
                }}>
                  IMD / NDMA Verified
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}