import { useState, useEffect } from 'react';
import axios from 'axios';

interface KPIData {
  cities_monitored: number;
  total_records: number;
  total_social_posts: number;
  active_alerts: number;
}

export default function KPICards() {
  const [kpis, setKpis] = useState<KPIData | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await axios.get('/api/analytics/kpis');
        setKpis(response.data);
      } catch (error) {
        console.error('Error fetching KPIs', error);
      }
    };
    fetchKPIs();
    const interval = setInterval(fetchKPIs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-icon-box">🏙️</div>
        <div className="kpi-details">
          <div className="value">{kpis ? kpis.cities_monitored.toLocaleString() : '50'}</div>
          <div className="label">Cities Monitored</div>
          <div className="kpi-sub">● Across 28 States & UTs</div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon-box">⚡</div>
        <div className="kpi-details">
          <div className="value">{kpis ? kpis.total_records.toLocaleString() : '5,540'}</div>
          <div className="label">Exasol In-Memory Records</div>
          <div className="kpi-sub">▲ Sub-second SQL scan</div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon-box">#️⃣</div>
        <div className="kpi-details">
          <div className="value">{kpis ? kpis.total_social_posts.toLocaleString() : '42'}</div>
          <div className="label">#IMD Posts Tracked</div>
          <div className="kpi-sub">● NLP Sentiment & Media</div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon-box">🚨</div>
        <div className="kpi-details">
          <div className="value" style={{ color: '#f43f5e' }}>{kpis ? kpis.active_alerts.toLocaleString() : '5'}</div>
          <div className="label">NDMA Active Alerts</div>
          <div className="kpi-sub" style={{ color: '#f43f5e' }}>● Red & Orange Warnings</div>
        </div>
      </div>
    </div>
  );
}