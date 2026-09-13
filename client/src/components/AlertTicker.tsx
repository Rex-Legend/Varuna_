import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { getDataFreshness, filterWithinWeek, FreshnessBadge } from '../utils/freshness';

interface Alert {
  alert_id?: number;
  alert_type: string;
  severity: string;
  title?: string;
  alert_title?: string;
  description: string;
  affected_states: string;
  affected_districts?: string[];
  issued_at: string;
  valid_until?: string;
  is_active?: boolean;
  freshness?: 'LIVE' | 'NEW';
  is_within_week?: boolean;
  meteorological_cause?: string;
  synoptic_metrics?: {
    peak_wind_kmh?: number;
    rainfall_rate_mm?: number;
    peak_temp_c?: number;
    surge_height_m?: number;
    river_level_above_danger_m?: number;
    visibility_m?: number;
    lightning_strikes_per_hr?: number;
  };
  evacuation_status?: string;
  sop_dos?: string[];
  sop_donts?: string[];
  helpline_numbers?: { name: string; number: string }[];
  authority?: string;
  bulletin_number?: string;
}

export default function AlertTicker() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'RED' | 'SEVERE' | 'MODERATE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [freshnessFilter, setFreshnessFilter] = useState<'ALL' | 'LIVE' | 'NEW'>('ALL');
  const [stateSearch, setStateSearch] = useState<string>('');
  const [activeBroadcastIdx, setActiveBroadcastIdx] = useState<number>(0);
  const [isBroadcastPaused, setIsBroadcastPaused] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [selectedAlertModal, setSelectedAlertModal] = useState<Alert | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch alerts from backend
  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts');
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Strict 7-day retention guard: filter out any alert older than 7 days
        const validAlerts = filterWithinWeek<Alert>(response.data, (a: any) => a.issued_at);
        setAlerts(validAlerts);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching alerts', error);
    }
  };

  // Manual refresh with POST to trigger live server re-ingest
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.post('/api/alerts/refresh');
      if (response.data?.alerts) {
        const validAlerts = filterWithinWeek<Alert>(response.data.alerts, (a: any) => a.issued_at);
        setAlerts(validAlerts);
      } else {
        await fetchAlerts();
      }
      setLastUpdated(new Date());
    } catch (e) {
      await fetchAlerts();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Initial load & recurring 15s live poll
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Cycling broadcast ticker timer (6 seconds per slide)
  useEffect(() => {
    if (isBroadcastPaused || alerts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBroadcastIdx(prev => (prev + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isBroadcastPaused, alerts.length]);

  // Voice synthesis for emergency broadcast announcement
  const toggleSpeech = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getSeverityMeta = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'extreme' || s === 'critical' || s === 'high') {
      return {
        level: 'RED',
        label: 'RED ALERT',
        borderColor: '#ef4444',
        badgeBg: 'rgba(239, 68, 68, 0.2)',
        badgeColor: '#fca5a5',
        icon: '🚨',
        glowColor: 'rgba(239, 68, 68, 0.4)'
      };
    }
    if (s === 'severe') {
      return {
        level: 'SEVERE',
        label: 'ORANGE WARNING',
        borderColor: '#f97316',
        badgeBg: 'rgba(249, 115, 22, 0.2)',
        badgeColor: '#fdba74',
        icon: '⚠️',
        glowColor: 'rgba(249, 115, 22, 0.4)'
      };
    }
    return {
      level: 'MODERATE',
      label: 'YELLOW ADVISORY',
      borderColor: '#eab308',
      badgeBg: 'rgba(234, 179, 8, 0.2)',
      badgeColor: '#fde047',
      icon: 'ℹ️',
      glowColor: 'rgba(234, 179, 8, 0.4)'
    };
  };

  const getDisasterIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('cyclone')) return '🌀';
    if (t.includes('flood')) return '🌊';
    if (t.includes('heat')) return '🔥';
    if (t.includes('fog')) return '🌫️';
    if (t.includes('rain')) return '🌧️';
    if (t.includes('gale') || t.includes('storm')) return '🌪️';
    return '⚡';
  };

  const getTitle = (a: Alert) => a.title || a.alert_title || a.alert_type || 'Disaster Bulletin';

  const copyAlertText = (alert: Alert) => {
    const text = `🚨 OFFICIAL NDMA/IMD WEATHER BULLETIN [${alert.bulletin_number || 'EMERGENCY'}]\n` +
      `TYPE: ${alert.alert_type} (${alert.severity.toUpperCase()})\n` +
      `REGIONS: ${alert.affected_states}\n` +
      `SUMMARY: ${alert.description}\n` +
      `AUTHORITY: ${alert.authority || 'National Disaster Management Authority'}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(alert.alert_id || 999);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Counts based on actual meta.level
  const redCount = alerts.filter(a => getSeverityMeta(a.severity).level === 'RED').length;
  const orangeCount = alerts.filter(a => getSeverityMeta(a.severity).level === 'SEVERE').length;
  const yellowCount = alerts.filter(a => getSeverityMeta(a.severity).level === 'MODERATE').length;
  const liveCount = alerts.filter(a => getDataFreshness(a.issued_at).isLive).length;
  const newCount = alerts.filter(a => {
    const f = getDataFreshness(a.issued_at);
    return f.isWithinWeek && !f.isLive;
  }).length;

  // Filter alerts by: Freshness (<= 7 days) + Severity + Category + Search term
  const filteredAlerts = alerts.filter(a => {
    const fresh = getDataFreshness(a.issued_at);
    // Strict 7-day retention guard: purge/filter anything older than 7 days
    if (!fresh.isWithinWeek) return false;

    // Freshness filter
    if (freshnessFilter === 'LIVE' && !fresh.isLive) return false;
    if (freshnessFilter === 'NEW' && !fresh.isNew) return false;

    const meta = getSeverityMeta(a.severity);
    if (filter !== 'ALL' && meta.level !== filter) return false;

    if (categoryFilter !== 'ALL') {
      const t = (a.alert_type || '').toLowerCase();
      if (!t.includes(categoryFilter.toLowerCase())) return false;
    }

    if (stateSearch.trim()) {
      const q = stateSearch.toLowerCase();
      const states = (a.affected_states || '').toLowerCase();
      const title = (getTitle(a) || '').toLowerCase();
      const desc = (a.description || '').toLowerCase();
      const districts = (a.affected_districts || []).join(' ').toLowerCase();
      if (!states.includes(q) && !title.includes(q) && !desc.includes(q) && !districts.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const activeBroadcast = alerts[activeBroadcastIdx] || alerts[0];
  const broadcastMeta = activeBroadcast ? getSeverityMeta(activeBroadcast.severity) : null;

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Official Warning Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                background: '#dc2626',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span className="pulse-red-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ffffff', display: 'inline-block' }}></span>
                OFFICIAL NDMA / IMD BULLETINS
              </span>
              <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                ● Exasol Early Warning Spatial Mesh (Live Telemetry)
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              🚨 National Emergency & Disaster Alert Center
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              Real-time multi-hazard bulletins synthesized from automated doppler stations & NDMA sirens • Synced {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </div>
          </div>

          {/* Refresh & Live Status Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#7dd3fc',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }}>🔄</span>
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live Data'}</span>
            </button>

            {/* Severity Counters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div 
                onClick={() => { setFilter('RED'); setCategoryFilter('ALL'); }}
                style={{
                  background: 'rgba(220, 38, 38, 0.2)',
                  border: filter === 'RED' ? '2px solid #ef4444' : '1px solid rgba(220, 38, 38, 0.5)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Click to filter Red Alerts"
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f87171' }}>{redCount}</div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>Red Alerts</div>
              </div>

              <div 
                onClick={() => { setFilter('SEVERE'); setCategoryFilter('ALL'); }}
                style={{
                  background: 'rgba(234, 88, 12, 0.2)',
                  border: filter === 'SEVERE' ? '2px solid #f97316' : '1px solid rgba(234, 88, 12, 0.5)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Click to filter Orange Warnings"
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fb923c' }}>{orangeCount}</div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#fed7aa', textTransform: 'uppercase' }}>Orange Warnings</div>
              </div>

              <div 
                onClick={() => { setFilter('MODERATE'); setCategoryFilter('ALL'); }}
                style={{
                  background: 'rgba(234, 179, 8, 0.2)',
                  border: filter === 'MODERATE' ? '2px solid #eab308' : '1px solid rgba(234, 179, 8, 0.5)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Click to filter Yellow Advisories"
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fde047' }}>{yellowCount}</div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase' }}>Advisories</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Fully Readable, Interactive Emergency Broadcast Console */}
        {activeBroadcast && (
          <div style={{
            background: 'rgba(10, 22, 40, 0.85)',
            border: `1px solid ${broadcastMeta?.borderColor || 'rgba(56, 189, 248, 0.3)'}`,
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: `0 4px 20px ${broadcastMeta?.glowColor || 'rgba(0,0,0,0.3)'}`,
            position: 'relative'
          }}>
            {/* Top Bar of Broadcast Console: Status + Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: broadcastMeta?.borderColor || '#ef4444',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📻</span>
                  <span>LIVE BROADCAST #{activeBroadcastIdx + 1} OF {alerts.length}</span>
                </span>

                <span style={{
                  background: broadcastMeta?.badgeBg,
                  color: broadcastMeta?.badgeColor,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {broadcastMeta?.label}
                </span>

                <FreshnessBadge timestamp={activeBroadcast.issued_at} size="sm" />
              </div>

              {/* Broadcast Controls: Prev, Next, Pause, Audio TTS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Audio TTS Button */}
                <button
                  onClick={() => toggleSpeech(
                    `Emergency Weather Bulletin. ${activeBroadcast.title}. Affecting states: ${activeBroadcast.affected_states}. ${activeBroadcast.description}`
                  )}
                  style={{
                    background: isSpeaking ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                    color: isSpeaking ? '#ffffff' : '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={isSpeaking ? 'Stop Voice Broadcast' : 'Listen to Live Audio Broadcast'}
                >
                  <span>{isSpeaking ? '⏹' : '🔊'}</span>
                  <span>{isSpeaking ? 'Stop Audio' : 'Listen Broadcast'}</span>
                </button>

                {/* Pause / Play Toggle */}
                <button
                  onClick={() => setIsBroadcastPaused(!isBroadcastPaused)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: isBroadcastPaused ? '#fbbf24' : '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title={isBroadcastPaused ? 'Resume Cycling' : 'Pause Cycling to Read'}
                >
                  {isBroadcastPaused ? '▶ Resume' : '⏸ Pause'}
                </button>

                {/* Previous Button */}
                <button
                  onClick={() => setActiveBroadcastIdx(prev => (prev - 1 + alerts.length) % alerts.length)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Previous Bulletin"
                >
                  ◀
                </button>

                {/* Next Button */}
                <button
                  onClick={() => setActiveBroadcastIdx(prev => (prev + 1) % alerts.length)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Next Bulletin"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Broadcast Content: Clean, Legible, Multi-line (Not Truncated) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {getDisasterIcon(activeBroadcast.alert_type)} {getTitle(activeBroadcast)}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.55, margin: '0 0 10px 0' }}>
                  {activeBroadcast.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>
                    📍 Regions: <strong style={{ color: '#38bdf8' }}>{activeBroadcast.affected_states}</strong>
                  </span>
                  {activeBroadcast.synoptic_metrics?.peak_wind_kmh && (
                    <span style={{ color: '#c084fc', fontWeight: 700 }}>
                      💨 Gusts: {activeBroadcast.synoptic_metrics.peak_wind_kmh} km/h
                    </span>
                  )}
                  {activeBroadcast.synoptic_metrics?.peak_temp_c && (
                    <span style={{ color: '#f87171', fontWeight: 700 }}>
                      🌡️ Peak Temp: {activeBroadcast.synoptic_metrics.peak_temp_c}°C
                    </span>
                  )}
                  {activeBroadcast.synoptic_metrics?.rainfall_rate_mm && (
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                      🌧️ Depth: {activeBroadcast.synoptic_metrics.rainfall_rate_mm} mm
                    </span>
                  )}
                </div>
              </div>

              {/* Action: Open Complete Dossier */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'center' }}>
                <button
                  onClick={() => setSelectedAlertModal(activeBroadcast)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  📖 Inspect Dossier & Helplines →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Multi-Axis Filter Bar: Access Each Part Separately */}
      <div style={{
        background: 'rgba(15, 30, 54, 0.7)',
        border: '1px solid rgba(56, 189, 248, 0.16)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '22px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          {/* Severity Level Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: `All Bulletins (${alerts.length})` },
              { key: 'RED', label: `🔴 Red Alerts (${redCount})` },
              { key: 'SEVERE', label: `🟠 Orange Warnings (${orangeCount})` },
              { key: 'MODERATE', label: `🟡 Advisories (${yellowCount})` }
            ].map(chip => (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: filter === chip.key ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: filter === chip.key ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                  color: filter === chip.key ? '#ffffff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Region / State Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>🔍 Filter Region:</span>
            <input
              type="text"
              placeholder="e.g. Assam, Odisha, Delhi, Kerala..."
              value={stateSearch}
              onChange={e => setStateSearch(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '6px 14px',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                width: '220px'
              }}
            />
            {stateSearch && (
              <button
                onClick={() => setStateSearch('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                title="Clear region filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Hazard Category Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: '4px' }}>
            Hazard Type:
          </span>
          {[
            { key: 'ALL', label: 'All Hazards' },
            { key: 'cyclone', label: '🌀 Cyclones' },
            { key: 'flood', label: '🌊 Floods' },
            { key: 'heat', label: '🔥 Heatwaves' },
            { key: 'rain', label: '🌧️ Heavy Rain' },
            { key: 'gale', label: '🌪️ Gales & Squalls' },
            { key: 'fog', label: '🌫️ Dense Fog' }
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: categoryFilter === cat.key ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                background: categoryFilter === cat.key ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: categoryFilter === cat.key ? '#38bdf8' : '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: categoryFilter === cat.key ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat.label}
            </button>
          ))}

          {(categoryFilter !== 'ALL' || stateSearch !== '' || filter !== 'ALL' || freshnessFilter !== 'ALL') && (
            <button
              onClick={() => {
                setFilter('ALL');
                setCategoryFilter('ALL');
                setFreshnessFilter('ALL');
                setStateSearch('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                marginLeft: 'auto'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Freshness Filter Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: '4px' }}>
            Data Freshness:
          </span>
          {[
            { key: 'ALL', label: `All Fresh Bulletins (<= 2d) • ${alerts.length}`, activeBg: '#1e293b', border: 'rgba(255,255,255,0.2)' },
            { key: 'LIVE', label: `🟢 Strictly Live (< 2h) • ${liveCount}`, activeBg: '#15803d', border: 'rgba(34, 197, 94, 0.4)' },
            { key: 'NEW', label: `🔵 Recent (2h - 2d) • ${newCount}`, activeBg: '#0369a1', border: 'rgba(56, 189, 248, 0.4)' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFreshnessFilter(f.key as any)}
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                border: freshnessFilter === f.key ? '1px solid #38bdf8' : `1px solid ${f.border}`,
                background: freshnessFilter === f.key ? f.activeBg : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
          <span
            title="Policy: Exasol strictly purges and filters any alert data older than 2 days (48 hours)."
            style={{
              marginLeft: 'auto',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#7dd3fc',
              fontSize: '0.72rem',
              fontWeight: 800
            }}
          >
            🛡️ 2-Day Purge Guard Active
          </span>
        </div>
      </div>

      {/* 4. Alert Cards Grid */}
      {filteredAlerts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(15, 30, 54, 0.6)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.16)',
          color: '#94a3b8'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🛡️</div>
          <h4 style={{ color: '#f8fafc', margin: '0 0 6px 0', fontSize: '1.1rem' }}>No Active Bulletins Matching Filters</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Try clearing your region or category filter to view other national advisories.</p>
          <button
            onClick={() => { setFilter('ALL'); setCategoryFilter('ALL'); setStateSearch(''); }}
            style={{
              marginTop: '16px',
              padding: '8px 18px',
              borderRadius: '10px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Show All Active Bulletins
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredAlerts.map((alert, idx) => {
            const meta = getSeverityMeta(alert.severity);
            const icon = getDisasterIcon(alert.alert_type);
            const isCopied = copiedId === (alert.alert_id || idx);

            return (
              <div
                key={alert.alert_id || idx}
                style={{
                  background: 'rgba(15, 30, 54, 0.85)',
                  borderRadius: '16px',
                  border: '1px solid rgba(56, 189, 248, 0.16)',
                  borderTop: `4px solid ${meta.borderColor}`,
                  padding: '22px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
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
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7dd3fc', textTransform: 'uppercase' }}>
                        {alert.alert_type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FreshnessBadge timestamp={alert.issued_at} size="sm" />
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
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '10px', lineHeight: 1.3 }}>
                    {getTitle(alert)}
                  </h3>

                  {/* Description */}
                  <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55, marginBottom: '16px' }}>
                    {alert.description}
                  </p>

                  {/* Affected Regions (Clickable to Filter) */}
                  <div style={{
                    background: 'rgba(10, 22, 40, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Targeted States & Territories (Click to Filter):
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {alert.affected_states.split(',').map((st, sIdx) => {
                        const trimmedState = st.trim();
                        const isCurrentState = stateSearch.toLowerCase() === trimmedState.toLowerCase();
                        return (
                          <button
                            key={sIdx}
                            onClick={() => setStateSearch(isCurrentState ? '' : trimmedState)}
                            style={{
                              background: isCurrentState ? '#0284c7' : 'rgba(56, 189, 248, 0.1)',
                              border: isCurrentState ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.25)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: isCurrentState ? '#ffffff' : '#bae6fd',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title={`Filter alerts for ${trimmedState}`}
                          >
                            <span>📍 {trimmedState}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evacuation Status Pill */}
                  {alert.evacuation_status && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.76rem',
                      color: '#fca5a5',
                      fontWeight: 600,
                      marginBottom: '16px'
                    }}>
                      ⚡ {alert.evacuation_status}
                    </div>
                  )}
                </div>

                {/* Card Footer: Timestamps, Helplines & Dossier Button */}
                <div>
                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    <span>
                      Issued: <strong style={{ color: '#f8fafc' }}>{formatDistanceToNow(new Date(alert.issued_at), { addSuffix: true })}</strong>
                    </span>
                    <span style={{
                      background: 'rgba(2, 132, 199, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      color: '#38bdf8'
                    }}>
                      {alert.bulletin_number || 'IMD/NDMA Verified'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedAlertModal(alert)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <span>📖</span>
                      <span>View Protocol & Helplines</span>
                    </button>

                    <button
                      onClick={() => copyAlertText(alert)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: isCopied ? '#4ade80' : '#cbd5e1',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Copy official text for SMS or social broadcast"
                    >
                      {isCopied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Detailed Emergency Action Dossier Modal Dialog */}
      {selectedAlertModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 15, 30, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedAlertModal(null)}
        >
          <div
            style={{
              background: '#0b1d36',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #09182d 0%, #102a45 100%)',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: getSeverityMeta(selectedAlertModal.severity).badgeBg,
                    color: getSeverityMeta(selectedAlertModal.severity).badgeColor,
                    fontSize: '0.72rem',
                    fontWeight: 900
                  }}>
                    {getSeverityMeta(selectedAlertModal.severity).label}
                  </span>
                  <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
                    {selectedAlertModal.bulletin_number || 'IMD OFFICIAL WARNING'}
                  </span>
                  <FreshnessBadge timestamp={selectedAlertModal.issued_at} size="sm" />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#f8fafc', lineHeight: 1.3 }}>
                  {getDisasterIcon(selectedAlertModal.alert_type)} {getTitle(selectedAlertModal)}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                  Issuing Authority: {selectedAlertModal.authority || 'National Disaster Management Authority (NDMA)'}
                </div>
              </div>

              <button
                onClick={() => setSelectedAlertModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Meteorological Synopsis */}
              <div style={{
                background: 'rgba(15, 30, 54, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.16)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7dd3fc', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Synoptic Situation & Ground Description
                </div>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.55, margin: '0 0 10px 0' }}>
                  {selectedAlertModal.description}
                </p>
                {selectedAlertModal.meteorological_cause && (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                    <strong>Atmospheric Trigger:</strong> {selectedAlertModal.meteorological_cause}
                  </div>
                )}
              </div>

              {/* Affected Districts & Evacuation Readiness */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Targeted Districts
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(selectedAlertModal.affected_districts || ['Zone A', 'Zone B', 'Zone C']).map((d, di) => (
                      <span key={di} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', padding: '2px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Evacuation Readiness
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 700 }}>
                    {selectedAlertModal.evacuation_status || 'Precautionary Alert: Emergency Teams on Mobilization'}
                  </div>
                </div>
              </div>

              {/* Standard Operating Procedures (SOP): Dos & Don'ts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {/* Dos */}
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', marginBottom: '8px' }}>
                    ✅ Mandatory Citizen Actions (DOs)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {(selectedAlertModal.sop_dos || [
                      'Stay indoors inside fortified structures',
                      'Maintain stock of emergency drinking water and flashlights',
                      'Follow official district wireless announcements'
                    ]).map((doItem, doIdx) => (
                      <li key={doIdx} style={{ marginBottom: '4px' }}>{doItem}</li>
                    ))}
                  </ul>
                </div>

                {/* Don'ts */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '8px' }}>
                    ❌ Dangerous Prohibitions (DON'Ts)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {(selectedAlertModal.sop_donts || [
                      'Do not venture outdoors near electrical power lines',
                      'Do not drive across submerged causeways or overflowing bridges',
                      'Do not spread unverified rumors on social media channels'
                    ]).map((dontItem, dontIdx) => (
                      <li key={dontIdx} style={{ marginBottom: '4px' }}>{dontItem}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verified Emergency Helplines */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7dd3fc', textTransform: 'uppercase', marginBottom: '10px' }}>
                  📞 24x7 Emergency Helplines & Disaster Assistance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {(selectedAlertModal.helpline_numbers || [
                    { name: 'NDMA National Control', number: '1070' },
                    { name: 'District Emergency Desk', number: '1077' },
                    { name: 'National Integrated Emergency', number: '112' }
                  ]).map((h, hi) => (
                    <div
                      key={hi}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{h.name}</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>{h.number}</div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(h.number);
                          alert(`Copied helpline number: ${h.number}`);
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: 'none',
                          color: '#38bdf8',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => toggleSpeech(
                    `Emergency Protocol for ${selectedAlertModal.title}. Affected states: ${selectedAlertModal.affected_states}. ${selectedAlertModal.description}`
                  )}
                  style={{
                    flex: 1,
                    background: isSpeaking ? '#ef4444' : 'rgba(56, 189, 248, 0.15)',
                    color: isSpeaking ? '#ffffff' : '#7dd3fc',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{isSpeaking ? '⏹' : '🔊'}</span>
                  <span>{isSpeaking ? 'Stop Audio' : 'Announce via Voice'}</span>
                </button>

                <button
                  onClick={() => copyAlertText(selectedAlertModal)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  📋 Copy Full Advisory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}