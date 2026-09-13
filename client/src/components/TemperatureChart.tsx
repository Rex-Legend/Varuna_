import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const CITY_COLORS: Record<string, string> = {
  'Delhi': '#ef4444',
  'Mumbai': '#0284c7',
  'Bangalore': '#10b981',
  'Kolkata': '#8b5cf6',
  'Jaipur': '#f59e0b',
  'Chennai': '#ec4899',
  'Hyderabad': '#06b6d4'
};

const ALL_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Jaipur', 'Chennai', 'Hyderabad'];

export default function TemperatureChart() {
  const [data, setData] = useState<any[]>([]);
  const [horizon, setHorizon] = useState<'24h' | '7d' | '12m'>('24h');
  const [metric, setMetric] = useState<'temp' | 'humidity'>('temp');
  const [activeCities, setActiveCities] = useState<string[]>(['Delhi', 'Mumbai', 'Bangalore', 'Kolkata']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/analytics/trends?horizon=${horizon}&metric=${metric}`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching trends', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [horizon, metric]);

  const toggleCity = (city: string) => {
    setActiveCities(prev => {
      if (prev.includes(city)) {
        if (prev.length === 1) return prev; // Keep at least one city
        return prev.filter(c => c !== city);
      } else {
        return [...prev, city];
      }
    });
  };

  const selectAll = () => setActiveCities(ALL_CITIES);
  const resetTop3 = () => setActiveCities(['Delhi', 'Mumbai', 'Bangalore']);

  // Calculate highest and lowest across active cities in data
  let peakVal = -Infinity;
  let peakCity = '';
  let minVal = Infinity;
  let minCity = '';

  data.forEach(item => {
    activeCities.forEach(city => {
      const v = item[city];
      if (v !== undefined) {
        if (v > peakVal) {
          peakVal = v;
          peakCity = city;
        }
        if (v < minVal) {
          minVal = v;
          minCity = city;
        }
      }
    });
  });

  const unit = metric === 'temp' ? '°C' : '%';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header & Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            📈 Multi-Station Climate Trajectory
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>
            Exasol in-memory telemetry aggregated across key Indian urban hubs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Metric Selector */}
          <div style={{ background: '#f1f5f9', padding: '3px', borderRadius: '8px', display: 'flex', gap: '2px' }}>
            <button
              onClick={() => setMetric('temp')}
              style={{
                border: 'none',
                background: metric === 'temp' ? '#ffffff' : 'transparent',
                color: metric === 'temp' ? '#0284c7' : '#64748b',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: metric === 'temp' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🌡️ Temp (°C)
            </button>
            <button
              onClick={() => setMetric('humidity')}
              style={{
                border: 'none',
                background: metric === 'humidity' ? '#ffffff' : 'transparent',
                color: metric === 'humidity' ? '#0284c7' : '#64748b',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: metric === 'humidity' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              💧 Humidity (%)
            </button>
          </div>

          {/* Time Horizon Selector */}
          <div style={{ background: '#f1f5f9', padding: '3px', borderRadius: '8px', display: 'flex', gap: '2px' }}>
            {[
              { key: '24h', label: '24H Diurnal' },
              { key: '7d', label: '7-Day' },
              { key: '12m', label: '12-Month' }
            ].map(h => (
              <button
                key={h.key}
                onClick={() => setHorizon(h.key as any)}
                style={{
                  border: 'none',
                  background: horizon === h.key ? '#0284c7' : 'transparent',
                  color: horizon === h.key ? '#ffffff' : '#475569',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: horizon === h.key ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none'
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive City Filter Chips Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
            Compare Stations:
          </span>
          {ALL_CITIES.map(city => {
            const isSelected = activeCities.includes(city);
            const color = CITY_COLORS[city] || '#64748b';
            return (
              <button
                key={city}
                onClick={() => toggleCity(city)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: isSelected ? `2px solid ${color}` : '1px solid #cbd5e1',
                  background: isSelected ? '#ffffff' : '#f1f5f9',
                  color: isSelected ? '#0f172a' : '#94a3b8',
                  fontSize: '0.76rem',
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isSelected ? color : '#cbd5e1'
                }}></span>
                {city}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={selectAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Select All
          </button>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <button
            onClick={resetTop3}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Highlight Stats Snippet */}
      {peakVal > -Infinity && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '0.78rem' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '4px 10px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔥 Peak:</span>
            <strong>{peakCity} {peakVal}{unit}</strong>
          </div>
          <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '8px', padding: '4px 10px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>❄️ Low:</span>
            <strong>{minCity} {minVal}{unit}</strong>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 10px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Δ Variance:</span>
            <strong>{(peakVal - minVal).toFixed(1)}{unit}</strong>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div style={{ flex: 1, minHeight: '260px', width: '100%', position: 'relative' }}>
        {loading ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#64748b', fontSize: '0.88rem' }}>
            Updating Exasol trajectory data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                unit={unit} 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  fontSize: '0.82rem',
                  padding: '10px 14px'
                }}
                formatter={(val: any, name: any) => [`${val} ${unit}`, name]}
                labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}
              />
              {activeCities.map(city => (
                <Line
                  key={city}
                  type="monotone"
                  dataKey={city}
                  stroke={CITY_COLORS[city] || '#0284c7'}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1.5, fill: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
