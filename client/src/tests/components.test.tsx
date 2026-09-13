import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FreshnessBadge } from '../utils/freshness';

describe('Frontend Component Tests', () => {
  it('renders LIVE badge with glowing indicator for real-time telemetry', () => {
    const liveTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(<FreshnessBadge timestamp={liveTime} />);
    
    expect(screen.getByText(/LIVE/i)).toBeInTheDocument();
  });

  it('renders NEW badge for data within 48 hours', () => {
    const newTime = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    render(<FreshnessBadge timestamp={newTime} />);
    
    expect(screen.getByText(/NEW/i)).toBeInTheDocument();
  });
});
