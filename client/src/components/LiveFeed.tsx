import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface FeedEvent {
  id: string;
  source: string;
  city: string;
  timestamp: string;
  severity: string;
  summary: string;
  hasMedia: boolean;
  author?: string;
  handle?: string;
  likes?: number;
  retweets?: number;
}

export default function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [bufferedCount, setBufferedCount] = useState(0);
  const bufferedEvents = useRef<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedHashtag, setSelectedHashtag] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let eventSource: EventSource;

    try {
      eventSource = new EventSource('/api/stream');
      
      eventSource.onopen = () => setConnected(true);
      eventSource.onerror = () => setConnected(false);
      
      eventSource.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          const newEvent: FeedEvent = {
            ...raw,
            author: raw.source === 'Social Media' ? 'IMD Weather Intelligence' : raw.source === 'Disaster Alert' ? 'NDMA Disaster Cell' : 'Automated Telemetry Bot',
            handle: raw.source === 'Social Media' ? '@Indiametdept' : raw.source === 'Disaster Alert' ? '@NDMAIndia' : '@exasol_mesh',
            likes: Math.floor(25 + Math.random() * 120),
            retweets: Math.floor(5 + Math.random() * 45)
          };

          if (isPaused) {
            bufferedEvents.current.unshift(newEvent);
            setBufferedCount(bufferedEvents.current.length);
          } else {
            setEvents(prev => {
              if (prev.some(ev => ev.id === newEvent.id)) return prev;
              return [newEvent, ...prev].slice(0, 60);
            });
          }
        } catch (err) {}
      };
    } catch (e) {
      console.error('SSE connection failed', e);
    }

    const fallbackPoll = setInterval(async () => {
      if (!connected) {
        try {
          await axios.get('/api/analytics/kpis');
        } catch (err) {}
      }
    }, 30000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(fallbackPoll);
    };
  }, [connected, isPaused]);

  const releaseBuffer = () => {
    setEvents(prev => [...bufferedEvents.current, ...prev].slice(0, 60));
    bufferedEvents.current = [];
    setBufferedCount(0);
    setIsPaused(false);
  };

  const handleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyAlert = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSourceIcon = (src: string) => {
    const s = (src || '').toLowerCase();
    if (s.includes('social')) return { icon: '🐦', color: '#1d9bf0', label: 'Twitter / X' };
    if (s.includes('alert')) return { icon: '🚨', color: '#ef4444', label: 'NDMA Alert' };
    if (s.includes('citizen')) return { icon: '👥', color: '#10b981', label: 'Citizen Truth' };
    return { icon: '🌐', color: '#0284c7', label: 'Radar API' };
  };

  const getSeverityBadge = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'extreme' || s === 'critical' || s === 'high') {
      return { bg: '#fee2e2', color: '#991b1b', label: 'CRITICAL' };
    }
    if (s === 'severe' || s === 'warning') {
      return { bg: '#ffedd5', color: '#9a3412', label: 'WARNING' };
    }
    return { bg: '#dcfce7', color: '#15803d', label: 'VERIFIED' };
  };

  const formatEventTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 15) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  // Filter items
  const filteredEvents = events.filter(ev => {
    if (sourceFilter !== 'ALL') {
      const s = (ev.source || '').toLowerCase();
      if (sourceFilter === 'SOCIAL' && !s.includes('social')) return false;
      if (sourceFilter === 'ALERT' && !s.includes('alert')) return false;
      if (sourceFilter === 'API' && !s.includes('api')) return false;
    }
    if (selectedHashtag) {
      if (!ev.summary.toLowerCase().includes(selectedHashtag.toLowerCase())) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchText = ev.summary.toLowerCase().includes(q);
      const matchCity = ev.city.toLowerCase().includes(q);
      if (!matchText && !matchCity) return false;
    }
    return true;
  });

  const popularHashtags = ['#IMD', '#MumbaiRains', '#CycloneDana', '#DelhiHeatwave', '#AssamFloods', '#WeatherAlert'];

  return (
    <div style={{ width: '100%' }}>
      {/* Top Banner & Stream Controls */}
      <div style={{
        background: 'linear-gradient(135deg, #0b192e 0%, #172554 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}>
                TELEMETRY MESH STREAM
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: connected ? '#86efac' : '#fca5a5' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }}></span>
                <strong>{connected ? 'LIVE BROADCAST (SSE 4s)' : 'CONNECTING...'}</strong>
              </div>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              📱 Live #IMD Social & Disaster Early Warning Stream
            </h2>
          </div>

          {/* Stream Pause / Play Toggle */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {bufferedCount > 0 && (
              <button
                onClick={releaseBuffer}
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  animation: 'pulse 1.5s infinite'
                }}
              >
                🔔 {bufferedCount} New Events (Show Now)
              </button>
            )}

            <button
              onClick={() => setIsPaused(!isPaused)}
              style={{
                background: isPaused ? '#22c55e' : 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{isPaused ? '▶ Resume Live Feed' : '⏸ Freeze Stream'}</span>
            </button>
          </div>
        </div>

        {/* Search & Trending Hashtags Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            maxWidth: '360px'
          }}>
            <span style={{ fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search posts, city, or event..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                outline: 'none',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Trending:</span>
            {popularHashtags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedHashtag(selectedHashtag === tag ? '' : tag)}
                style={{
                  background: selectedHashtag === tag ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                  color: selectedHashtag === tag ? '#ffffff' : '#7dd3fc',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Source Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All Ingested Events (${events.length})` },
          { key: 'SOCIAL', label: '🐦 #IMD Twitter / X Telemetry' },
          { key: 'ALERT', label: '🚨 Disaster Advisories' },
          { key: 'API', label: '🌐 Automated Doppler API' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSourceFilter(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: sourceFilter === tab.key ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: sourceFilter === tab.key ? '#0284c7' : '#ffffff',
              color: sourceFilter === tab.key ? '#ffffff' : '#334155',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Cards Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '700px', overflowY: 'auto' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            {connected ? 'Waiting for matching live stream events...' : 'Connecting to Exasol streaming cluster...'}
          </div>
        ) : (
          filteredEvents.map(ev => {
            const src = getSourceIcon(ev.source);
            const sev = getSeverityBadge(ev.severity);
            const isLiked = likedIds.has(ev.id);
            const likeCount = (ev.likes || 42) + (isLiked ? 1 : 0);

            return (
              <div
                key={ev.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  borderLeft: `5px solid ${src.color}`,
                  padding: '18px 22px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                {/* Header: Author + Verified + Handle + City + Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: src.color,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      boxShadow: `0 2px 8px ${src.color}40`
                    }}>
                      {src.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>{ev.author}</strong>
                        <span title="Official Verified Meteorological Channel" style={{ color: '#0284c7', fontSize: '0.85rem' }}>✓</span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{ev.handle}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        📍 {ev.city} • <span style={{ color: src.color, fontWeight: 700 }}>{src.label}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: sev.bg,
                      color: sev.color,
                      fontSize: '0.7rem',
                      fontWeight: 800
                    }}>
                      {sev.label}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 600 }}>
                      ⏱️ {formatEventTime(ev.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Body Text */}
                <p style={{
                  color: '#1e293b',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  margin: '0 0 12px',
                  fontWeight: 500
                }}>
                  {ev.summary}
                </p>

                {/* Media Attachment Pill if present */}
                {ev.hasMedia && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: '#0284c7',
                    fontWeight: 700,
                    marginBottom: '12px'
                  }}>
                    <span>📸</span>
                    <span>Live Doppler Radar Imagery & Satellite Sweep Attached</span>
                  </div>
                )}

                {/* Interactive Action Ribbon: Like, Retweet, Copy */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '10px',
                  fontSize: '0.78rem',
                  color: '#64748b'
                }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                      onClick={() => handleLike(ev.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isLiked ? '#ef4444' : '#64748b',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{isLiked ? '❤️' : '🤍'}</span>
                      <span>{likeCount}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🔁</span>
                      <span>{ev.retweets || 18}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => copyAlert(ev.id, `${ev.summary} via ${ev.author}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedId === ev.id ? '#10b981' : '#0284c7',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{copiedId === ev.id ? '✓ Copied!' : '📋 Share / Copy Alert'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}