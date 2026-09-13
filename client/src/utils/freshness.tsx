import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export interface FreshnessInfo {
  status: 'LIVE' | 'NEW' | 'EXPIRED';
  isLive: boolean;
  isNew: boolean;
  isWithinWeek: boolean;
  ageMs: number;
  ageHours: number;
  ageDays: number;
  label: string;
  timeAgo: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
}

/**
 * Evaluates the freshness of any given timestamp.
 * - LIVE: < 2 hours old (or streaming now)
 * - NEW: Between 2 hours and 7 days old
 * - EXPIRED: Older than 7 days (must be filtered out)
 */
export function getDataFreshness(timestampInput?: string | number | Date | null): FreshnessInfo {
  if (!timestampInput) {
    return {
      status: 'LIVE',
      isLive: true,
      isNew: false,
      isWithinWeek: true,
      ageMs: 0,
      ageHours: 0,
      ageDays: 0,
      label: 'LIVE',
      timeAgo: 'Just now',
      icon: '🟢',
      badgeBg: 'rgba(34, 197, 94, 0.18)',
      badgeColor: '#4ade80',
      badgeBorder: '1px solid rgba(34, 197, 94, 0.45)'
    };
  }

  const date = new Date(timestampInput);
  const now = Date.now();
  const timeMs = date.getTime();
  
  // If invalid date, default to live
  if (isNaN(timeMs)) {
    return {
      status: 'LIVE',
      isLive: true,
      isNew: false,
      isWithinWeek: true,
      ageMs: 0,
      ageHours: 0,
      ageDays: 0,
      label: 'LIVE',
      timeAgo: 'Live Telemetry',
      icon: '🟢',
      badgeBg: 'rgba(34, 197, 94, 0.18)',
      badgeColor: '#4ade80',
      badgeBorder: '1px solid rgba(34, 197, 94, 0.45)'
    };
  }

  const ageMs = Math.max(0, now - timeMs);
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const isWithinWeek = ageMs <= SEVEN_DAYS_MS;
  const isLive = ageMs <= TWO_HOURS_MS;

  let timeAgo = 'Just now';
  try {
    const diffSec = Math.floor(ageMs / 1000);
    if (diffSec < 20) timeAgo = 'Just now';
    else if (diffSec < 60) timeAgo = `${diffSec}s ago`;
    else if (ageHours < 1) timeAgo = `${Math.floor(diffSec / 60)}m ago`;
    else if (ageHours < 24) timeAgo = `${ageHours}h ago`;
    else timeAgo = formatDistanceToNow(date, { addSuffix: true });
  } catch {
    timeAgo = 'Recently';
  }

  if (!isWithinWeek) {
    return {
      status: 'EXPIRED',
      isLive: false,
      isNew: false,
      isWithinWeek: false,
      ageMs,
      ageHours,
      ageDays,
      label: 'EXPIRED (> 7d)',
      timeAgo,
      icon: '⏳',
      badgeBg: 'rgba(148, 163, 184, 0.15)',
      badgeColor: '#94a3b8',
      badgeBorder: '1px solid rgba(148, 163, 184, 0.3)'
    };
  }

  if (isLive) {
    return {
      status: 'LIVE',
      isLive: true,
      isNew: false,
      isWithinWeek: true,
      ageMs,
      ageHours,
      ageDays,
      label: 'LIVE',
      timeAgo,
      icon: '🟢',
      badgeBg: 'rgba(34, 197, 94, 0.18)',
      badgeColor: '#4ade80',
      badgeBorder: '1px solid rgba(34, 197, 94, 0.45)'
    };
  }

  return {
    status: 'NEW',
    isLive: false,
    isNew: true,
    isWithinWeek: true,
    ageMs,
    ageHours,
    ageDays,
    label: ageDays > 0 ? `NEW (${ageDays}d ago)` : `NEW (${ageHours}h ago)`,
    timeAgo,
    icon: '🔵',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    badgeColor: '#38bdf8',
    badgeBorder: '1px solid rgba(56, 189, 248, 0.45)'
  };
}

/**
 * Filter out any items older than 7 days.
 */
export function filterWithinWeek<T = any>(items: any[], getTimestamp: (item: any) => string | number | Date | undefined | null): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => {
    const ts = getTimestamp(item);
    return getDataFreshness(ts).isWithinWeek;
  }) as T[];
}

/**
 * Clean, high-contrast Freshness Badge component with pulsing indicator for LIVE.
 */
export const FreshnessBadge: React.FC<{
  timestamp?: string | number | Date | null;
  showTimeAgo?: boolean;
  size?: 'sm' | 'md';
}> = ({ timestamp, showTimeAgo = true, size = 'sm' }) => {
  const freshness = getDataFreshness(timestamp);

  if (!freshness.isWithinWeek) return null; // never display expired items

  const isSm = size === 'sm';

  return (
    <span
      title={`Data Freshness: ${freshness.status} • Recorded ${freshness.timeAgo} • Valid within 7-day Exasol window`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '5px' : '7px',
        padding: isSm ? '2px 8px' : '4px 10px',
        borderRadius: '8px',
        background: freshness.badgeBg,
        color: freshness.badgeColor,
        border: freshness.badgeBorder,
        fontSize: isSm ? '0.72rem' : '0.8rem',
        fontWeight: 800,
        letterSpacing: '0.03em',
        userSelect: 'none'
      }}
    >
      <span
        style={{
          width: isSm ? '6px' : '8px',
          height: isSm ? '6px' : '8px',
          borderRadius: '50%',
          background: freshness.isLive ? '#22c55e' : '#38bdf8',
          boxShadow: freshness.isLive ? '0 0 8px #22c55e' : '0 0 8px #38bdf8',
          animation: freshness.isLive ? 'pulse 2s infinite' : 'none'
        }}
      />
      <span>{freshness.label}</span>
      {showTimeAgo && freshness.timeAgo && (
        <span style={{ color: freshness.isLive ? '#86efac' : '#93c5fd', fontWeight: 600, opacity: 0.9 }}>
          • {freshness.timeAgo}
        </span>
      )}
    </span>
  );
};
