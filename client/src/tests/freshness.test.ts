import { describe, it, expect } from 'vitest';
import { getDataFreshness, filterWithinWeek, MAX_DATA_AGE_MS } from '../utils/freshness';

describe('Data Freshness & 2-Day Retention Engine Tests', () => {
  it('should mark events younger than 2 hours as LIVE with green indicator', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const freshness = getDataFreshness(thirtyMinsAgo);

    expect(freshness.isLive).toBe(true);
    expect(freshness.status).toBe('LIVE');
    expect(freshness.isWithinTwoDays).toBe(true);
  });

  it('should mark events between 2 hours and 48 hours as NEW', () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const freshness = getDataFreshness(twentyFourHoursAgo);

    expect(freshness.isLive).toBe(false);
    expect(freshness.isNew).toBe(true);
    expect(freshness.status).toBe('NEW');
    expect(freshness.isWithinTwoDays).toBe(true);
  });

  it('should mark events older than 48 hours as EXPIRED', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const freshness = getDataFreshness(threeDaysAgo);

    expect(freshness.status).toBe('EXPIRED');
    expect(freshness.isWithinTwoDays).toBe(false);
    expect(freshness.isWithinWeek).toBe(false);
  });

  it('filterWithinWeek should strictly purge records older than 48 hours', () => {
    const records = [
      { id: 1, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }, // 1h ago -> LIVE
      { id: 2, timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() }, // 20h ago -> NEW
      { id: 3, timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString() }, // 50h ago -> EXPIRED (>48h)
      { id: 4, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5d ago -> EXPIRED
    ];

    const filtered = filterWithinWeek(records, r => r.timestamp);
    expect(filtered.length).toBe(2);
    expect(filtered.map(r => r.id)).toEqual([1, 2]);
  });
});
